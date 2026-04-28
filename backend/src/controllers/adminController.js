// src/controllers/adminController.js
const { query } = require('../config/database');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAuctioneers,
      totalBuyers,
      totalAuctions,
      liveAuctions,
      totalBids,
      totalRevenue,
      pendingPayments,
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['auctioneer']),
      query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['buyer']),
      query('SELECT COUNT(*) as count FROM auctions'),
      query("SELECT COUNT(*) as count FROM auctions WHERE status = 'live'"),
      query('SELECT COUNT(*) as count FROM bids'),
      query('SELECT COALESCE(SUM(total_revenue), 0) as total FROM auctions'),
      query("SELECT COUNT(*) as count FROM payments WHERE payment_status = 'pending'"),
    ]);
    
    // Get recent activity
    const recentAuctions = await query(
      `SELECT a.*, u.name as auctioneer_name
       FROM auctions a
       JOIN users u ON a.auctioneer_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 10`
    );
    
    const recentUsers = await query(
      `SELECT id, name, email, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 10`
    );
    
    const recentPayments = await query(
      `SELECT p.*, l.title as lot_title, u.name as buyer_name
       FROM payments p
       JOIN lots l ON p.lot_id = l.id
       JOIN users u ON p.buyer_id = u.id
       ORDER BY p.created_at DESC
       LIMIT 10`
    );
    
    res.json({
      stats: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalAuctioneers: parseInt(totalAuctioneers.rows[0].count),
        totalBuyers: parseInt(totalBuyers.rows[0].count),
        totalAuctions: parseInt(totalAuctions.rows[0].count),
        liveAuctions: parseInt(liveAuctions.rows[0].count),
        totalBids: parseInt(totalBids.rows[0].count),
        totalRevenue: parseFloat(totalRevenue.rows[0].total),
        pendingPayments: parseInt(pendingPayments.rows[0].count),
      },
      recentAuctions: recentAuctions.rows,
      recentUsers: recentUsers.rows,
      recentPayments: recentPayments.rows,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get all users (with pagination and filters)
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, limit = 50, page = 1 } = req.query;
    
    let sql = `
      SELECT id, name, email, role, blocked, verified, identity_verified,
             reputation_score, rating, created_at, last_login
      FROM users WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (role) {
      sql += ` AND role = $${paramIndex++}`;
      params.push(role);
    }
    
    if (status === 'blocked') {
      sql += ` AND blocked = true`;
    } else if (status === 'active') {
      sql += ` AND blocked = false`;
    }
    
    if (search) {
      sql += ` AND (name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await query(sql, params);
    
    const countResult = await query(
      'SELECT COUNT(*) as total FROM users',
      []
    );
    
    res.json({
      users: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user details (admin view with auto-bid visibility)
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user info
    const userResult = await query(
      `SELECT id, name, email, role, phone_number, avatar_url, bio,
              verified, identity_verified, blocked, reputation_score,
              total_paid, total_unpaid, rating, review_count,
              created_at, last_login, last_active
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get user's bids
    const bids = await query(
      `SELECT b.*, l.title as lot_title, a.title as auction_title
       FROM bids b
       JOIN lots l ON b.lot_id = l.id
       JOIN auctions a ON l.auction_id = a.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT 50`,
      [userId]
    );
    
    // Get user's auto-bids (admin only visibility)
    const autoBids = await query(
      `SELECT l.id, l.title, lb.max_amount, lb.created_at
       FROM lots l,
            jsonb_to_recordset(l.auto_bids) AS lb(user_id UUID, max_amount DECIMAL, created_at TIMESTAMP)
       WHERE lb.user_id = $1
       ORDER BY lb.created_at DESC`,
      [userId]
    );
    
    // Get user's lots (if auctioneer)
    const lots = await query(
      `SELECT l.*, a.title as auction_title
       FROM lots l
       JOIN auctions a ON l.auction_id = a.id
       WHERE a.auctioneer_id = $1
       ORDER BY l.created_at DESC
       LIMIT 50`,
      [userId]
    );
    
    // Get user's payments
    const payments = await query(
      `SELECT p.*, l.title as lot_title
       FROM payments p
       JOIN lots l ON p.lot_id = l.id
       WHERE p.buyer_id = $1 OR p.seller_id = $1
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [userId]
    );
    
    res.json({
      user,
      bids: bids.rows,
      autoBids: autoBids.rows,
      lots: lots.rows,
      payments: payments.rows,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

// Block/unblock user
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { blocked, reason } = req.body;
    
    // Prevent self-block
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }
    
    const result = await query(
      `UPDATE users 
       SET blocked = $1, 
           blocked_reason = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, blocked`,
      [blocked, reason || null, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If blocking, also cancel any active auctions by this user
    if (blocked) {
      await query(
        `UPDATE auctions 
         SET status = 'cancelled', updated_at = NOW()
         WHERE auctioneer_id = $1 AND status IN ('scheduled', 'live')`,
        [userId]
      );
    }
    
    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Verify user identity (admin)
const verifyUserIdentity = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await query(
      `UPDATE users 
       SET identity_verified = true, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, identity_verified`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
};

// Get all auctions (admin view)
const getAllAuctions = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    
    let sql = `
      SELECT a.*, u.name as auctioneer_name, u.email as auctioneer_email
      FROM auctions a
      JOIN users u ON a.auctioneer_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    }
    
    sql += ` ORDER BY a.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await query(sql, params);
    
    const countResult = await query('SELECT COUNT(*) as total FROM auctions', []);
    
    res.json({
      auctions: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get all auctions error:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
};

// Get analytics data
const getAnalytics = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let interval;
    switch (period) {
      case 'day':
        interval = '1 hour';
        break;
      case 'week':
        interval = '1 day';
        break;
      case 'month':
        interval = '1 day';
        break;
      default:
        interval = '1 day';
    }
    
    // Revenue over time
    const revenueOverTime = await query(
      `SELECT DATE_TRUNC('day', created_at) as date, 
              COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE payment_status = 'completed'
         AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY date ASC`,
      []
    );
    
    // Bids over time
    const bidsOverTime = await query(
      `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as total
       FROM bids
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY date ASC`,
      []
    );
    
    // Users over time
    const usersOverTime = await query(
      `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as total
       FROM users
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY date ASC`,
      []
    );
    
    // Top categories
    const topCategories = await query(
      `SELECT category, COUNT(*) as count
       FROM auctions
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY category
       ORDER BY count DESC
       LIMIT 10`,
      []
    );
    
    // Top auctioneers by revenue
    const topAuctioneers = await query(
      `SELECT u.id, u.name, SUM(a.total_revenue) as revenue
       FROM auctions a
       JOIN users u ON a.auctioneer_id = u.id
       WHERE a.created_at > NOW() - INTERVAL '30 days'
       GROUP BY u.id, u.name
       ORDER BY revenue DESC
       LIMIT 10`,
      []
    );
    
    // Conversion rates
    const conversionRates = await query(
      `SELECT 
         COUNT(DISTINCT CASE WHEN b.id IS NOT NULL THEN a.id END) as auctions_with_bids,
         COUNT(DISTINCT a.id) as total_auctions,
         ROUND(COUNT(DISTINCT CASE WHEN b.id IS NOT NULL THEN a.id END)::numeric / NULLIF(COUNT(DISTINCT a.id), 0) * 100, 2) as auction_conversion_rate,
         ROUND(AVG(l.view_count)::numeric, 0) as avg_views_per_lot,
         ROUND(AVG(l.total_bids)::numeric, 1) as avg_bids_per_lot
       FROM auctions a
       LEFT JOIN lots l ON a.id = l.auction_id
       LEFT JOIN bids b ON l.id = b.lot_id
       WHERE a.created_at > NOW() - INTERVAL '30 days'`,
      []
    );
    
    res.json({
      revenueOverTime: revenueOverTime.rows,
      bidsOverTime: bidsOverTime.rows,
      usersOverTime: usersOverTime.rows,
      topCategories: topCategories.rows,
      topAuctioneers: topAuctioneers.rows,
      conversionRates: conversionRates.rows[0],
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Update commission settings
const updateCommissionSettings = async (req, res) => {
  try {
    const { globalCommissionRate, auctioneerSpecificRates } = req.body;
    
    // Store in settings table (you'd need to create this)
    // For now, we'll just update any open auctions
    if (globalCommissionRate) {
      await query(
        'UPDATE auctions SET commission_rate = $1 WHERE status IN ($2, $3)',
        [globalCommissionRate, 'scheduled', 'live']
      );
    }
    
    // Update specific auctioneers
    if (auctioneerSpecificRates) {
      for (const [userId, rate] of Object.entries(auctioneerSpecificRates)) {
        await query(
          'UPDATE auctions SET commission_rate = $1 WHERE auctioneer_id = $2 AND status IN ($3, $4)',
          [rate, userId, 'scheduled', 'live']
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update commission error:', error);
    res.status(500).json({ error: 'Failed to update commission settings' });
  }
};

// Export data for reporting
const exportReport = async (req, res) => {
  try {
    const { type, startDate, endDate, format = 'json' } = req.query;
    
    let data;
    
    if (type === 'auctions') {
      data = await query(
        `SELECT a.*, u.name as auctioneer_name,
                COUNT(DISTINCT l.id) as total_lots,
                COUNT(DISTINCT b.id) as total_bids
         FROM auctions a
         JOIN users u ON a.auctioneer_id = u.id
         LEFT JOIN lots l ON a.id = l.auction_id
         LEFT JOIN bids b ON l.id = b.lot_id
         WHERE a.created_at BETWEEN $1 AND $2
         GROUP BY a.id, u.name
         ORDER BY a.created_at DESC`,
        [startDate, endDate]
      );
    } else if (type === 'payments') {
      data = await query(
        `SELECT p.*, l.title as lot_title, u.name as buyer_name, a.title as auction_title
         FROM payments p
         JOIN lots l ON p.lot_id = l.id
         JOIN users u ON p.buyer_id = u.id
         JOIN auctions a ON l.auction_id = a.id
         WHERE p.created_at BETWEEN $1 AND $2
         ORDER BY p.created_at DESC`,
        [startDate, endDate]
      );
    } else {
      data = { rows: [] };
    }
    
    if (format === 'csv') {
      // Generate CSV
      const csvRows = [];
      const headers = Object.keys(data.rows[0] || {});
      csvRows.push(headers.join(','));
      
      for (const row of data.rows) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report_${Date.now()}.csv`);
      return res.send(csvRows.join('\n'));
    }
    
    res.json({ data: data.rows });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  blockUser,
  verifyUserIdentity,
  getAllAuctions,
  getAnalytics,
  updateCommissionSettings,
  exportReport,
};