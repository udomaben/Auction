// backend/src/controllers/auctionController.js
const { query, transaction } = require('../config/database');
const slugify = require('slugify');

const generateSlug = (title) => {
  return slugify(title, { lower: true, strict: true, locale: 'en' }) + '-' + Date.now().toString(36);
};

// ============================================
// GET ALL AUCTIONS
// ============================================
const getAuctions = async (req, res) => {
  try {
    const {
      category,
      status,
      featured,
      search,
      limit = 20,
      page = 1,
      sort = 'newest',
    } = req.query;

    let sql = `
      SELECT a.*, 
             u.name as auctioneer_name, 
             u.avatar_url as auctioneer_avatar,
             COUNT(DISTINCT l.id) as total_lots_count,
             COUNT(DISTINCT b.id) as total_bids_count,
             COALESCE(MAX(b.amount), 0) as highest_bid
      FROM auctions a
      JOIN users u ON a.auctioneer_id = u.id
      LEFT JOIN lots l ON a.id = l.auction_id AND l.status = 'active'
      LEFT JOIN bids b ON l.id = b.lot_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND a.category = $${paramIndex++}`;
      params.push(category);
    }

    if (status) {
      sql += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    } else {
      sql += ` AND a.status IN ('scheduled', 'live')`;
    }

    if (featured === 'true') {
      sql += ` AND a.is_featured = true`;
    }

    if (search) {
      sql += ` AND (a.title ILIKE $${paramIndex++} OR a.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY a.id, u.name, u.avatar_url`;

    // Sorting
    switch (sort) {
      case 'ending':
        sql += ` ORDER BY a.end_time ASC`;
        break;
      case 'starting':
        sql += ` ORDER BY a.start_time ASC`;
        break;
      case 'popular':
        sql += ` ORDER BY total_bids_count DESC, total_lots_count DESC`;
        break;
      case 'price_asc':
        sql += ` ORDER BY highest_bid ASC`;
        break;
      case 'price_desc':
        sql += ` ORDER BY highest_bid DESC`;
        break;
      case 'newest':
      default:
        sql += ` ORDER BY a.created_at DESC`;
        break;
    }

    // Get total count
    let countSql = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM auctions a
      WHERE 1=1
    `;
    
    const countParams = [];
    let countIndex = 1;
    
    if (category) {
      countSql += ` AND a.category = $${countIndex++}`;
      countParams.push(category);
    }
    if (status) {
      countSql += ` AND a.status = $${countIndex++}`;
      countParams.push(status);
    } else {
      countSql += ` AND a.status IN ('scheduled', 'live')`;
    }
    if (featured === 'true') {
      countSql += ` AND a.is_featured = true`;
    }
    if (search) {
      countSql += ` AND (a.title ILIKE $${countIndex++} OR a.description ILIKE $${countIndex})`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Add pagination
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);

    res.json({
      auctions: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ error: 'Failed to fetch auctions', details: error.message });
  }
};

// ============================================
// GET FEATURED LOTS
// ============================================
const getFeaturedLots = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const result = await query(`
      SELECT l.*, a.title as auction_title, a.id as auction_id,
             a.end_time, a.status as auction_status,
             u.name as seller_name
      FROM lots l
      JOIN auctions a ON l.auction_id = a.id
      JOIN users u ON a.auctioneer_id = u.id
      WHERE l.status = 'active' 
        AND a.status = 'live'
      ORDER BY l.view_count DESC, l.total_bids DESC, l.current_bid DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({ lots: result.rows });
  } catch (error) {
    console.error('Get featured lots error:', error);
    res.status(500).json({ error: 'Failed to fetch featured lots' });
  }
};

