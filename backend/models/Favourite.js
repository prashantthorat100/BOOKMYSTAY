import mongoose from 'mongoose';

const favouriteSchema = new mongoose.Schema({
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
}, { timestamps: true });

// One favourite entry per user-property pair
favouriteSchema.index({ user_id: 1, property_id: 1 }, { unique: true });

export default mongoose.model('Favourite', favouriteSchema);
