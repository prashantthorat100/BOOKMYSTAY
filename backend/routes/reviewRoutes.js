import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';

const router = express.Router();

// Add review for a property
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { property_id, rating, comment } = req.body;

    // Validate input
    if (!property_id || !rating) {
      return res.status(400).json({ error: 'Property ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user has completed a booking for this property
    const completedStay = await Booking.exists({
      property_id,
      guest_id: req.user.id,
      status: { $in: ['completed', 'confirmed'] }
    });

    if (!completedStay) {
      return res.status(403).json({ error: 'You can only review properties you have stayed at' });
    }

    // Check if user already reviewed this property
    const existingReview = await Review.exists({ property_id, user_id: req.user.id });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this property' });
    }

    // Create review
    const review = await Review.create({
      property_id,
      user_id: req.user.id,
      rating,
      comment
    });

    res.status(201).json({
      message: 'Review added successfully',
      reviewId: review.id
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reviews for a property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const reviews = await Review.find({ property_id: req.params.propertyId })
      .populate({ path: 'user_id', select: 'name avatar' })
      .sort({ created_at: -1 })
      .lean({ virtuals: true });

    const response = reviews.map((r) => {
      const user = r.user_id || {};
      const base = { ...r };
      delete base.user_id;
      return {
        ...base,
        user_id: user._id ? user._id.toString() : null,
        user_name: user.name,
        user_avatar: user.avatar
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete review (author only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).lean();

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (String(review.user_id) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
