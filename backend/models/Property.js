import mongoose from 'mongoose';
import { baseSchemaOptions } from './baseOptions.js';

const propertySchema = new mongoose.Schema({
  host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  property_type: { type: String, enum: ['apartment', 'house', 'villa', 'cabin', 'hotel'], required: true },
  price_per_night: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  max_guests: { type: Number, required: true },
  address: { type: String, default: '' },
  city: { type: String, required: true },
  country: { type: String, required: true },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  discount_percentage: { type: Number, default: 0 },
  offer_title: { type: String, default: '' },
  offer_valid_till: { type: Date, default: null },
  price_comparisons: {
    type: [
      {
        platform: { type: String, default: '' },
        price: { type: Number, default: null },
        url: { type: String, default: '' }
      }
    ],
    default: []
  },
  amenities: { type: [String], default: [] },
  images: { type: [String], default: [] }
}, baseSchemaOptions);

propertySchema.index({ city: 1 });
propertySchema.index({ property_type: 1 });
propertySchema.index({ price_per_night: 1 });
propertySchema.index({ host_id: 1 });

const Property = mongoose.model('Property', propertySchema);

export default Property;
