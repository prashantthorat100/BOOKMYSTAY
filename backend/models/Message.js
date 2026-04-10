import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Indexes for fast querying
messageSchema.index({ property_id: 1, sender_id: 1, receiver_id: 1 });
messageSchema.index({ receiver_id: 1, created_at: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
