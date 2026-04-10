# Complete Gmail OTP Forgot Password System

## 🎯 **Overview**

This is a complete, production-ready "Forgot Password with OTP via Gmail" authentication system built with Node.js, Express, MongoDB, and EJS. It follows professional security practices and provides excellent user experience.

## 📁 **Files Created**

### **Backend Structure**
```
backend/
├── utils/
│   └── gmailService.js           # Gmail SMTP email service
├── controllers/
│   └── passwordResetController.js  # Complete forgot password logic
├── routes/
│   └── passwordResetRoutes.js    # Route definitions
├── models/
│   └── PasswordResetToken.js   # OTP token model (existing)
├── views/
│   ├── forgot-password-new.ejs   # Email input form
│   ├── verify-otp-new.ejs       # OTP verification form
│   └── reset-password-new.ejs    # Password reset form
└── GMAIL_OTP_SETUP.md           # This guide
```

## 🔄 **Complete Flow**

### **Step 1**: User clicks "Forgot Password"
- Shows email input form with "Send OTP" and "Cancel" buttons
- Professional UI with validation

### **Step 2**: User enters email and clicks "Send OTP"
- Validates email format and checks if user exists
- Generates 6-digit OTP
- Stores OTP with 5-minute expiry
- Sends OTP via Gmail (NOT console)
- Redirects to OTP verification page

### **Step 3**: User enters OTP
- Auto-advance input fields
- Real-time timer showing expiry
- Validates OTP and expiry
- Redirects to reset password form

### **Step 4**: User sets new password
- Password strength indicator
- Password confirmation matching
- Hashes password with bcrypt
- Clears OTP fields
- Sends confirmation email

## ⚙️ **Gmail Configuration**

### **Step 1: Enable 2-Step Verification**
1. Go to https://myaccount.google.com/
2. Click "Security"
3. Enable "2-Step Verification"

### **Step 2: Generate App Password**
1. Go to Security → "2-Step Verification" → "App passwords"
2. Select "Mail" as app
3. Select "Other (Custom name)" as device
4. Enter "BookMyStay" as the name
5. Click "Generate"
6. **Copy the 16-character password** (without spaces)

### **Step 3: Update Environment Variables**
Create/update your `.env` file:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_SECURE=false

# Other existing settings
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017
DB_NAME=bookmystay01
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

**Important**: 
- Use the 16-character App Password (NOT your regular Gmail password)
- Remove spaces from the App Password
- Keep `.env` file secure and never commit to git

## 🚀 **Integration Steps**

### **1. Add Routes to Server**
In your main server file (server.js):

```javascript
import passwordResetRoutes from './routes/passwordResetRoutes.js';

// Add this line to your route setup
app.use('/', passwordResetRoutes);
```

### **2. Update Login Page**
Add "Forgot Password?" link to your login form:

```html
<div class="mb-3">
    <a href="/forgot-password" class="btn btn-link">Forgot Password?</a>
</div>
```

### **3. Install Dependencies**
Ensure you have these packages:

```bash
npm install nodemailer bcryptjs dotenv
```

## 🛡️ **Security Features**

### **OTP Security**
- ✅ 6-digit numeric codes
- ✅ 5-minute expiration
- ✅ Hashed storage with bcrypt
- ✅ Single-use tokens
- ✅ Auto-expiration cleanup

### **Email Security**
- ✅ Gmail App Password authentication
- ✅ No console OTP logging
- ✅ Transporter connection verification
- ✅ Professional HTML email templates

### **Input Security**
- ✅ Email format validation
- ✅ Password strength requirements
- ✅ Password confirmation matching
- ✅ Rate limiting (1-minute cooldown)

### **Attack Prevention**
- ✅ Email enumeration protection
- ✅ Rate limiting
- ✅ Secure token handling
- ✅ Proper error handling

## 📧 **Email Templates**

### **OTP Email**
- Professional HTML design
- Security warnings
- Clear expiration notice
- Brand consistency

### **Confirmation Email**
- Password reset success notification
- Security notice
- Contact information

## 🧪 **Testing the System**

### **1. Start Server**
```bash
cd backend
npm run dev
```

