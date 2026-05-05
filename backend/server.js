import 'dotenv/config'; // Must be first to load env vars before other imports
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import hostRoutes from './routes/hostRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import forgotPasswordRoutes from './routes/forgotPasswordRoutes.js';
import favouriteRoutes from './routes/favouriteRoutes.js';

// Import database connection
import { connectDB } from './config/db.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Allow frontend origin – set FRONTEND_URL env var on Render for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:4173',
  'http://localhost:5173',
  process.env.FRONTEND_URL || 'https://bookmystay-frontend-6zrt.onrender.com'
];

// Regex patterns for origins that are always allowed
const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,                  // any localhost port (dev)
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,         // 10.x.x.x LAN (mobile / same WiFi)
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,        // 192.168.x.x LAN
  /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+$/ // 172.16–31.x.x LAN
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    // Allow any explicitly listed origin
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any origin matching our LAN / localhost patterns
    if (allowedOriginPatterns.some(pattern => pattern.test(origin))) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/', forgotPasswordRoutes);

// Root route — friendly API info
app.get('/', (req, res) => {
  res.json({
    name: 'BookMyStay API',
    version: '1.0.0',
    status: 'running',
    endpoints: '/api/health · /api/properties · /api/auth · /api/bookings'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server after DB connects
const start = async () => {
  connectDB().catch((e) => console.error('DB connect loop error:', e?.message || e));

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Local:   http://localhost:${PORT}/api`);
    console.log(`🌐 Network: http://<your-LAN-IP>:${PORT}/api  (accessible from phone/tablet on same WiFi)`);
  });

  // Handle port-in-use gracefully instead of crashing
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌  Port ${PORT} is already in use!`);
      console.error(`   Run this command to free it, then restart:\n`);
      console.error(`   Windows PowerShell:`);
      console.error(`   Get-NetTCPConnection -LocalPort ${PORT} -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });
};

start();

