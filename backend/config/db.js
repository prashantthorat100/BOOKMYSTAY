import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'bookmystay01';

export const connectDB = async () => {
  // Keep trying to connect instead of crashing the server process.
  // This avoids Vite proxy ECONNREFUSED spam while MongoDB is starting.
  // App routes will still error if DB is down, but server stays reachable.
  const connectOnce = async () => {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000
    });
  };

  // If already connected/connecting, don't start another loop.
  if (mongoose.connection.readyState === 1) return;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      attempt += 1;
      await connectOnce();
      console.log('MongoDB connected');
      return;
    } catch (error) {
      const msg = error?.message || String(error);
      const delayMs = Math.min(30000, 3000 + attempt * 1000);
      console.error(`MongoDB connection failed (attempt ${attempt}). Retrying in ${Math.round(delayMs / 1000)}s. ${msg}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};

export default mongoose;
