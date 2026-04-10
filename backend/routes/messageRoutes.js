import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Message from '../models/Message.js';

const router = express.Router();

// Get unique conversations for the current user (guest or host), grouped by property + other user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const currentUserId = String(req.user.id);
    const messages = await Message.find({
      $or: [{ sender_id: req.user.id }, { receiver_id: req.user.id }]
    })
    .populate('property_id', 'title host_id')
    .populate('sender_id', 'name')
    .populate('receiver_id', 'name')
    .sort({ created_at: -1 })
    .lean();

    const conversationsMap = new Map();
    
    messages.forEach(msg => {
      // Only include valid properties
      if (!msg.property_id) return;

      const senderId = String(msg.sender_id._id);
      const receiverId = String(msg.receiver_id._id);
      const otherUserId = senderId === currentUserId ? receiverId : senderId;
      const otherUserName = senderId === currentUserId ? msg.receiver_id.name : msg.sender_id.name;
      const unread = receiverId === currentUserId && !msg.read;

      // Keep separate threads per property and other user
      const key = `${msg.property_id._id}_${otherUserId}`;
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          property_id: msg.property_id._id,
          property_title: msg.property_id.title,
          other_user_id: otherUserId,
          other_user_name: otherUserName,
          last_message: msg.text,
          last_message_date: msg.created_at,
          unread
        });
      }
    });

    res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    console.error('Get host conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unread message count for current user (for navbar badge)
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    // Avoid noisy errors when MongoDB isn't running locally.
    if (mongoose.connection.readyState !== 1) {
      return res.json({ count: 0 });
    }
    const count = await Message.countDocuments({
      receiver_id: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error?.message || error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Backward-compatible alias used by existing frontend
router.get('/host', authenticateToken, async (req, res) => {
  try {
    const currentUserId = String(req.user.id);
    const messages = await Message.find({
      $or: [{ sender_id: req.user.id }, { receiver_id: req.user.id }]
    })
      .populate('property_id', 'title host_id')
      .populate('sender_id', 'name')
      .populate('receiver_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    const conversationsMap = new Map();
    messages.forEach((msg) => {
      if (!msg.property_id) return;
      const senderId = String(msg.sender_id._id);
      const receiverId = String(msg.receiver_id._id);
      const otherUserId = senderId === currentUserId ? receiverId : senderId;
      const otherUserName = senderId === currentUserId ? msg.receiver_id.name : msg.sender_id.name;
      const key = `${msg.property_id._id}_${otherUserId}`;
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          property_id: msg.property_id._id,
          property_title: msg.property_id.title,
          other_user_id: otherUserId,
          other_user_name: otherUserName,
          last_message: msg.text,
          last_message_date: msg.created_at,
          unread: receiverId === currentUserId && !msg.read
        });
      }
    });

    res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    console.error('Get host conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages between current user and the other party for a specific property
router.get('/property/:propertyId/user/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const { propertyId, otherUserId } = req.params;
    
    const rawMessages = await Message.find({
      property_id: propertyId,
      $or: [
        { sender_id: req.user.id, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: req.user.id }
      ]
    })
    .populate('sender_id', 'name')
    .populate('receiver_id', 'name')
    .sort({ created_at: 1 })
    .lean();

    const messages = rawMessages.map((msg) => ({
      id: msg._id?.toString?.() || msg.id,
      property_id: msg.property_id?.toString?.() || msg.property_id,
      sender_id: msg.sender_id?._id?.toString?.() || msg.sender_id?.toString?.() || msg.sender_id,
      receiver_id: msg.receiver_id?._id?.toString?.() || msg.receiver_id?.toString?.() || msg.receiver_id,
      sender_name: msg.sender_id?.name || 'Guest',
      receiver_name: msg.receiver_id?.name || 'Host',
      text: msg.text,
      read: msg.read,
      created_at: msg.created_at,
      updated_at: msg.updated_at
    }));

    // Fire & forget mark as read
    Message.updateMany(
      { property_id: propertyId, receiver_id: req.user.id, sender_id: otherUserId, read: false },
      { $set: { read: true } }
    ).catch(e => console.error('Mark read error:', e));

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a new message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { property_id, receiver_id, text } = req.body;
    if (!property_id || !receiver_id || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const saved = await Message.create({
      property_id,
      sender_id: req.user.id,
      receiver_id,
      text
    });

    const hydrated = await Message.findById(saved._id)
      .populate('sender_id', 'name')
      .populate('receiver_id', 'name')
      .lean();

    res.status(201).json({
      id: hydrated._id?.toString?.(),
      property_id: hydrated.property_id?.toString?.(),
      sender_id: hydrated.sender_id?._id?.toString?.() || hydrated.sender_id,
      receiver_id: hydrated.receiver_id?._id?.toString?.() || hydrated.receiver_id,
      sender_name: hydrated.sender_id?.name || 'You',
      receiver_name: hydrated.receiver_id?.name || 'Guest',
      text: hydrated.text,
      read: hydrated.read,
      created_at: hydrated.created_at,
      updated_at: hydrated.updated_at
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
