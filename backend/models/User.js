import mongoose from 'mongoose';
import { baseSchemaOptions } from './baseOptions.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: null },
  role: { type: String, enum: ['guest', 'host'], default: 'guest' },
  avatar: { type: String, default: null },
  payout_details: { type: mongoose.Schema.Types.Mixed, default: null }
}, baseSchemaOptions);

userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
