import express from 'express';
import { authenticateToken, isHost } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Get payout details (for receiving payments - Razorpay/bank info)
router.get('/payout-details', authenticateToken, isHost, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('payout_details').lean();
    const payout_details = user?.payout_details ?? null;
    let data = {};
    if (payout_details) {
      try {
        data = typeof payout_details === 'string' ? JSON.parse(payout_details) : payout_details;
      } catch (e) {
        data = {};
      }
    }
    res.json(data);
  } catch (error) {
    console.error('Get payout details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update payout details (UPI, bank account, IFSC, beneficiary name)
router.put('/payout-details', authenticateToken, isHost, async (req, res) => {
  try {
    const { upi_id, bank_account, ifsc_code, beneficiary_name } = req.body;
    const payout_details = {
      upi_id: upi_id || null,
      bank_account: bank_account || null,
      ifsc_code: ifsc_code || null,
      beneficiary_name: beneficiary_name || null
    };

    await User.findByIdAndUpdate(req.user.id, { payout_details });
    res.json({ message: 'Payout details updated' });
  } catch (error) {
    console.error('Update payout details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
