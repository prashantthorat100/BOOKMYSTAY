# Professional Forgot Password Flow - Setup Instructions

## Overview

This implementation provides a production-ready forgot password flow with proper email sending, security measures, and professional user experience.

## Key Features

### 1. **Professional User Flow**
- Step 1: Email input form with Send OTP/Cancel buttons
- Step 2: OTP verification with 6-digit input and timer
- Step 3: Password reset with strength indicator and confirmation

### 2. **Email Service Improvements**
- **Gmail App Password authentication** (NOT regular password)
- **No console OTP logging** in production
- **Professional HTML email templates**
- **Proper error handling and logging**
- **Connection verification before sending**

### 3. **Security Features**
- **Rate limiting** (1-minute cooldown between OTP requests)
- **Email enumeration protection** (always returns success)
- **OTP expiration** (10 minutes)
- **Secure password hashing** with bcrypt
- **Input validation and sanitization**

### 4. **User Experience**
- **Responsive design** with Bootstrap 5
- **Real-time password strength indicator**
- **Auto-advance OTP input fields**
- **Loading states and error messages**
- **Professional email templates**

## Files Created

```
backend/
|
|-- utils/
|   |-- emailUtils.js              # Email service utility
|
|-- controllers/
|   |-- forgotPasswordController.js # Forgot password logic
|
|-- routes/
|   |-- forgotPasswordRoutes.js     # Route definitions
|
|-- views/
|   |-- forgot-password.ejs         # Email input form
|   |-- verify-otp.ejs              # OTP verification form
|   |-- reset-password.ejs          # Password reset form
|
|-- env.example                     # Environment variables template
|-- SETUP_INSTRUCTIONS.md          # This file
```

## Setup Instructions

### Step 1: Gmail App Password Setup

**CRITICAL**: You must use a Gmail App Password, NOT your regular password.

1. **Enable 2-Step Verification**:
   - Go to https://myaccount.google.com/
   - Click on "Security"
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to Security -> "2-Step Verification" -> "App passwords"
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter "BookMyStay" as the name
   - Click "Generate"
   - Copy the 16-character password (without spaces)

### Step 2: Environment Configuration

Create/update your `.env` file:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_SECURE=false
```

### Step 3: Install Dependencies

Ensure you have these dependencies installed:

```bash
npm install nodemailer bcryptjs
```

### Step 4: Update Your Server

Add the new routes to your main server file:

```javascript
import forgotPasswordRoutes from './routes/forgotPasswordRoutes.js';

// Add this line to your route setup
app.use('/', forgotPasswordRoutes);
```

### Step 5: Update Your Login Page

Add a "Forgot Password?" link to your login form:

```html
<a href="/forgot-password" class="btn btn-link">Forgot Password?</a>
```

## Route Structure

```
GET  /forgot-password          -> Show email input form
POST /send-otp                 -> Send OTP to email
GET  /verify-otp              -> Show OTP verification form
POST /verify-otp              -> Verify OTP and show reset form
GET  /reset-password          -> Show reset password form
POST /reset-password          -> Reset password
GET  /cancel-forgot-password  -> Cancel flow (redirect to login)
```

## Security Measures

### 1. **Rate Limiting**
- Prevents OTP spam (1-minute cooldown)
- Implemented at the controller level

### 2. **Email Enumeration Protection**
- Always returns success for email existence
- Prevents attackers from discovering valid emails

### 3. **OTP Security**
- 6-digit numeric codes
- 10-minute expiration
- Hashed storage with bcrypt
- Single-use tokens

### 4. **Input Validation**
- Email format validation
- OTP format validation
- Password strength requirements
- Password confirmation matching

## Email Templates

### OTP Email
- Professional HTML design
- Security warnings
- Clear expiration notice
- Brand consistency

### Confirmation Email
- Password reset success notification
- Security notice
- Contact information

## Error Handling

### Development Mode
- Detailed error logging
- Console OTP logging (development only)
- Email preview URLs

### Production Mode
- No OTP logging to console
- User-friendly error messages
- Graceful email service failures

## Testing

### Test the Complete Flow:

1. **Start your server**:
   ```bash
   npm run dev
   ```

2. **Visit forgot password page**:
   ```
   http://localhost:5000/forgot-password
   ```

3. **Test with valid email**:
   - Enter your email
   - Click "Send OTP"
   - Check email for OTP
   - Enter OTP in verification form
   - Reset password

4. **Test error cases**:
   - Invalid email format
   - Non-existent email
   - Expired OTP
   - Wrong OTP
   - Password mismatch

## Troubleshooting

### Common Issues:

1. **"Email service not configured"**
   - Check SMTP environment variables
   - Verify Gmail App Password setup

2. **"Authentication failed"**
   - Using regular password instead of App Password
   - Incorrect App Password

3. **"Connection timeout"**
   - Network issues
   - Firewall blocking SMTP

4. **"Email not received"**
   - Check spam folder
   - Verify "From" address matches SMTP_USER

### Debug Mode:

Enable detailed logging:
```env
NODE_ENV=development
```

This enables:
- SMTP connection logs
- Email preview URLs
- Console OTP logging (development only)

## Production Deployment

### Required:
1. Set all SMTP environment variables
2. Use production email service (SendGrid recommended)
3. Enable HTTPS
4. Configure proper logging
5. Monitor email delivery

### Recommended Email Services:
- **SendGrid** (production)
- **Mailgun** (production)
- **AWS SES** (enterprise)

## Integration with Existing Code

### To integrate with your existing authentication:

1. **Replace your current forgot password routes** with the new ones
2. **Update your login page** to include the forgot password link
3. **Ensure your User model** has the required fields
4. **Test the complete flow**

### Backward Compatibility:

The new implementation is designed to work with your existing:
- User model
- Database structure
- Authentication middleware

## Support

If you encounter issues:

1. Check console logs for detailed error messages
2. Verify Gmail App Password setup
3. Ensure all environment variables are set
4. Test with a different email provider if needed

The system is production-ready with comprehensive error handling and security measures.
