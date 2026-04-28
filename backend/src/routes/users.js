// src/routes/users.js
const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  updateNotificationSettings,
  getUserStats,
} = require('../controllers/userController');
const { getMyBids } = require('../controllers/bidController');
const { auth } = require('../middleware/auth');
const router = express.Router();

// All routes require authentication
router.use(auth);

// Profile
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/avatar', uploadAvatar);
router.get('/stats', getUserStats);

// Watchlist
router.get('/watchlist', getWatchlist);
router.post('/watchlist/:lotId', addToWatchlist);
router.delete('/watchlist/:lotId', removeFromWatchlist);

// Bids
router.get('/bids', getMyBids);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/:notificationId/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/settings', updateNotificationSettings);

module.exports = router;