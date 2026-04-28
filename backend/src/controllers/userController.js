// src/controllers/userController.js
const { query } = require('../config/database');
const { uploadImage, deleteImage } = require('../middleware/upload');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, phone_number, avatar_url, bio,
              verified, identity_verified, reputation_score, rating, review_count,
              address_street, address_city, address_country, address_postal_code,
              created_at, last_active
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      bio,
      addressStreet,
      addressCity,
      addressCountry,
      addressPostalCode,
    } = req.body;
    
    const result = await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone_number = COALESCE($2, phone_number),
           bio = COALESCE($3, bio),
           address_street = COALESCE($4, address_street),
           address_city = COALESCE($5, address_city),
           address_country = COALESCE($6, address_country),
           address_postal_code = COALESCE($7, address_postal_code),
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, name, email, phone_number, bio, 
                 address_street, address_city, address_country, address_postal_code`,
      [name, phoneNumber, bio, addressStreet, addressCity, addressCountry, addressPostalCode, req.user.id]
    );
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const avatarUrl = await uploadImage(req.files.avatar, 'avatars');
    
    // Delete old avatar if exists
    const oldAvatar = await query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
    if (oldAvatar.rows[0].avatar_url) {
      await deleteImage(oldAvatar.rows[0].avatar_url);
    }
    
    await query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
      [avatarUrl, req.user.id]
    );
    
    res.json({ avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

// Get user's watchlist
const getWatchlist = async (req, res) => {
  try {
    const result = await query(
      `SELECT w.*, l.title, l.current_bid, l.main_image, l.status as lot_status,
              a.title as auction_title, a.id as auction_id, a.end_time
       FROM watchlist w
       JOIN lots l ON w.lot_id = l.id
       JOIN auctions a ON l.auction_id = a.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    
    res.json({ watchlist: result.rows });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
};

// Add to watchlist
const addToWatchlist = async (req, res) => {
  try {
    const { lotId } = req.params;
    
    await query(
      `INSERT INTO watchlist (user_id, lot_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, lot_id) DO NOTHING`,
      [req.user.id, lotId]
    );
    
    // Increment watchers count
    await query(
      'UPDATE lots SET watchers_count = watchers_count + 1 WHERE id = $1',
      [lotId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
};

// Remove from watchlist
const removeFromWatchlist = async (req, res) => {
  try {
    const { lotId } = req.params;
    
    await query(
      'DELETE FROM watchlist WHERE user_id = $1 AND lot_id = $2',
      [req.user.id, lotId]
    );
    
    // Decrement watchers count
    await query(
      'UPDATE lots SET watchers_count = GREATEST(watchers_count - 1, 0) WHERE id = $1',
      [lotId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};

// Get user's notifications
const getNotifications = async (req, res) => {
  try {
    const { unreadOnly = false, limit = 50, page = 1 } = req.query;
    
    let sql = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;
    
    if (unreadOnly === 'true') {
      sql += ` AND is_read = false`;
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await query(sql, params);
    
    const countResult = await query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1',
      [req.user.id]
    );
    
    res.json({
      notifications: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [notificationId, req.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// Mark all notifications as read
const markAllNotificationsRead = async (req, res) => {
  try {
    await query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    await query(
      `UPDATE users 
       SET notification_settings = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(settings), req.user.id]
    );
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Get user statistics (bids, wins, etc.)
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await query(
      `SELECT
         (SELECT COUNT(*) FROM bids WHERE user_id = $1) as total_bids,
         (SELECT COUNT(*) FROM lots WHERE current_winner_id = $1 AND status = 'sold') as auctions_won,
         (SELECT COUNT(*) FROM watchlist WHERE user_id = $1) as watchlist_count,
         (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE buyer_id = $1 AND payment_status = 'completed') as total_spent,
         (SELECT reputation_score FROM users WHERE id = $1) as reputation_score
       `,
      [userId]
    );
    
    res.json({ stats: stats.rows[0] });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = {
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
};