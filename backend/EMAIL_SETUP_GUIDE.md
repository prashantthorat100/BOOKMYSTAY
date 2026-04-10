# BookMyStay - Email OTP Setup Guide

## Overview
This guide will help you set up the Gmail SMTP service for sending OTP emails for password reset functionality.

## What Was Fixed

### Issues in Your Previous Implementation:
1. **Missing Gmail App Password**: Using regular Gmail password instead of App Password
2. **Poor Error Handling**: No proper logging or fallback mechanisms
3. **No Connection Verification**: Not checking SMTP connection before sending
4. **Basic Email Template**: Plain text emails without proper formatting
5. **No Rate Limiting**: Vulnerable to spam attacks
6. **Missing Email Validation**: Basic input validation
7. **No Development Mode**: Hard to test without proper SMTP setup

### What We Fixed:
1. **Proper Gmail App Password Support**: Configured for Gmail App Password authentication
2. **Comprehensive Error Handling**: Added logging, fallback to console, and proper error messages
3. **SMTP Connection Verification**: Tests connection before sending emails
4. **Professional HTML Email Templates**: Beautiful, responsive email templates
5. **Rate Limiting**: Prevents OTP spam (1 minute cooldown)
6. **Input Validation**: Email format, OTP format, password strength validation
7. **Development Mode**: Works without SMTP setup by logging OTPs to console
8. **Security Enhancements**: Email enumeration protection, token invalidation
9. **MVC Structure**: Clean separation of concerns with controllers and utilities

## Setup Instructions

### Step 1: Gmail App Password Setup

**IMPORTANT**: You must use an App Password, NOT your regular Gmail password.

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to https://myaccount.google.com/
   - Click on "Security"
   - Under "Signing in to Google", enable "2-Step Verification"

2. **Generate App Password**:
   - Still in Security settings, click on "2-Step Verification"
   - Scroll down and click on "App passwords"
   - Under "Select app", choose "Mail"
   - Under "Select device", choose "Other (Custom name)"
   - Enter "BookMyStay" as the name
   - Click "Generate"
   - Copy the 16-character password (without spaces)

### Step 2: Update Environment Variables

Create/update your `.env` file with the following:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_SECURE=false
```

**Important Notes**:
- Replace `your-gmail-address@gmail.com` with your actual Gmail address
- Replace `your-16-character-app-password` with the App Password you generated
- Do NOT include spaces in the App Password
- Keep this file secure and never commit it to version control

### Step 3: Test the Configuration

1. **Start your server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test OTP functionality**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/forgot-password \
   -H "Content-Type: application/json" \
   -d '{"email": "your-test-email@gmail.com"}'
   ```

3. **Check console logs**:
   - You should see `[EMAIL] Email service initialized successfully`
   - OTP will be logged if in development mode or if email fails

### Step 4: Production Deployment

For production, ensure:

1. **Environment Variables**: Set all SMTP environment variables
2. **Security**: Use environment-specific secrets management
3. **Monitoring**: Monitor email delivery logs
4. **Domain**: Consider using a custom domain with professional email service

## Alternative Email Providers

If you prefer not to use Gmail, here are alternatives:

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
```

### SendGrid (Recommended for Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
SMTP_SECURE=false
```

## Troubleshooting

### Common Issues and Solutions:

1. **"Authentication failed" Error**
   - **Cause**: Using regular password instead of App Password
   - **Solution**: Generate and use Gmail App Password

2. **"Connection timeout" Error**
   - **Cause**: Network issues or firewall blocking SMTP
   - **Solution**: Check network connectivity, try different port (465 with secure=true)

3. **"Email not received"**
   - **Cause**: Email in spam folder or blocked by Gmail
   - **Solution**: Check spam folder, ensure "From" address matches SMTP_USER

4. **"Invalid domain" Error**
   - **Cause**: Incorrect SMTP_HOST
   - **Solution**: Use correct SMTP server for your email provider

5. **"Too many requests" Error**
   - **Cause**: Rate limiting triggered
   - **Solution**: Wait 1 minute between OTP requests

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

This will enable:
- Detailed SMTP connection logs
- Email preview URLs (for testing)
- Console fallback for OTPs

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use different App Passwords** for different applications
3. **Regularly rotate App Passwords**
4. **Monitor email delivery** for unusual activity
5. **Implement rate limiting** on OTP endpoints
6. **Use HTTPS** in production
7. **Log security events** (failed OTP attempts, etc.)

## Testing Endpoints

### Request OTP
```bash
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```

### Reset Password
```bash
POST /api/auth/reset-password
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "newSecurePassword123"
}
```

### Expected Responses

**Success (OTP Request)**:
```json
{
  "message": "OTP sent to your email. It expires in 10 minutes.",
  "devMode": false,
  "previewUrl": "https://ethereal.email/message/..."
}
```

**Development Mode**:
```json
{
  "message": "OTP generated (development mode). Check console for the code.",
  "devMode": true
}
```

## File Structure

```
backend/
|
|-- utils/
|   |-- emailService.js          # Email service utility
|
|-- controllers/
|   |-- authController.js        # Authentication controller
|
|-- routes/
|   |-- authRoutes.js            # Original routes (updated)
|   |-- authRoutesNew.js         # New MVC structure routes
|
|-- models/
|   |-- PasswordResetToken.js    # OTP token model
|
|-- .env.example                 # Environment variables template
```

## Migration Notes

To use the new MVC structure:

1. **Replace in server.js**:
   ```javascript
   // Old
   import authRoutes from './routes/authRoutes.js';
   
   // New
   import authRoutes from './routes/authRoutesNew.js';
   ```

2. **Or keep using updated authRoutes.js** which has all the fixes applied

## Support

If you encounter issues:

1. Check console logs for detailed error messages
2. Verify Gmail App Password setup
3. Ensure all environment variables are set correctly
4. Test with a different email provider if needed

The system is designed to be robust and will fall back to console logging in development mode if email configuration is incomplete.
