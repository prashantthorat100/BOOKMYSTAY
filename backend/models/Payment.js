import mongoose from 'mongoose';
import { baseSchemaOptions } from './baseOptions.js';

const paymentSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  razorpay_order_id: { type: String, required: true },
  razorpay_payment_id: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, default: 'captured' },
  payment_method: { type: String, enum: ['upi_qr', 'upi_id', null], default: null },
  upi_id: { type: String, default: null }
}, baseSchemaOptions);

paymentSchema.index({ booking_id: 1 });
paymentSchema.index({ razorpay_order_id: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
