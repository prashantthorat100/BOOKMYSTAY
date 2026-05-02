import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Favourite from '../models/Favourite.js';
import Property from '../models/Property.js';

const router = express.Router();

// GET /api/favourites – list all favourited properties for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const favs = await Favourite.find({ user_id: req.user.id })
      .populate('property_id')
      .sort({ createdAt: -1 })
      .lean();

    // Return the property objects with an `id` field (matching frontend expectations)
    const properties = favs
      .filter(f => f.property_id)        // guard against deleted properties
      .map(f => ({ ...f.property_id, id: String(f.property_id._id) }));

    res.json(properties);
  } catch (err) {
    console.error('Get favourites error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/favourites/ids – return just the array of property id strings the user has favourited
// Used by the frontend to initialise heart state on the listing page
router.get('/ids', authenticateToken, async (req, res) => {
  try {
    const favs = await Favourite.find({ user_id: req.user.id }).select('property_id').lean();
    res.json(favs.map(f => String(f.property_id)));
  } catch (err) {
    console.error('Get favourite ids error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/favourites/:propertyId – toggle (add if not present, remove if present)
router.post('/:propertyId', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Validate property exists
    const property = await Property.findById(propertyId).lean();
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const existing = await Favourite.findOne({ user_id: req.user.id, property_id: propertyId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ favourited: false });
    }

    await Favourite.create({ user_id: req.user.id, property_id: propertyId });
    res.json({ favourited: true });
  } catch (err) {
    console.error('Toggle favourite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/favourites/:propertyId – explicitly remove a favourite
router.delete('/:propertyId', authenticateToken, async (req, res) => {
  try {
    await Favourite.deleteOne({ user_id: req.user.id, property_id: req.params.propertyId });
    res.json({ favourited: false });
  } catch (err) {
    console.error('Remove favourite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
