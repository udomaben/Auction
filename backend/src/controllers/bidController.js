// backend/src/controllers/bidController.js
const { query, transaction } = require('../config/database');
const { addToEmailQueue } = require('../services/queueService');

// ============================================
// PLACE A BID
// ============================================
const placeBid = async (req, res) => {
  const { lotId, amount, isAutoBid = false, maxAmount = null } = req.body;
  const userId = req.user.id;

  try {
    const result = await transaction(async (client) => {
      // Lock the lot for update to prevent race conditions
      const lotResult = await client.query(
        `SELECT l.*, a.end_time, a.extended_until, a.title as auction_title, a.id as auction_id,
                u.name as current_winner_name, u.email as current_winner_email
         FROM lots l
         JOIN auctions a ON l.auction_id = a.id
         LEFT JOIN users u ON l.current_winner_id = u.id
         WHERE l.id = $1 FOR UPDATE`,
        [lotId]
      );

      if (lotResult.rows.length === 0) {
        throw new Error('Lot not found');
      }

      const lot = lotResult.rows[0];
      const now = new Date();
      const endTime = lot.extended_until || lot.end_time;

      // Check if auction is still active
      if (now > new Date(endTime)) {
        throw new Error('Auction has ended');
      }

      // Check if lot is active
      if (lot.status !== 'active') {
        throw new Error('Lot is no longer active');
      }

      // Check minimum bid
      const minBid = parseFloat(lot.current_bid) + parseFloat(lot.bid_increment);
      if (amount < minBid && !isAutoBid) {
        throw new Error(`Minimum bid is ${minBid}`);
      }

      // Insert bid
      const bidResult = await client.query(
        `INSERT INTO bids (lot_id, user_id, amount, is_auto_bid, max_bid_amount, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [lotId, userId, amount, isAutoBid, maxAmount, req.ip, req.headers['user-agent']]
      );

      const bid = bidResult.rows[0];

      // Get previous winner for outbid notification
      let previousWinner = null;
      let previousWinnerEmail = null;
      if (lot.current_winner_id && lot.current_winner_id !== userId) {
        previousWinner = lot.current_winner_id;
        previousWinnerEmail = lot.current_winner_email;
      }

      // Check reserve price
      let reserveMet = lot.reserve_met;
      if (lot.reserve_price && amount >= parseFloat(lot.reserve_price)) {
        reserveMet = true;
      }

      // Update lot
      await client.query(
        `UPDATE lots 
         SET current_bid = $1, 
             current_winner_id = $2, 
             total_bids = total_bids + 1,
             reserve_met = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [amount, userId, reserveMet, lotId]
      );

      // Anti-sniping: extend time if bid in last 2 minutes
      let extendedUntil = null;
      const timeLeft = new Date(endTime) - now;
      if (timeLeft < 120000 && timeLeft > 0) {
        extendedUntil = new Date(now.getTime() + 120000);
        await client.query(
          'UPDATE auctions SET extended_until = $1 WHERE id = $2',
          [extendedUntil, lot.auction_id]
        );
      }

      // Mark previous winning bid as not winning
      if (previousWinner) {
        await client.query(
          `UPDATE bids 
           SET is_winning = FALSE, was_outbid = TRUE, outbid_at = NOW()
           WHERE lot_id = $1 AND user_id = $2 AND is_winning = TRUE`,
          [lotId, previousWinner]
        );
      }

      // Mark this bid as winning
      await client.query(
        'UPDATE bids SET is_winning = TRUE WHERE id = $1',
        [bid.id]
      );

      return {
        bid,
        lot,
        previousWinner,
        previousWinnerEmail,
        extendedUntil,
        reserveMet,
        timeLeft,
      };
    });

    // Send outbid notification (async)
    if (result.previousWinner && result.previousWinnerEmail) {
      addToEmailQueue({
        to: result.previousWinnerEmail,
        subject: `⚠️ You've been outbid!`,
        template: 'outbid',
        data: {
          lotTitle: result.lot.title,
          newBid: amount,
          auctionId: result.lot.auction_id,
          lotId,
        },
      });
    }

    // Emit via Socket.IO
    const io = req.app.get('io');
    io.to(`auction-${result.lot.auction_id}`).emit('bid-update', {
      lotId,
      amount,
      bidderId: userId,
      currentTop: amount,
      totalBids: result.lot.total_bids + 1,
      reserveMet: result.reserveMet,
      extendedUntil: result.extendedUntil,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      bid: result.bid,
      isTopBidder: true,
      reserveMet: result.reserveMet,
      extendedUntil: result.extendedUntil,
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// SET AUTO BID (MAX BID)
// ============================================
const setAutoBid = async (req, res) => {
  const { lotId, maxAmount } = req.body;
  const userId = req.user.id;

  try {
    const result = await transaction(async (client) => {
      // Get lot info
      const lotResult = await client.query(
        `SELECT l.*, a.auctioneer_id, a.status
         FROM lots l
         JOIN auctions a ON l.auction_id = a.id
         WHERE l.id = $1 FOR UPDATE`,
        [lotId]
      );

      if (lotResult.rows.length === 0) {
        throw new Error('Lot not found');
      }

      const lot = lotResult.rows[0];

      if (lot.status !== 'active') {
        throw new Error('Lot is not active');
      }

      // Store auto-bid in JSONB field (admin only visible)
      const currentAutoBids = lot.auto_bids || [];
      const existingIndex = currentAutoBids.findIndex(b => b.user_id === userId);

      if (existingIndex >= 0) {
        currentAutoBids[existingIndex] = {
          user_id: userId,
          max_amount: maxAmount,
          created_at: new Date().toISOString(),
          active: true,
        };
      } else {
        currentAutoBids.push({
          user_id: userId,
          max_amount: maxAmount,
          created_at: new Date().toISOString(),
          active: true,
        });
      }

      await client.query(
        'UPDATE lots SET auto_bids = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(currentAutoBids), lotId]
      );

      // Log for audit
      await client.query(
        `INSERT INTO auto_bid_logs (lot_id, user_id, max_amount, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [lotId, userId, maxAmount]
      );

      // Immediately place a bid if this auto-bid is higher than current
      let placedBid = null;
      if (lot.current_bid < maxAmount) {
        const nextBid = Math.min(
          parseFloat(lot.current_bid) + parseFloat(lot.bid_increment),
          maxAmount
        );

        // Place bid
        await client.query(
          `INSERT INTO bids (lot_id, user_id, amount, is_auto_bid, max_bid_amount, created_at, is_winning)
           VALUES ($1, $2, $3, TRUE, $4, NOW(), TRUE)`,
          [lotId, userId, nextBid, maxAmount]
        );

        // Update previous winning bid
        if (lot.current_winner_id && lot.current_winner_id !== userId) {
          await client.query(
            `UPDATE bids 
             SET is_winning = FALSE, was_outbid = TRUE, outbid_at = NOW()
             WHERE lot_id = $1 AND user_id = $2 AND is_winning = TRUE`,
            [lotId, lot.current_winner_id]
          );
        }

        // Update lot
        await client.query(
          `UPDATE lots 
           SET current_bid = $1, current_winner_id = $2, total_bids = total_bids + 1, updated_at = NOW()
           WHERE id = $3`,
          [nextBid, userId, lotId]
        );

        placedBid = { amount: nextBid };
      }

      return { placedBid, lot };
    });

    // Emit if a bid was placed
    if (result.placedBid) {
      const io = req.app.get('io');
      io.to(`auction-${result.lot.auction_id}`).emit('bid-update', {
        lotId,
        amount: result.placedBid.amount,
        bidderId: userId,
        currentTop: result.placedBid.amount,
        isAutoBid: true,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Auto-bid set successfully',
      placedBid: result.placedBid,
    });
  } catch (error) {
    console.error('Set auto-bid error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// GET BID HISTORY FOR A LOT
// ============================================
const getBidHistory = async (req, res) => {
  try {
    const { lotId } = req.params;
    const { limit = 50 } = req.query;

    const result = await query(
      `SELECT b.*, u.name as bidder_name, u.avatar_url as bidder_avatar
       FROM bids b
       JOIN users u ON b.user_id = u.id
       WHERE b.lot_id = $1
       ORDER BY b.amount DESC
       LIMIT $2`,
      [lotId, parseInt(limit)]
    );

    // Get total bids count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM bids WHERE lot_id = $1',
      [lotId]
    );

    res.json({
      bids: result.rows,
      total: parseInt(countResult.rows[0].total),
    });
  } catch (error) {
    console.error('Get bid history error:', error);
    res.status(500).json({ error: 'Failed to fetch bid history' });
  }
};

// ============================================
// GET USER'S BID ACTIVITY
// ============================================
const getMyBids = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const userId = req.user.id;

    let sql = `
      SELECT b.*, l.title as lot_title, l.main_image, l.current_bid as lot_current_bid,
             a.title as auction_title, a.id as auction_id, a.end_time,
             CASE 
               WHEN l.current_winner_id = $1 AND l.status = 'sold' THEN 'won'
               WHEN l.current_winner_id = $1 AND l.status = 'active' THEN 'winning'
               WHEN b.was_outbid = TRUE THEN 'outbid'
               ELSE 'losing'
             END as bid_status
      FROM bids b
      JOIN lots l ON b.lot_id = l.id
      JOIN auctions a ON l.auction_id = a.id
      WHERE b.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (status === 'winning') {
      sql += ` AND l.current_winner_id = $${paramIndex++}`;
      params.push(userId);
      sql += ` AND l.status = 'active'`;
    } else if (status === 'won') {
      sql += ` AND l.current_winner_id = $${paramIndex++}`;
      params.push(userId);
      sql += ` AND l.status = 'sold'`;
    } else if (status === 'outbid') {
      sql += ` AND b.was_outbid = TRUE`;
    }

    sql += ` ORDER BY b.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);

    const countResult = await query(
      'SELECT COUNT(*) as total FROM bids WHERE user_id = $1',
      [userId]
    );

    res.json({
      bids: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
};

module.exports = {
  placeBid,
  setAutoBid,
  getBidHistory,
  getMyBids,
};