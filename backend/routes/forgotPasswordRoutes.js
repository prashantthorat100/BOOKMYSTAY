import express from 'express';
import forgotPasswordController from '../controllers/forgotPasswordController.js';

const router = express.Router();

// GET /forgot-password - Show forgot password form
router.get('/forgot-password', forgotPasswordController.showForgotPasswordForm.bind(forgotPasswordController));

// POST /send-otp - Send OTP to user's email
router.post('/send-otp', forgotPasswordController.sendOtp.bind(forgotPasswordController));

// GET /verify-otp - Show OTP verification form
router.get('/verify-otp', forgotPasswordController.showOtpVerificationForm.bind(forgotPasswordController));

// POST /verify-otp - Verify OTP and show reset password form
router.post('/verify-otp', forgotPasswordController.verifyOtp.bind(forgotPasswordController));

// GET /reset-password - Show reset password form (after OTP verification)
router.get('/reset-password', forgotPasswordController.showResetPasswordForm.bind(forgotPasswordController));

// POST /reset-password - Reset password
router.post('/reset-password', forgotPasswordController.resetPassword.bind(forgotPasswordController));

// GET /cancel-forgot-password - Cancel forgot password flow
router.get('/cancel-forgot-password', forgotPasswordController.cancel.bind(forgotPasswordController));

export default router;
