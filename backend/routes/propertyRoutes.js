import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, isHost } from '../middleware/authMiddleware.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Payment from '../models/Payment.js';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const normalizeProperty = (property, stats) => {
  const stat = stats?.get(String(property._id)) || { avg_rating: 0, review_count: 0 };
  const host = property.host_id || {};

  const id = property._id ? property._id.toString() : property.id;
  const base = { ...property };
  delete base._id;
  delete base.host_id;
  delete base.id;

  // Clear expired offers automatically
  if (base.offer_valid_till && new Date(base.offer_valid_till) < new Date()) {
    base.offer_title = '';
    base.discount_percentage = 0;
    base.offer_valid_till = null;
  }

  let finalHostId = null;
  if (property.host_id) {
    if (property.host_id._id) {
      finalHostId = property.host_id._id.toString();
    } else {
      // In case property.host_id is simply an ObjectId (if populate skipped) or string
      finalHostId = property.host_id.toString();
    }
  }

  return {
    id,
    ...base,
    host_id: finalHostId,
    host_name: host.name || null,
    host_email: host.email || null,
    host_avatar: host.avatar || null,
    avg_rating: stat.avg_rating || 0,
    review_count: stat.review_count || 0
  };
};

const buildReviewStatsMap = async (propertyIds) => {
  if (!propertyIds.length) return new Map();
  const stats = await Review.aggregate([
    { $match: { property_id: { $in: propertyIds } } },
    {
      $group: {
        _id: '$property_id',
        avg_rating: { $avg: '$rating' },
        review_count: { $sum: 1 }
      }
    }
  ]);
  const map = new Map();
  stats.forEach((item) => {
    map.set(String(item._id), { avg_rating: item.avg_rating, review_count: item.review_count });
  });
  return map;
};

const parseComparisons = (value) => {
  if (!value) return [];
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => ({
      platform: item?.platform?.trim?.() || '',
      price: item?.price !== '' && item?.price != null ? parseFloat(item.price) : null,
      url: item?.url?.trim?.() || ''
    }))
    .filter((item) => item.platform && item.price != null && !Number.isNaN(item.price));
};

