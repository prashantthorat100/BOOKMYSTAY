import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'bookmystay01';

export const connectDB = async () => {
  const connectOnce = async () => {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
      autoIndex: true,
      serverSelectionTimeoutMS: 10000  // 10s for Atlas (network latency)
    });
  };

  // If already connected, skip.
  if (mongoose.connection.readyState === 1) return;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      attempt += 1;
      await connectOnce();
      console.log(`✅ MongoDB Atlas connected  →  DB: ${DB_NAME}`);
      return;
    } catch (error) {
      const msg = error?.message || String(error);
      const delayMs = Math.min(30000, 3000 + attempt * 1000);
      console.error(`❌ MongoDB connection failed (attempt ${attempt}). Retrying in ${Math.round(delayMs / 1000)}s.\n   ${msg}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};

export default mongoose;
