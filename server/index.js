import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import paymentRoutes from './routes/payments.js';
import shipmentRoutes from './routes/shipments.js';
import notificationRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import statsRoutes from './routes/stats.js';
import cartRoutes from './routes/cart.js';
import smartCartOrderRoutes from './routes/smartCartOrders.js';
import couponRoutes from './routes/coupons.js';
import stripeRoutes from './routes/stripe.js';
import walletRoutes from './routes/wallet.js';
import pointOfSaleRoutes from './routes/pointOfSale.js';
import agentRoutes from './routes/agents.js';
import contactRoutes from './routes/contact.js';
import chatRoutes from './routes/chat.js';
import reportRoutes from './routes/reports.js';
import invoiceRoutes from './routes/invoices.js';
import setupRoutes from './routes/setup.js';
import healthCheckRoutes from './health-check.js';

// Import error handler
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration - allow multiple origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://oliviaship-2025.vercel.app',
  'https://oliviaship-2025-olivia-ships-projects.vercel.app',
  // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  /^http:\/\/192\.168\.\d+\.\d+:5173$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,
  /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5173$/,
  /^https:\/\/.*\.vercel\.app$/,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    console.log('🔍 CORS Request from origin:', origin);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ CORS Allowed:', origin);
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('✅ CORS Allowed (development mode):', origin);
      callback(null, true);
    } else {
      console.log('⚠️ CORS origin not in allowed list, but allowing anyway:', origin);
      console.log('📋 Allowed origins:', allowedOrigins);
      callback(null, true); // Allow anyway in production for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // 10 minutes
}));

// Additional CORS headers middleware (backup)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Rate limiting - More lenient in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// General rate limiter (very lenient in development)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 500, // Very high limit in development, normal in production
  message: 'عدد كبير جداً من الطلبات، يرجى المحاولة لاحقاً',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip all rate limiting in development
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 200 : 20, // Higher limit in development
  message: 'عدد كبير جداً من محاولات تسجيل الدخول، يرجى المحاولة لاحقاً',
  skip: () => isDevelopment, // Skip all rate limiting in development
});

// More lenient for cart and product endpoints (for active use)
const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 1000 : 100, // Much higher limit in development
  message: 'عدد كبير جداً من الطلبات للسلة، يرجى الانتظار قليلاً',
  skip: () => isDevelopment, // Skip all rate limiting in development
});

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Health check (no rate limiting)
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbStatus] || 'unknown';
  
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: dbStatusText,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Apply rate limiters (after health check)
app.use('/api/auth', authLimiter);
app.use('/api/cart', cartLimiter);
app.use('/api/products', cartLimiter); // Same for products since they're used frequently
app.use('/api/', generalLimiter);

// Health check routes (no rate limiting)
app.use('/api', healthCheckRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/smart-cart-orders', smartCartOrderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/pos', pointOfSaleRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/setup', setupRoutes);

// Error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yemen-delivery';
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    // Listen on all network interfaces (0.0.0.0) to allow access from mobile devices
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`📱 Access from mobile: http://YOUR_IP:${PORT}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('   Make sure MongoDB is running and MONGODB_URI is correct');
    console.error('   MongoDB URI:', process.env.MONGODB_URI ? 'Set (hidden)' : 'NOT SET');
    
    // Start server anyway to show health check and allow debugging
    console.warn('⚠️ Starting server without database connection');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} (without DB)`);
      console.log(`⚠️ WARNING: MongoDB not connected - some features will not work`);
      console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  }
};

connectDB();
