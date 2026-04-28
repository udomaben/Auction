// src/app.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Import database
const { query } = require('./config/database');

// Import socket handler
const setupAuctionSocket = require('./socket/auctionHandler');

// Import routes
const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctions');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
    },
  },
}));

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  useTempFiles: true,
  tempFileDir: '/tmp/',
}));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts.' },
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// ============================================
// STATIC FILES
// ============================================

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry', detail: err.detail });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ============================================
// SOCKET.IO SETUP
// ============================================

setupAuctionSocket(io);

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  socket.on('ping', () => socket.emit('pong'));
  
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

module.exports = { app, server, io };