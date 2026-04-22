import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import EmailVerificationToken from '../models/EmailVerificationToken.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import emailService from '../utils/emailService.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate secure OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const signJwt = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    // Validate input
    if (!normalizedEmail || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    if (!['guest', 'host'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either guest or host' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: normalizedEmail,
      password_hash: passwordHash,
      name,
      phone: phone || null,
      role: role || 'guest',
      auth_provider: 'email',
      is_email_verified: false
    });

    // Create email verification OTP (10 minutes)
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const tokenDoc = await EmailVerificationToken.create({
      email: normalizedEmail,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      used: false
    });

    try {
      await emailService.sendEmailVerificationOtp(normalizedEmail, otp);
    } catch (emailErr) {
      // Keep DB clean if we couldn't send the OTP
      await EmailVerificationToken.deleteOne({ _id: tokenDoc._id }).catch(() => {});
      await User.deleteOne({ _id: user._id }).catch(() => {});
      return res.status(500).json({
        error: emailErr?.message || 'Failed to send verification OTP email. Please try again.'
      });
    }

    res.status(201).json({ message: 'Verification OTP sent to your email. Please verify to activate your account.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Verify email OTP (activates account + returns JWT)
router.post('/verify-email-otp', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return res.status(400).json({ error: 'OTP must be a 6-digit number' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or OTP' });
    if (user.is_email_verified) {
      const token = signJwt(user);
      return res.json({
        message: 'Email already verified',
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar }
      });
    }

    const tokenDoc = await EmailVerificationToken.findOne({
      email,
      used: false,
      expires_at: { $gt: new Date() }
    }).sort({ created_at: -1 });

    if (!tokenDoc) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' });
    }

    const ok = await bcrypt.compare(otp, tokenDoc.otp_hash);
    if (!ok) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    tokenDoc.used = true;
    await tokenDoc.save();

    user.is_email_verified = true;
    await user.save();

    const jwtToken = signJwt(user);
    return res.json({
      message: 'Email verified successfully',
      token: jwtToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar }
    });
  } catch (error) {
    console.error('[AUTH] Verify email OTP error:', error);
    res.status(500).json({ error: 'Server error during email verification' });
  }
});

// Resend verification OTP
router.post('/resend-verification-otp', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email format' });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If this email exists, an OTP has been sent.' });
    if (user.is_email_verified) return res.json({ message: 'Email already verified' });

    const existingToken = await EmailVerificationToken.findOne({
      email,
      used: false,
      created_at: { $gte: new Date(Date.now() - 60 * 1000) }
    });
    if (existingToken) {
      return res.status(429).json({ error: 'Please wait before requesting another OTP.' });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await EmailVerificationToken.create({
      email,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      used: false
    });
    await emailService.sendEmailVerificationOtp(email, otp);
    return res.json({ message: 'Verification OTP sent to your email.' });
  } catch (error) {
    console.error('[AUTH] Resend verification OTP error:', error);
    res.status(500).json({ error: 'Server error while resending OTP' });
  }
});

// Google Sign-In Login
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    const emailVerified = !!payload?.email_verified;

    if (!email) return res.status(400).json({ error: 'Invalid Google token' });
    if (!emailVerified) return res.status(403).json({ error: 'Google email is not verified' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please sign up first.' });
    }

    if (!user.is_email_verified) {
      // Send OTP
      const existingToken = await EmailVerificationToken.findOne({
        email,
        used: false,
        created_at: { $gte: new Date(Date.now() - 60 * 1000) }
      });
      if (!existingToken) {
        const otp = generateOtp();
        const otpHash = await bcrypt.hash(otp, 10);
        await EmailVerificationToken.create({
          email,
          otp_hash: otpHash,
          expires_at: new Date(Date.now() + 10 * 60 * 1000),
          used: false
        });
        await emailService.sendEmailVerificationOtp(email, otp);
      }
      return res.status(403).json({
        error: 'Email not verified. OTP sent.',
        requiresOtp: true,
        email: user.email
      });
    }

    const token = signJwt(user);
    return res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar }
    });
  } catch (error) {
    console.error('[AUTH] Google login error:', error?.message || error);
    res.status(500).json({ error: 'Server error during Google authentication' });
  }
});

