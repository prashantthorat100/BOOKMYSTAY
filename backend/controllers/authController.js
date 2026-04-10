import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import emailService from '../utils/emailService.js';

class AuthController {
  // Helper function to generate secure OTP
  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Helper function to validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Helper function to generate JWT token
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  // Register new user
  async register(req, res) {
    try {
      const { email, password, name, phone, role } = req.body;
      const normalizedEmail = email?.trim().toLowerCase();

      // Validate input
      if (!normalizedEmail || !password || !name || !role) {
        return res.status(400).json({ error: 'Email, password, name, and role are required' });
      }

      if (!this.isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
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
        name: name.trim(),
        phone: phone?.trim() || null,
        role: role || 'guest'
      });

      // Generate JWT token
      const token = this.generateToken(user);

      console.log(`[AUTH] New user registered: ${normalizedEmail}`);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: normalizedEmail,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('[AUTH] Registration error:', error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { password } = req.body;
      const emailInput = req.body.email?.trim().toLowerCase();

      // Validate input
      if (!emailInput || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (!this.isValidEmail(emailInput)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Find user
      const user = await User.findOne({ email: emailInput });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = this.generateToken(user);

      console.log(`[AUTH] User logged in: ${emailInput}`);

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
      console.error('[AUTH] Login error:', error);
      res.status(500).json({ error: 'Server error during login' });
    }
  }

  // Request password reset OTP
  async forgotPassword(req, res) {
    try {
      const email = req.body.email?.trim().toLowerCase();
      
      // Validate input
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      if (!this.isValidEmail(email)) {
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
      const otp = this.generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);

      // Store OTP token
      await PasswordResetToken.create({
        email,
        otp_hash: otpHash,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        used: false
      });

      console.log(`[AUTH] OTP generated for ${email}: ${otp}`);

      // Send email using the email service
      const emailResult = await emailService.sendOtpEmail(email, otp);
      
      if (!emailResult.success && !emailResult.fallbackUsed) {
        console.error(`[AUTH] Failed to send OTP email to ${email}:`, emailResult.error);
        // Still return success to user, but log the error
        return res.status(200).json({ 
          message: 'If this email exists, an OTP has been sent.',
          warning: 'Email service encountered issues, but OTP was generated.'
        });
      }

      const responseMessage = emailResult.devMode 
        ? 'OTP generated (development mode). Check console for the code.'
        : 'OTP sent to your email. It expires in 10 minutes.';

      return res.json({ 
        message: responseMessage,
        devMode: emailResult.devMode || false,
        previewUrl: emailResult.previewUrl || null
      });

    } catch (error) {
      console.error('[AUTH] Forgot password error:', error);
      res.status(500).json({ error: 'Server error during password reset request' });
    }
  }

  // Reset password with OTP
  async resetPassword(req, res) {
    try {
      const email = req.body.email?.trim().toLowerCase();
      const { otp, new_password } = req.body;

      // Validate input
      if (!email || !otp || !new_password) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
      }

      if (!this.isValidEmail(email)) {
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
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .select('id email name phone role avatar created_at')
        .lean();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('[AUTH] Get profile error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Upgrade guest to host
  async upgradeToHost(req, res) {
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
      const token = this.generateToken(user);

      console.log(`[AUTH] User upgraded to host: ${user.email}`);

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
      console.error('[AUTH] Upgrade to host error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

export default new AuthController();