### **2. Test Complete Flow**
1. Go to `http://localhost:5000/login`
2. Click "Forgot Password?"
3. Enter your email address
4. Click "Send OTP" (NOT before)
5. Check your email for OTP (should NOT appear in console)
6. Enter OTP on verification page
7. Reset your password

### **3. Expected Success Messages**
```
[EMAIL] Email service initialized successfully
[EMAIL] SMTP connection verified successfully
[EMAIL] Sending OTP to: your-email@gmail.com
[EMAIL] OTP sent successfully to your-email@gmail.com. Message ID: ...
```

## 🔧 **Route Structure**

```
GET  /forgot-password     → Show email input form
POST /send-otp            → Send OTP to email
GET  /verify-otp          → Show OTP verification form
POST /verify-otp          → Verify OTP and show reset form
POST /reset-password      → Reset password
GET  /cancel-forgot-password → Cancel flow
```

## 🎨 **UI Features**

### **Forgot Password Page**
- Email input with icon
- Send OTP and Cancel buttons
- Loading states
- Error/success messages
- Security notice

### **OTP Verification Page**
- 6-digit input fields with auto-advance
- Real-time countdown timer (5 minutes)
- Paste support for full OTP
- Resend OTP option
- Visual feedback for filled fields

### **Reset Password Page**
- Password strength indicator
- Password confirmation matching
- Show/hide password toggle
- Real-time validation feedback
- Security notice

## 🚨 **Error Handling**

### **Email Service Errors**
- Authentication failures
- Connection timeouts
- Network issues
- Clear error messages to users

### **Validation Errors**
- Invalid email format
- Weak passwords
- Password mismatch
- Expired OTP
- Invalid OTP

### **Database Errors**
- User not found
- Token creation failures
- Password update failures

## 🔍 **Debugging & Logging**

### **Success Logs**
```
[EMAIL] Email service initialized successfully
[EMAIL] SMTP connection verified successfully
[FORGOT_PASSWORD] OTP generated for email@example.com
[FORGOT_PASSWORD] OTP sent successfully to email@example.com
[FORGOT_PASSWORD] Password reset successful for email@example.com
```

### **Error Logs**
```
[EMAIL] Failed to send OTP email to email@example.com: Authentication failed
[FORGOT_PASSWORD] Error sending OTP email to email@example.com: SMTP connection failed
[FORGOT_PASSWORD] Invalid OTP attempt for email@example.com: 123456
```

## 📱 **Responsive Design**

All pages are fully responsive with:
- Bootstrap 5 framework
- Mobile-friendly design
- Touch-friendly inputs
- Proper viewport handling
- Professional gradient backgrounds

## 🌐 **Production Deployment**

### **Required Environment Variables**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-production-app-password
SMTP_SECURE=false
NODE_ENV=production
```

### **Security Checklist**
- [ ] Gmail App Password configured
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] Rate limiting enabled
- [ ] Error monitoring setup
- [ ] Log rotation configured

## 🔄 **Alternative Email Services**

If Gmail doesn't work, you can use:

### **SendGrid** (Recommended for production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
SMTP_SECURE=false
```

### **Outlook/Hotmail**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
```

## 🎯 **Key Benefits**

1. **Professional Flow**: Email input first, then user-controlled OTP sending
2. **Email-Only Delivery**: No console logging, secure OTP delivery
3. **Production Ready**: Comprehensive error handling and security
4. **Excellent UX**: Modern UI with real-time feedback
5. **Secure**: Proper hashing, rate limiting, and validation
6. **Scalable**: Clean MVC structure for maintenance

## 🚀 **Quick Start**

1. **Configure Gmail App Password** (see above)
2. **Update `.env` file** with SMTP credentials
3. **Add routes** to your server
4. **Update login page** with forgot password link
5. **Test complete flow**

## 📞 **Support**

If you encounter issues:

1. **Check Gmail App Password**: Ensure it's 16 characters, no spaces
2. **Verify 2-Step Verification**: Must be enabled on Google account
3. **Check Environment Variables**: Ensure all SMTP variables are set
4. **Monitor Logs**: Check console for detailed error messages
5. **Test Connection**: Run `node test-email.js` to verify email setup

The system is now complete and production-ready with professional Gmail OTP authentication!