// Google Sign-In Register
router.post('/google-register', async (req, res) => {
  try {
    const { idToken, role, name, dob } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });
    if (!role || !['guest', 'host'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();
    const googleId = payload?.sub;
    const avatar = payload?.picture || null;
    const emailVerified = !!payload?.email_verified;

    if (!email || !googleId) return res.status(400).json({ error: 'Invalid Google token' });
    if (!emailVerified) return res.status(403).json({ error: 'Google email is not verified' });

    let user = await User.findOne({ email });
    if (user) {
       if (!user.is_email_verified) {
          const otp = generateOtp();
          const otpHash = await bcrypt.hash(otp, 10);
          await EmailVerificationToken.create({ email, otp_hash: otpHash, expires_at: new Date(Date.now() + 10 * 60 * 1000), used: false });
          await emailService.sendEmailVerificationOtp(email, otp);
          return res.status(201).json({ message: 'Verification OTP sent.', requiresOtp: true, email: user.email });
       }
       return res.status(400).json({ error: 'Account already exists. Please login.' });
    }

    user = await User.create({
      email,
      password_hash: null,
      name,
      dob: dob || null,
      phone: null,
      role,
      avatar,
      auth_provider: 'google',
      is_email_verified: false,
      google_id: googleId
    });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    
    await EmailVerificationToken.create({
      email,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      used: false
    });
    
    await emailService.sendEmailVerificationOtp(email, otp);
    
    return res.status(201).json({
      message: 'Verification OTP sent to your email. Please verify to activate your account.',
      requiresOtp: true,
      email: user.email
    });
  } catch (error) {
    console.error('[AUTH] Google register error:', error?.message || error);
    res.status(500).json({ error: 'Server error during Google registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const emailInput = req.body.email?.trim().toLowerCase();

    // Validate input
    if (!emailInput || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: emailInput });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.auth_provider === 'google') {
      return res.status(400).json({ error: 'This account uses Google Sign-In. Please continue with Google.' });
    }
    if (!user.is_email_verified) {
      return res.status(403).json({ error: 'Email not verified. Please verify your email to log in.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signJwt(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Request password reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    
    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check rate limiting - prevent too many requests
    const existingToken = await PasswordResetToken.findOne({ 
      email, 
      used: false, 
      created_at: { $gte: new Date(Date.now() - 60 * 1000) } // Last 1 minute
    });
    
    if (existingToken) {
      return res.status(429).json({ 
        error: 'Please wait before requesting another OTP. Check your email for the previous one.' 
      });
    }

    const user = await User.findOne({ email });
    
    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log(`[AUTH] Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({ 
        message: 'If this email exists, an OTP has been sent.' 
      });
    }

    // Generate OTP and hash it
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    // Store OTP token
    await PasswordResetToken.create({
      email,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      used: false
    });

    // Send email using the email service - OTP is ONLY sent via email
    try {
      await emailService.sendOtpEmail(email, otp);
      console.log(`[AUTH] OTP sent successfully to ${email}`);
    } catch (emailError) {
      console.error(`[AUTH] Failed to send OTP email to ${email}:`, emailError.message);
      return res.status(500).json({ 
        error: 'Failed to send OTP email. Please check your email configuration and try again.' 
      });
    }

    return res.json({ 
      message: 'OTP sent to your email. It expires in 10 minutes.'
    });

  } catch (error) {
    console.error('[AUTH] Forgot password error:', error);
    res.status(500).json({ error: 'Server error during password reset request' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { otp, new_password } = req.body;

    // Validate input
    if (!email || !otp || !new_password) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return res.status(400).json({ error: 'OTP must be a 6-digit number' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or OTP' });
    }

    // Find the most recent unused token for this email
    const token = await PasswordResetToken.findOne({ 
      email, 
      used: false 
    }).sort({ created_at: -1 });
    
    if (!token) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Check if token has expired
    if (token.expires_at < new Date()) {
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    // Verify OTP
    const isValidOtp = await bcrypt.compare(otp, token.otp_hash);
    if (!isValidOtp) {
      console.log(`[AUTH] Invalid OTP attempt for ${email}: ${otp}`);
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Hash new password
    const newHash = await bcrypt.hash(new_password, 10);
    
    // Update user password
    user.password_hash = newHash;
    await user.save();

    // Mark token as used
    token.used = true;
    await token.save();

    // Invalidate all other unused tokens for this email
    await PasswordResetToken.updateMany(
      { email, _id: { $ne: token._id }, used: false },
      { $set: { used: true } }
    );

    console.log(`[AUTH] Password reset successful for ${email}`);

    // Send confirmation email
    try {
      await emailService.sendPasswordResetConfirmation(email);
    } catch (emailError) {
      console.error('[AUTH] Failed to send password reset confirmation:', emailError);
      // Don't fail the request if confirmation email fails
    }

    return res.json({ 
      message: 'Password reset successful. You can now log in with your new password.' 
    });

  } catch (error) {
    console.error('[AUTH] Reset password error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('id email name phone role avatar created_at')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upgrade guest to host
router.post('/upgrade-to-host', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'host') {
      return res.status(400).json({ error: 'User is already a host' });
    }

    user.role = 'host';
    await user.save();

    // Generate new JWT token with updated role
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'host' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Successfully upgraded to host',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'host',
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Upgrade to host error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
