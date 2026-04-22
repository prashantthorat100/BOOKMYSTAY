import jwt from 'jsonwebtoken';

import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure user still exists in the database
    const userExists = await User.findById(decoded.id).select('_id name email role').lean();
    if (!userExists) {
      return res.status(401).json({ error: 'User no longer exists. Please log in again.' });
    }
    
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const isHost = (req, res, next) => {
  if (req.user.role !== 'host') {
    return res.status(403).json({ error: 'Access denied. Host role required.' });
  }
  next();
};
