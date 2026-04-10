import express from 'express';
import passwordResetController from '../controllers/passwordResetController.js';

const router = express.Router();

// GET /forgot-password - Show forgot password form (email input + buttons)
router.get('/forgot-password', passwordResetController.showForgotPasswordForm.bind(passwordResetController));

// POST /send-otp - Send OTP to user's email (only when user clicks Send OTP)
router.post('/send-otp', passwordResetController.sendOtp.bind(passwordResetController));

// GET /verify-otp - Show OTP verification form
router.get('/verify-otp', passwordResetController.showOtpVerificationForm.bind(passwordResetController));

// POST /verify-otp - Verify OTP and show reset password form
router.post('/verify-otp', passwordResetController.verifyOtp.bind(passwordResetController));

// POST /reset-password - Reset password (hash password + clear OTP)
router.post('/reset-password', passwordResetController.resetPassword.bind(passwordResetController));

// GET /cancel-forgot-password - Cancel forgot password flow
router.get('/cancel-forgot-password', passwordResetController.cancel.bind(passwordResetController));

export default router;
