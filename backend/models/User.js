import mongoose from 'mongoose';
import { baseSchemaOptions } from './baseOptions.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, default: null },
  name: { type: String, required: true, trim: true },
  dob: { type: Date, default: null },
  phone: { type: String, default: null },
  role: { type: String, enum: ['guest', 'host'], default: 'guest' },
  avatar: { type: String, default: null },
  payout_details: { type: mongoose.Schema.Types.Mixed, default: null },
  auth_provider: { type: String, enum: ['email', 'google'], default: 'email', index: true },
  is_email_verified: { type: Boolean, default: false, index: true },
  google_id: { type: String, default: null, index: true }
}, baseSchemaOptions);

userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