// ============================================
// GET ENDING SOON AUCTIONS
// ============================================
const getEndingSoon = async (req, res) => {
  try {
    const { limit = 4 } = req.query;

    const result = await query(`
      SELECT a.*, u.name as auctioneer_name, u.avatar_url,
             COUNT(DISTINCT l.id) as total_lots,
             COUNT(DISTINCT b.id) as total_bids
      FROM auctions a
      JOIN users u ON a.auctioneer_id = u.id
      LEFT JOIN lots l ON a.id = l.auction_id
      LEFT JOIN bids b ON l.id = b.lot_id
      WHERE a.status = 'live' 
        AND a.end_time > NOW()
      GROUP BY a.id, u.name, u.avatar_url
      ORDER BY a.end_time ASC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({ auctions: result.rows });
  } catch (error) {
    console.error('Get ending soon error:', error);
    res.status(500).json({ error: 'Failed to fetch ending soon auctions' });
  }
};

// ============================================
// GET SINGLE AUCTION BY ID
// ============================================
const getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || null;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid auction ID format' });
    }

    // Get auction
    const auctionResult = await query(
      `SELECT a.*, 
              u.name as auctioneer_name, 
              u.avatar_url as auctioneer_avatar,
              u.bio as auctioneer_bio,
              u.rating as auctioneer_rating,
              u.review_count as auctioneer_review_count,
              u.verified as auctioneer_verified
       FROM auctions a
       JOIN users u ON a.auctioneer_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (auctionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const auction = auctionResult.rows[0];

    // Increment view count
    query('UPDATE auctions SET total_view_count = total_view_count + 1 WHERE id = $1', [id]);

    // Track unique viewer
    if (userId) {
      await query(
        `INSERT INTO auction_views (auction_id, user_id, viewed_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (auction_id, user_id) DO NOTHING`,
        [id, userId]
      );
    }

    // Get lots
    const lotsResult = await query(
      `SELECT l.*,
              COALESCE(b.bid_count, 0) as bid_count,
              CASE WHEN w.user_id IS NOT NULL THEN true ELSE false END as is_watched,
              u.name as current_winner_name
       FROM lots l
       LEFT JOIN (
         SELECT lot_id, COUNT(*) as bid_count, MAX(amount) as max_bid
         FROM bids 
         GROUP BY lot_id
       ) b ON l.id = b.lot_id
       LEFT JOIN watchlist w ON l.id = w.lot_id AND w.user_id = $2
       LEFT JOIN users u ON l.current_winner_id = u.id
       WHERE l.auction_id = $1 AND l.status != 'withdrawn'
       ORDER BY l.lot_number ASC`,
      [id, userId || null]
    );

    // Get related auctions
    const relatedResult = await query(
      `SELECT id, title, cover_image, start_time, end_time, status
       FROM auctions
       WHERE category = $1 AND id != $2 AND status IN ('scheduled', 'live')
       ORDER BY start_time ASC
       LIMIT 4`,
      [auction.category, id]
    );

    res.json({
      auction,
      lots: lotsResult.rows,
      relatedAuctions: relatedResult.rows,
    });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ error: 'Failed to fetch auction' });
  }
};

// ============================================
// CREATE AUCTION
// ============================================
const createAuction = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      category,
      coverImage,
      commissionRate,
      isFeatured,
    } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({ error: 'Start time must be in the future' });
    }

    if (end <= start) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const slug = generateSlug(title);
    const auctioneerId = req.user.id;

    const result = await query(
      `INSERT INTO auctions (
        auctioneer_id, title, description, slug, start_time, end_time, 
        category, cover_image, commission_rate, is_featured, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *`,
      [
        auctioneerId,
        title,
        description,
        slug,
        start,
        end,
        category,
        coverImage || null,
        commissionRate || 9,
        isFeatured || false,
        start > now ? 'scheduled' : 'live',
      ]
    );

    res.status(201).json({
      success: true,
      auction: result.rows[0],
    });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ error: 'Failed to create auction' });
  }
};

