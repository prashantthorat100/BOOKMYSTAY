import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import gmailService from '../utils/gmailService.js';

class PasswordResetController {
  // Helper function to generate secure OTP
  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Helper function to validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Show forgot password form
  showForgotPasswordForm(req, res) {
    try {
      res.render('forgot-password', {
        title: 'Forgot Password - BookMyStay',
        error: req.query.error || null,
        success: req.query.success || null,
        email: req.query.email || ''
      });
    } catch (error) {
      console.error('[FORGOT_PASSWORD] Error rendering forgot password form:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Server error. Please try again later.'
      });
    }
  }

  // Send OTP to user's email
  async sendOtp(req, res) {
    try {
      const { email } = req.body;
      const normalizedEmail = email?.trim().toLowerCase();

      // Validate input
      if (!normalizedEmail) {
        return res.redirect('/forgot-password?error=Email is required');
      }

      if (!this.isValidEmail(normalizedEmail)) {
        return res.redirect('/forgot-password?error=Invalid email format&email=' + encodeURIComponent(normalizedEmail));
      }

      // Check rate limiting - prevent too many requests (1 minute cooldown)
      const existingToken = await PasswordResetToken.findOne({ 
        email: normalizedEmail, 
        used: false, 
        created_at: { $gte: new Date(Date.now() - 60 * 1000) }
      });
      
      if (existingToken) {
        return res.redirect('/forgot-password?error=Please wait before requesting another OTP. Check your email for the previous one.&email=' + encodeURIComponent(normalizedEmail));
      }

      // Check if user exists
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        console.log(`[FORGOT_PASSWORD] Password reset requested for non-existent email: ${normalizedEmail}`);
        // Always return success to prevent email enumeration attacks
        return res.redirect('/verify-otp?email=' + encodeURIComponent(normalizedEmail) + '&success=If this email exists, an OTP has been sent.');
      }

      // Generate OTP and hash it
      const otp = this.generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);

      // Store OTP token with 5-minute expiry
      await PasswordResetToken.create({
        email: normalizedEmail,
        otp_hash: otpHash,
        expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        used: false
      });

      console.log(`[FORGOT_PASSWORD] OTP generated for ${normalizedEmail}`);

      // Send email using Gmail service
      try {
        await gmailService.sendOtpEmail(normalizedEmail, otp);
        console.log(`[FORGOT_PASSWORD] OTP sent successfully to ${normalizedEmail}`);
      } catch (emailError) {
        console.error(`[FORGOT_PASSWORD] Error sending OTP email to ${normalizedEmail}:`, emailError.message);
        return res.redirect('/forgot-password?error=Failed to send OTP email. Please check your email configuration and try again.&email=' + encodeURIComponent(normalizedEmail));
      }

      // Redirect to OTP verification page
      res.redirect('/verify-otp?email=' + encodeURIComponent(normalizedEmail) + '&success=OTP sent to your email. It expires in 5 minutes.');

    } catch (error) {
      console.error('[FORGOT_PASSWORD] Error in sendOtp:', error);
      res.redirect('/forgot-password?error=Server error. Please try again later.');
    }
  }

  // Show OTP verification form
  async showOtpVerificationForm(req, res) {
    try {
      const { email, error, success } = req.query;
      
      if (!email) {
        return res.redirect('/forgot-password?error=Email is required');
      }

      // Verify if there's a valid OTP token for this email
      const token = await PasswordResetToken.findOne({ 
        email: email.toLowerCase(), 
        used: false,
        expires_at: { $gt: new Date() }
      }).sort({ created_at: -1 });

      if (!token) {
        return res.redirect('/forgot-password?error=No valid OTP found for this email. Please request a new one.&email=' + encodeURIComponent(email));
      }

      res.render('verify-otp', {
        title: 'Verify OTP - BookMyStay',
        email: email,
        error: error || null,
        success: success || null
      });

    } catch (error) {
      console.error('[FORGOT_PASSWORD] Error rendering OTP verification form:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Server error. Please try again later.'
      });
    }
  }

  // Verify OTP and show reset password form
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const normalizedEmail = email?.trim().toLowerCase();

      // Validate input
      if (!normalizedEmail || !otp) {
        return res.redirect('/verify-otp?email=' + encodeURIComponent(normalizedEmail) + '&error=Email and OTP are required');
      }

      if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        return res.redirect('/verify-otp?email=' + encodeURIComponent(normalizedEmail) + '&error=OTP must be a 6-digit number');
      }

      // Find the most recent unused token for this email
      const token = await PasswordResetToken.findOne({ 
        email: normalizedEmail, 
        used: false 
      }).sort({ created_at: -1 });
      
      if (!token) {
        return res.redirect('/verify-otp?email=' + encodeURIComponent(normalizedEmail) + '&error=Invalid or expired OTP. Please request a new one.');
      }

      // Check if token has expired
      if (token.expires_at < new Date()) {
        return res.redirect('/verify-otp?email=' + encodeURIComponent(normalizedEmail) + '&error=OTP expired. Please request a new one.');
      }

      // Verify OTP
      const isValidOtp = await bcrypt.compare(otp, token.otp_hash);
      if (!isValidOtp) {
        console.log(`[FORGOT_PASSWORD] Invalid OTP attempt for ${normalizedEmail}: ${otp}`);
        return res.redirect('/verify-otp?email=' + encodeURIComponent(normalizedEmail) + '&error=Invalid OTP');
      }

      // OTP is valid, show reset password form
      res.render('reset-password', {
        title: 'Reset Password - BookMyStay',
        email: normalizedEmail,
        otp: otp,
        error: null,
        success: null
      });

    } catch (error) {
      console.error('[FORGOT_PASSWORD] Error in verifyOtp:', error);
      res.redirect('/verify-otp?email=' + encodeURIComponent(req.body.email) + '&error=Server error. Please try again later.');
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const { email, otp, new_password, confirm_password } = req.body;
      const normalizedEmail = email?.trim().toLowerCase();

      // Validate input
      if (!normalizedEmail || !otp || !new_password || !confirm_password) {
        return res.render('reset-password', {
          title: 'Reset Password - BookMyStay',
          email: normalizedEmail,
          otp: otp,
          error: 'All fields are required',
          success: null
        });
      }

      if (new_password !== confirm_password) {
        return res.render('reset-password', {
          title: 'Reset Password - BookMyStay',
          email: normalizedEmail,
          otp: otp,
          error: 'Passwords do not match',
          success: null
        });
      }

      if (new_password.length < 6) {
        return res.render('reset-password', {
          title: 'Reset Password - BookMyStay',
          email: normalizedEmail,
          otp: otp,
          error: 'Password must be at least 6 characters long',
          success: null
        });
      }

      // Find user
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.redirect('/forgot-password?error=Invalid email or OTP');
      }

      // Find and verify OTP token again
      const token = await PasswordResetToken.findOne({ 
        email: normalizedEmail, 
        used: false 
      }).sort({ created_at: -1 });
      
      if (!token) {
        return res.redirect('/forgot-password?error=Invalid or expired OTP. Please request a new one.');
      }

      // Check if token has expired
      if (token.expires_at < new Date()) {
        return res.redirect('/forgot-password?error=OTP expired. Please request a new one.');
      }

      // Verify OTP again for security
      const isValidOtp = await bcrypt.compare(otp, token.otp_hash);
      if (!isValidOtp) {
        console.log(`[FORGOT_PASSWORD] Invalid OTP during password reset for ${normalizedEmail}: ${otp}`);
        return res.render('reset-password', {
          title: 'Reset Password - BookMyStay',
          email: normalizedEmail,
          otp: otp,
          error: 'Invalid OTP',
          success: null
        });
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
        { email: normalizedEmail, _id: { $ne: token._id }, used: false },
        { $set: { used: true } }
      );

      console.log(`[FORGOT_PASSWORD] Password reset successful for ${normalizedEmail}`);

      // Send confirmation email
      try {
        await gmailService.sendPasswordResetConfirmation(normalizedEmail);
        console.log(`[FORGOT_PASSWORD] Password reset confirmation sent to ${normalizedEmail}`);
      } catch (emailError) {
        console.error('[FORGOT_PASSWORD] Failed to send password reset confirmation:', emailError.message);
        // Don't fail request if confirmation email fails
      }

      // Redirect to login with success message
      res.redirect('/login?success=Password reset successful. You can now log in with your new password.');

    } catch (error) {
      console.error('[FORGOT_PASSWORD] Error in resetPassword:', error);
      res.render('reset-password', {
        title: 'Reset Password - BookMyStay',
        email: req.body.email,
        otp: req.body.otp,
        error: 'Server error. Please try again later.',
        success: null
      });
    }
  }

  // Cancel forgot password flow
  cancel(req, res) {
    res.redirect('/login');
  }
}

export default new PasswordResetController();
