import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import authController from '../controllers/authController.js';

const router = express.Router();

// Register new user
router.post('/register', authController.register.bind(authController));

// Login user
router.post('/login', authController.login.bind(authController));

// Request password reset OTP
router.post('/forgot-password', authController.forgotPassword.bind(authController));

// Reset password with OTP
router.post('/reset-password', authController.resetPassword.bind(authController));

// Get current user profile
router.get('/me', authenticateToken, authController.getProfile.bind(authController));

// Upgrade guest to host
router.post('/upgrade-to-host', authenticateToken, authController.upgradeToHost.bind(authController));

export default router;
