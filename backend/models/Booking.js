import mongoose from 'mongoose';
import { baseSchemaOptions } from './baseOptions.js';

const bookingSchema = new mongoose.Schema({
  property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  guest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  check_in: { type: Date, required: true },
  check_out: { type: Date, required: true },
  total_price: { type: Number, required: true },
  guests_count: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' }
}, baseSchemaOptions);

bookingSchema.index({ property_id: 1 });
bookingSchema.index({ guest_id: 1 });
bookingSchema.index({ check_in: 1, check_out: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
