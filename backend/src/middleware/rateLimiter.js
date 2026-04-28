// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' },
  skipSuccessfulRequests: true,
});

// Bid limiter (prevent bid spamming)
const bidLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many bid attempts, please slow down.' },
});

// Auction creation limiter
const createAuctionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many auctions created. Please wait before creating more.' },
});

// Login limiter (stricter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again later.' },
  skipSuccessfulRequests: true,
});

module.exports = {
  apiLimiter,
  authLimiter,
  bidLimiter,
  createAuctionLimiter,
  loginLimiter,
};