// src/routes/admin.js
const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  blockUser,
  verifyUserIdentity,
  getAllAuctions,
  getAnalytics,
  updateCommissionSettings,
  exportReport,
} = require('../controllers/adminController');
const { auth, isAdmin } = require('../middleware/auth');
const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth, isAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/export', exportReport);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.patch('/users/:userId/block', blockUser);
router.patch('/users/:userId/verify', verifyUserIdentity);

// Auction management
router.get('/auctions', getAllAuctions);

// Settings
router.post('/settings/commission', updateCommissionSettings);

module.exports = router;