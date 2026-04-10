import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  otp_hash: { type: String, required: true },
  expires_at: { type: Date, required: true, index: true, expires: 0 }, // TTL on expiration
  used: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

passwordResetTokenSchema.index({ email: 1, created_at: -1 });

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