// ============================================
// UPDATE AUCTION
// ============================================
const updateAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      startTime,
      endTime,
      category,
      coverImage,
      commissionRate,
      isFeatured,
    } = req.body;

    const auctionCheck = await query(
      'SELECT auctioneer_id, status FROM auctions WHERE id = $1',
      [id]
    );

    if (auctionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (auctionCheck.rows[0].auctioneer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (auctionCheck.rows[0].status === 'live') {
      return res.status(400).json({ error: 'Cannot update a live auction' });
    }

    const result = await query(
      `UPDATE auctions 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           category = COALESCE($5, category),
           cover_image = COALESCE($6, cover_image),
           commission_rate = COALESCE($7, commission_rate),
           is_featured = COALESCE($8, is_featured),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [title, description, startTime, endTime, category, coverImage, commissionRate, isFeatured, id]
    );

    res.json({
      success: true,
      auction: result.rows[0],
    });
  } catch (error) {
    console.error('Update auction error:', error);
    res.status(500).json({ error: 'Failed to update auction' });
  }
};

// ============================================
// DELETE AUCTION
// ============================================
const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;

    const auctionCheck = await query(
      'SELECT auctioneer_id, status FROM auctions WHERE id = $1',
      [id]
    );

    if (auctionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (auctionCheck.rows[0].auctioneer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (auctionCheck.rows[0].status === 'live') {
      return res.status(400).json({ error: 'Cannot delete a live auction' });
    }

    await query('UPDATE auctions SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete auction error:', error);
    res.status(500).json({ error: 'Failed to delete auction' });
  }
};

// ============================================
// GET AUCTIONEER'S AUCTIONS
// ============================================
const getMyAuctions = async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, 
              COUNT(DISTINCT l.id) as total_lots,
              COUNT(DISTINCT b.id) as total_bids,
              COALESCE(SUM(b.amount), 0) as total_revenue
       FROM auctions a
       LEFT JOIN lots l ON a.id = l.auction_id AND l.status != 'withdrawn'
       LEFT JOIN bids b ON l.id = b.lot_id
       WHERE a.auctioneer_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    res.json({ auctions: result.rows });
  } catch (error) {
    console.error('Get my auctions error:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
};

// ============================================
// ADD LOT TO AUCTION
// ============================================
const addLot = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const {
      title,
      description,
      startingBid,
      bidIncrement,
      reservePrice,
      buyNowPrice,
      condition,
      mainImage,
      additionalImages,
      shippingCost,
      freePickup,
      brand,
      year,
      dimensions,
      weight,
      material,
    } = req.body;

    const auctionCheck = await query(
      'SELECT auctioneer_id, status FROM auctions WHERE id = $1',
      [auctionId]
    );

    if (auctionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (auctionCheck.rows[0].auctioneer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (auctionCheck.rows[0].status === 'live') {
      return res.status(400).json({ error: 'Cannot add lots to a live auction' });
    }

    const lotCountResult = await query(
      'SELECT COUNT(*) as count FROM lots WHERE auction_id = $1',
      [auctionId]
    );

    const lotNumber = parseInt(lotCountResult.rows[0].count) + 1;
    const slug = generateSlug(title);

    const result = await query(
      `INSERT INTO lots (
        auction_id, title, description, slug, lot_number, starting_bid, current_bid,
        bid_increment, reserve_price, buy_now_price, condition, main_image,
        additional_images, shipping_cost, free_pickup, brand, year, dimensions, weight, material, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'active', NOW())
      RETURNING *`,
      [
        auctionId,
        title,
        description,
        slug,
        lotNumber,
        startingBid,
        bidIncrement || 10,
        reservePrice || null,
        buyNowPrice || null,
        condition || 'good',
        mainImage,
        additionalImages || [],
        shippingCost || 0,
        freePickup || false,
        brand || null,
        year || null,
        dimensions || null,
        weight || null,
        material || null,
      ]
    );

    await query(
      'UPDATE auctions SET total_lots = total_lots + 1 WHERE id = $1',
      [auctionId]
    );

    res.status(201).json({
      success: true,
      lot: result.rows[0],
    });
  } catch (error) {
    console.error('Add lot error:', error);
    res.status(500).json({ error: 'Failed to add lot' });
  }
};

// ============================================
// UPDATE LOT
// ============================================
const updateLot = async (req, res) => {
  try {
    const { lotId } = req.params;
    const updates = req.body;

    const lotCheck = await query(
      `SELECT l.*, a.auctioneer_id, a.status 
       FROM lots l
       JOIN auctions a ON l.auction_id = a.id
       WHERE l.id = $1`,
      [lotId]
    );

    if (lotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }

    const lot = lotCheck.rows[0];

    if (lot.auctioneer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (lot.status === 'sold') {
      return res.status(400).json({ error: 'Cannot update a sold lot' });
    }

    const allowedUpdates = [
      'title', 'description', 'starting_bid', 'bid_increment', 'reserve_price',
      'buy_now_price', 'condition', 'main_image', 'additional_images', 'shipping_cost',
      'free_pickup', 'brand', 'year', 'dimensions', 'weight', 'material'
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        values.push(updates[field]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(lotId);

    const result = await query(
      `UPDATE lots SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({
      success: true,
      lot: result.rows[0],
    });
  } catch (error) {
    console.error('Update lot error:', error);
    res.status(500).json({ error: 'Failed to update lot' });
  }
};

// ============================================
// DELETE LOT
// ============================================
const deleteLot = async (req, res) => {
  try {
    const { lotId } = req.params;

    const lotCheck = await query(
      `SELECT l.*, a.auctioneer_id, a.status 
       FROM lots l
       JOIN auctions a ON l.auction_id = a.id
       WHERE l.id = $1`,
      [lotId]
    );

    if (lotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }

    const lot = lotCheck.rows[0];

    if (lot.auctioneer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (lot.status === 'sold') {
      return res.status(400).json({ error: 'Cannot delete a sold lot' });
    }

    if (lot.total_bids > 0) {
      return res.status(400).json({ error: 'Cannot delete a lot with bids' });
    }

    await query('UPDATE lots SET status = $1, updated_at = NOW() WHERE id = $2', ['withdrawn', lotId]);

    await query(
      'UPDATE auctions SET total_lots = total_lots - 1 WHERE id = $1',
      [lot.auction_id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Delete lot error:', error);
    res.status(500).json({ error: 'Failed to delete lot' });
  }
};

// ============================================
// UPDATE AUCTION STREAM
// ============================================
const updateAuctionStream = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { isLiveStreaming, channelName } = req.body;

    const auctionCheck = await query(
      'SELECT auctioneer_id FROM auctions WHERE id = $1',
      [auctionId]
    );

    if (auctionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (auctionCheck.rows[0].auctioneer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const finalChannelName = channelName || `auction_${auctionId}_${Date.now()}`;

    await query(
      `UPDATE auctions 
       SET is_live_streaming = $1, 
           agora_channel_name = $2,
           status = CASE WHEN $1 THEN 'live' ELSE status END,
           updated_at = NOW()
       WHERE id = $3`,
      [isLiveStreaming, finalChannelName, auctionId]
    );

    const io = req.app.get('io');
    io.to(`auction-${auctionId}`).emit('stream-status', {
      isLive: isLiveStreaming,
      channelName: finalChannelName,
    });

    res.json({
      success: true,
      isLiveStreaming,
      channelName: finalChannelName,
    });
  } catch (error) {
    console.error('Update stream error:', error);
    res.status(500).json({ error: 'Failed to update stream' });
  }
};

// ============================================
// MOVE LOT
// ============================================
const moveLot = async (req, res) => {
  try {
    const { lotId } = req.params;
    const { direction } = req.body;

    const lotCheck = await query(
      `SELECT l.*, a.auctioneer_id 
       FROM lots l
       JOIN auctions a ON l.auction_id = a.id
       WHERE l.id = $1`,
      [lotId]
    );

    if (lotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }

    const lot = lotCheck.rows[0];

    if (lot.auctioneer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const currentPosition = lot.position || lot.lot_number;
    const newPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1;

    if (newPosition < 1) {
      return res.status(400).json({ error: 'Cannot move lot up further' });
    }

    const swapLot = await query(
      'SELECT id FROM lots WHERE auction_id = $1 AND (position = $2 OR lot_number = $2)',
      [lot.auction_id, newPosition]
    );

    if (swapLot.rows.length === 0) {
      return res.status(400).json({ error: 'Cannot move lot further' });
    }

    await query(
      'UPDATE lots SET position = $1 WHERE id = $2',
      [newPosition, lotId]
    );
    await query(
      'UPDATE lots SET position = $1 WHERE id = $2',
      [currentPosition, swapLot.rows[0].id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Move lot error:', error);
    res.status(500).json({ error: 'Failed to move lot' });
  }
};

module.exports = {
  getAuctions,
  getFeaturedLots,
  getEndingSoon,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
  getMyAuctions,
  addLot,
  updateLot,
  deleteLot,
  moveLot,
  updateAuctionStream,
};