import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

class GmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_SECURE
    } = process.env;

    // Check if all required SMTP credentials are present
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      console.log('[EMAIL] SMTP credentials not found. Email service is NOT configured.');
      console.log('[EMAIL] Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS, // Use App Password for Gmail
        },
        // Add these options for better Gmail compatibility
        tls: {
          rejectUnauthorized: false
        },
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development'
      });

      this.isConfigured = true;
      console.log('[EMAIL] Email service initialized successfully');
    } catch (error) {
      console.error('[EMAIL] Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async verifyConnection() {
    if (!this.isConfigured || !this.transporter) {
      console.error('[EMAIL] Email service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('[EMAIL] SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('[EMAIL] SMTP connection verification failed:', error.message);
      return false;
    }
  }

  async sendOtpEmail(to, otp) {
    try {
      // CRITICAL: If email service is not configured, throw error - NO console logging
      if (!this.isConfigured) {
        throw new Error('Email service not configured. Please set SMTP credentials in environment variables.');
      }

      // Verify connection before sending
      const isConnected = await this.verifyConnection();
      if (!isConnected) {
        throw new Error('SMTP connection failed');
      }

      const mailOptions = {
        from: `"BookMyStay" <${process.env.SMTP_USER}>`,
        to: to,
        subject: 'Your BookMyStay Password Reset Code',
        html: this.generateOtpEmailTemplate(otp),
        text: `Your OTP is ${otp}. It expires in 5 minutes.`
      };

      console.log(`[EMAIL] Sending OTP to: ${to}`);
      
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`[EMAIL] OTP sent successfully to ${to}. Message ID: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        previewUrl: nodemailer.getTestMessageUrl(result)
      };

    } catch (error) {
      console.error(`[EMAIL] Failed to send OTP email to ${to}:`, error.message);
      
      // CRITICAL: Never log OTP to console - throw error instead
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }

  generateOtpEmailTemplate(otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BookMyStay Password Reset</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #FF5A5F;
            margin-bottom: 10px;
          }
          .otp-code {
            background-color: #FF5A5F;
            color: white;
            font-size: 32px;
            font-weight: bold;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
            letter-spacing: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .security-note {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">BookMyStay</div>
            <h2>Password Reset Code</h2>
          </div>
          
          <p>Hello,</p>
          <p>You requested to reset your password for your BookMyStay account. Use the verification code below to proceed:</p>
          
          <div class="otp-code">${otp}</div>
          
          <div class="warning">
            <strong>Important:</strong> This code will expire in 5 minutes for security reasons.
          </div>
          
          <div class="security-note">
            <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your OTP.
          </div>
          
          <p>If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
          
          <div class="footer">
            <p>Best regards,<br>The BookMyStay Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPasswordResetConfirmation(to) {
    try {
      if (!this.isConfigured) {
        throw new Error('Email service not configured');
      }

      const mailOptions = {
        from: `"BookMyStay" <${process.env.SMTP_USER}>`,
        to: to,
        subject: 'BookMyStay Password Reset Successful',
        html: this.generatePasswordResetConfirmationTemplate(),
        text: 'Your password has been successfully reset. If you did not make this change, please contact support immediately.'
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Password reset confirmation sent to: ${to}`);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('[EMAIL] Failed to send password reset confirmation:', error.message);
      throw error;
    }
  }

  generatePasswordResetConfirmationTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BookMyStay Password Reset Confirmation</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #FF5A5F;
            margin-bottom: 10px;
          }
          .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">BookMyStay</div>
            <h2>Password Reset Successful</h2>
          </div>
          
          <div class="success">
            <strong>Success!</strong> Your password has been successfully reset.
          </div>
          
          <p>You can now log in to your account with your new password.</p>
          
          <p>If you did not make this change, please contact our support team immediately.</p>
          
          <div class="footer">
            <p>Best regards,<br>The BookMyStay Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Create and export singleton instance
const gmailService = new GmailService();

export default gmailService;
