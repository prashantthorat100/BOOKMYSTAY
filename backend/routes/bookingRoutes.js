import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

const router = express.Router();

const hasOverlap = async (propertyId, checkIn, checkOut) => {
  const overlapping = await Booking.find({
    property_id: propertyId,
    status: { $ne: 'cancelled' },
    $or: [
      { check_in: { $lte: checkIn }, check_out: { $gt: checkIn } },
      { check_in: { $lt: checkOut }, check_out: { $gte: checkOut } },
      { check_in: { $gte: checkIn }, check_out: { $lte: checkOut } }
    ]
  }).lean();

  return overlapping.length > 0;
};

// Create new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { property_id, check_in, check_out, guests_count } = req.body;

    // Validate input
    if (!property_id || !check_in || !check_out || !guests_count) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if property exists
    const property = await Property.findById(property_id).lean();
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if guests count is valid
    if (Number(guests_count) > property.max_guests) {
      return res.status(400).json({ error: `Property can accommodate maximum ${property.max_guests} guests` });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    // Check availability - no overlapping bookings
    const overlap = await hasOverlap(property._id, checkInDate, checkOutDate);
    if (overlap) {
      return res.status(400).json({ error: 'Property is not available for selected dates' });
    }

    // Calculate total price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * property.price_per_night;

    // Create booking
    const booking = await Booking.create({
      property_id: property._id,
      guest_id: req.user.id,
      check_in: checkInDate,
      check_out: checkOutDate,
      total_price: totalPrice,
      guests_count,
      status: 'confirmed'
    });

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: booking.id,
      totalPrice,
      nights
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bookings
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ guest_id: req.user.id })
      .populate({ path: 'property_id', select: 'title city country images price_per_night' })
      .sort({ created_at: -1 })
      .lean({ virtuals: true });

    const response = bookings.map((b) => {
      const property = b.property_id || {};
      const base = { ...b };
      delete base.property_id;
      return {
        ...base,
        guest_id: b.guest_id ? String(b.guest_id) : null,
        property_id: property._id ? property._id.toString() : null,
        title: property.title,
        city: property.city,
        country: property.country,
        images: property.images,
        price_per_night: property.price_per_night
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get host's property bookings
router.get('/host', authenticateToken, async (req, res) => {
  try {
    const hostProperties = await Property.find({ host_id: req.user.id }).select('_id').lean();
    const hostPropertyIds = hostProperties.map((p) => p._id);

    if (!hostPropertyIds.length) {
      return res.json([]);
    }

    const bookings = await Booking.find({ property_id: { $in: hostPropertyIds } })
      .populate({ path: 'property_id', select: 'title' })
      .populate({ path: 'guest_id', select: 'name email' })
      .sort({ created_at: -1 })
      .lean({ virtuals: true });

    const response = bookings.map((b) => {
      const property = b.property_id || {};
      const guest = b.guest_id || {};
      const base = { ...b };
      delete base.property_id;
      delete base.guest_id;
      return {
        ...base,
        property_id: property._id ? property._id.toString() : null,
        title: property.title,
        guest_id: guest._id ? guest._id.toString() : null,
        guest_name: guest.name,
        guest_email: guest.email
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Get host bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'property_id', select: 'host_id' })
      .lean({ virtuals: true });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const propertyHostId = booking.property_id?.host_id ? String(booking.property_id.host_id) : null;
    const guestId = booking.guest_id ? String(booking.guest_id) : null;

    // Check authorization (guest or host can update)
    if (guestId !== req.user.id && propertyHostId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    await Booking.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check availability
router.get('/check-availability', async (req, res) => {
  try {
    const { property_id, check_in, check_out } = req.query;

    if (!property_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    const overlap = await hasOverlap(property_id, checkInDate, checkOutDate);

    res.json({ available: !overlap });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