// Get all properties with search, filters and optional availability check
router.get('/', async (req, res) => {
  try {
    const {
      city,
      property_type,
      min_price,
      max_price,
      guests,
      check_in,
      check_out
    } = req.query;

    const filters = {};

    if (city) {
      filters.city = { $regex: city, $options: 'i' };
    }
    if (property_type) {
      filters.property_type = property_type;
    }
    if (min_price || max_price) {
      filters.price_per_night = {};
      if (min_price) filters.price_per_night.$gte = parseFloat(min_price);
      if (max_price) filters.price_per_night.$lte = parseFloat(max_price);
    }
    if (guests) {
      filters.max_guests = { $gte: parseInt(guests, 10) };
    }

    const properties = await Property.find(filters)
      .populate({ path: 'host_id', select: 'name email avatar' })
      .sort({ created_at: -1 })
      .lean({ virtuals: true });

    const propertyIds = properties.map((p) => p._id);
    let unavailable = [];

    if (check_in && check_out && propertyIds.length) {
      const checkInDate = new Date(check_in);
      const checkOutDate = new Date(check_out);

      const overlapping = await Booking.find({
        property_id: { $in: propertyIds },
        status: { $ne: 'cancelled' },
        $or: [
          { check_in: { $lte: checkInDate }, check_out: { $gt: checkInDate } },
          { check_in: { $lt: checkOutDate }, check_out: { $gte: checkOutDate } },
          { check_in: { $gte: checkInDate }, check_out: { $lte: checkOutDate } }
        ]
      }).distinct('property_id');

      unavailable = overlapping.map((id) => String(id));
    }

    const statsMap = await buildReviewStatsMap(propertyIds);

    const response = properties
      .filter((p) => !unavailable.includes(String(p._id)))
      .map((p) => normalizeProperty(p, statsMap));

    res.json(response);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate({ path: 'host_id', select: 'name email avatar' })
      .lean({ virtuals: true });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const statsMap = await buildReviewStatsMap([property._id]);

    res.json(normalizeProperty(property, statsMap));
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new property (host only)
router.post('/', authenticateToken, isHost, upload.array('images', 10), async (req, res) => {
  try {
    const {
      title, description, property_type, price_per_night,
      bedrooms, bathrooms, max_guests, address, city, country,
      latitude, longitude, amenities, discount_percentage, offer_title, offer_valid_till, price_comparisons
    } = req.body;

    // Validate required fields
    if (!title || !property_type || !price_per_night || !city || !country || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields (title, type, price, city, country, latitude, longitude)' });
    }

    // Process uploaded images
    const images = req.files ? req.files.map((file) => file.filename) : [];

    // Parse amenities if it's a string
    let amenitiesArray = amenities;
    if (typeof amenities === 'string') {
      try {
        amenitiesArray = JSON.parse(amenities);
      } catch (e) {
        amenitiesArray = [];
      }
    }

    const comparisons = parseComparisons(price_comparisons);

    const property = await Property.create({
      host_id: req.user.id,
      title,
      description,
      property_type,
      price_per_night: parseFloat(price_per_night),
      bedrooms: parseInt(bedrooms, 10) || 1,
      bathrooms: parseInt(bathrooms, 10) || 1,
      max_guests: parseInt(max_guests, 10) || 1,
      address,
      city,
      country,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      discount_percentage: discount_percentage ? parseFloat(discount_percentage) : 0,
      offer_title: offer_title || '',
      offer_valid_till: offer_valid_till || null,
      price_comparisons: comparisons,
      amenities: amenitiesArray || [],
      images
    });

    res.status(201).json({
      message: 'Property created successfully',
      propertyId: property.id
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update property (host only)
router.put('/:id', authenticateToken, isHost, upload.array('images', 10), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).lean();

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (String(property.host_id) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this property' });
    }

    const {
      title, description, property_type, price_per_night,
      bedrooms, bathrooms, max_guests, address, city, country,
      latitude, longitude, amenities, discount_percentage, offer_title, offer_valid_till, price_comparisons
    } = req.body;

    const newImages = req.files ? req.files.map((file) => file.filename) : [];

    let baseImages = [];
    if (req.body.existingImages) {
      try {
        baseImages = JSON.parse(req.body.existingImages);
      } catch (e) {
        baseImages = [];
      }
    } else {
      baseImages = property.images || [];
    }
    const updatedImages = [...baseImages, ...newImages];

    let amenitiesVal = amenities;
    if (typeof amenities === 'string') {
      try {
        amenitiesVal = JSON.parse(amenities);
      } catch (e) {
        amenitiesVal = [];
      }
    }

    const comparisons = parseComparisons(price_comparisons);

    await Property.findByIdAndUpdate(req.params.id, {
      $set: {
        title: title ?? property.title,
        description: description ?? property.description,
        property_type: property_type ?? property.property_type,
        price_per_night: price_per_night ? parseFloat(price_per_night) : property.price_per_night,
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : property.bedrooms,
        bathrooms: bathrooms ? parseInt(bathrooms, 10) : property.bathrooms,
        max_guests: max_guests ? parseInt(max_guests, 10) : property.max_guests,
        address: address ?? property.address,
        city: city ?? property.city,
        country: country ?? property.country,
        latitude: latitude ? parseFloat(latitude) : property.latitude,
        longitude: longitude ? parseFloat(longitude) : property.longitude,
        discount_percentage: discount_percentage !== undefined ? parseFloat(discount_percentage || 0) : property.discount_percentage,
        offer_title: offer_title !== undefined ? offer_title : property.offer_title,
        offer_valid_till: offer_valid_till !== undefined ? (offer_valid_till || null) : property.offer_valid_till,
        price_comparisons: price_comparisons !== undefined ? comparisons : property.price_comparisons,
        amenities: amenitiesVal ?? property.amenities,
        images: updatedImages
      }
    });

    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete property (host only)
router.delete('/:id', authenticateToken, isHost, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).lean();

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (String(property.host_id) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this property' });
    }

    const bookingIds = await Booking.find({ property_id: property._id }).distinct('_id');

    await Promise.all([
      Property.findByIdAndDelete(property._id),
      Booking.deleteMany({ property_id: property._id }),
      Review.deleteMany({ property_id: property._id }),
      bookingIds.length ? Payment.deleteMany({ booking_id: { $in: bookingIds } }) : Promise.resolve()
    ]);

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
