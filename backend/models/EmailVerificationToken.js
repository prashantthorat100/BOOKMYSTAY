import mongoose from 'mongoose';

const emailVerificationTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  otp_hash: { type: String, required: true },
  expires_at: { type: Date, required: true, index: true, expires: 0 }, // TTL on expiration
  used: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

emailVerificationTokenSchema.index({ email: 1, created_at: -1 });

const EmailVerificationToken = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);

export default EmailVerificationToken;

