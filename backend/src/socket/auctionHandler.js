// src/socket/auctionHandler.js
const { query } = require('../config/database');

const setupAuctionSocket = (io) => {
  const auctionNamespace = io.of('/auction');
  
  // Store active rooms
  const activeRooms = new Map();
  
  auctionNamespace.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // Join auction room
    socket.on('join-auction', async (auctionId, userId, callback) => {
      try {
        socket.join(`auction-${auctionId}`);
        socket.auctionId = auctionId;
        socket.userId = userId;
        
        // Track room
        if (!activeRooms.has(auctionId)) {
          activeRooms.set(auctionId, {
            viewers: new Set(),
            bidders: new Set(),
          });
        }
        
        activeRooms.get(auctionId).viewers.add(socket.id);
        
        // Get current auction state
        const lotsResult = await query(
          `SELECT id, title, current_bid, current_winner_id, total_bids, reserve_met, status
           FROM lots 
           WHERE auction_id = $1 AND status = 'active'
           ORDER BY lot_number`,
          [auctionId]
        );
        
        if (callback) {
          callback({
            success: true,
            lots: lotsResult.rows,
            viewerCount: activeRooms.get(auctionId).viewers.size,
          });
        }
        
        // Broadcast viewer count
        auctionNamespace.to(`auction-${auctionId}`).emit('viewer-count', {
          count: activeRooms.get(auctionId).viewers.size,
        });
        
      } catch (error) {
        console.error('Join auction error:', error);
        if (callback) {
          callback({ success: false, error: error.message });
        }
      }
    });
    
    // Place bid via socket
    socket.on('place-bid', async (data, callback) => {
      const { lotId, amount, isAutoBid, maxAmount } = data;
      
      try {
        // Forward to REST API via internal call
        // For simplicity, we'll handle the bid logic here
        
        const userId = socket.userId;
        if (!userId) {
          throw new Error('Not authenticated');
        }
        
        // Get user info
        const userResult = await query(
          'SELECT id, email, name, reputation_score FROM users WHERE id = $1 AND blocked = false',
          [userId]
        );
        
        if (userResult.rows.length === 0) {
          throw new Error('User not found or blocked');
        }
        
        const user = userResult.rows[0];
        
        // Lock lot for update
        const lotResult = await query(
          `SELECT l.*, a.end_time, a.extended_until, a.title as auction_title, a.id as auction_id
           FROM lots l
           JOIN auctions a ON l.auction_id = a.id
           WHERE l.id = $1 FOR UPDATE`,
          [lotId]
        );
        
        if (lotResult.rows.length === 0) {
          throw new Error('Lot not found');
        }
        
        const lot = lotResult.rows[0];
        const now = new Date();
        const endTime = lot.extended_until || lot.end_time;
        
        if (now > new Date(endTime)) {
          throw new Error('Auction has ended');
        }
        
        if (lot.status !== 'active') {
          throw new Error('Lot is no longer active');
        }
        
        const minBid = parseFloat(lot.current_bid) + parseFloat(lot.bid_increment);
        if (amount < minBid && !isAutoBid) {
          throw new Error(`Minimum bid is ${minBid}`);
        }
        
        // Insert bid
        await query(
          `INSERT INTO bids (lot_id, user_id, amount, is_auto_bid, max_bid_amount, created_at, is_winning)
           VALUES ($1, $2, $3, $4, $5, NOW(), TRUE)`,
          [lotId, userId, amount, isAutoBid || false, maxAmount || null]
        );
        
        // Get previous winner
        let previousWinner = null;
        if (lot.current_winner_id && lot.current_winner_id !== userId) {
          previousWinner = lot.current_winner_id;
          
          // Mark previous as outbid
          await query(
            `UPDATE bids 
             SET is_winning = FALSE, was_outbid = TRUE, outbid_at = NOW()
             WHERE lot_id = $1 AND user_id = $2 AND is_winning = TRUE`,
            [lotId, previousWinner]
          );
        }
        
        // Check reserve price
        let reserveMet = lot.reserve_met;
        if (lot.reserve_price && amount >= parseFloat(lot.reserve_price)) {
          reserveMet = true;
        }
        
        // Update lot
        await query(
          `UPDATE lots 
           SET current_bid = $1, 
               current_winner_id = $2, 
               total_bids = total_bids + 1,
               reserve_met = $3,
               updated_at = NOW()
           WHERE id = $4`,
          [amount, userId, reserveMet, lotId]
        );
        
        // Anti-sniping
        let extendedUntil = null;
        const timeLeft = new Date(endTime) - now;
        if (timeLeft < 120000 && timeLeft > 0) {
          extendedUntil = new Date(now.getTime() + 120000);
          await query(
            'UPDATE auctions SET extended_until = $1 WHERE id = $2',
            [extendedUntil, lot.auction_id]
          );
        }
        
        // Emit update to room
        auctionNamespace.to(`auction-${lot.auction_id}`).emit('bid-update', {
          lotId,
          amount,
          bidderId: userId,
          bidderName: user.name,
          currentTop: amount,
          totalBids: lot.total_bids + 1,
          reserveMet,
          extendedUntil,
          timestamp: now,
        });
        
        // Notify outbid user
        if (previousWinner) {
          auctionNamespace.to(`user-${previousWinner}`).emit('outbid', {
            lotId,
            lotTitle: lot.title,
            newBid: amount,
          });
        }
        
        if (callback) {
          callback({
            success: true,
            bid: { amount, timestamp: now },
            isTopBidder: true,
          });
        }
        
      } catch (error) {
        console.error('Socket bid error:', error);
        if (callback) {
          callback({ success: false, error: error.message });
        }
        socket.emit('bid-error', { message: error.message });
      }
    });
    
    // Set auto-bid via socket
    socket.on('set-auto-bid', async (data, callback) => {
      const { lotId, maxAmount } = data;
      const userId = socket.userId;
      
      try {
        const result = await query(
          `UPDATE lots 
           SET auto_bids = auto_bids || $1::jsonb
           WHERE id = $2
           RETURNING auto_bids`,
          [JSON.stringify([{ user_id: userId, max_amount: maxAmount, created_at: new Date(), active: true }]), lotId]
        );
        
        await query(
          `INSERT INTO auto_bid_logs (lot_id, user_id, max_amount, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [lotId, userId, maxAmount]
        );
        
        // Check if auto-bid should place bid immediately
        const lotResult = await query(
          'SELECT current_bid, bid_increment FROM lots WHERE id = $1',
          [lotId]
        );
        
        if (lotResult.rows.length > 0 && lotResult.rows[0].current_bid < maxAmount) {
          const nextBid = Math.min(
            parseFloat(lotResult.rows[0].current_bid) + parseFloat(lotResult.rows[0].bid_increment),
            maxAmount
          );
          
          socket.emit('trigger-bid', {
            lotId,
            amount: nextBid,
            isAutoBid: true,
            maxAmount,
          });
        }
        
        if (callback) {
          callback({ success: true });
        }
      } catch (error) {
        console.error('Socket auto-bid error:', error);
        if (callback) {
          callback({ success: false, error: error.message });
        }
      }
    });
    
    // Add to watchlist
    socket.on('add-watchlist', async (lotId, callback) => {
      try {
        await query(
          `INSERT INTO watchlist (user_id, lot_id, created_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT DO NOTHING`,
          [socket.userId, lotId]
        );
        
        await query(
          'UPDATE lots SET watchers_count = watchers_count + 1 WHERE id = $1',
          [lotId]
        );
        
        if (callback) callback({ success: true });
      } catch (error) {
        console.error('Add watchlist error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });
    
    // Remove from watchlist
    socket.on('remove-watchlist', async (lotId, callback) => {
      try {
        await query(
          'DELETE FROM watchlist WHERE user_id = $1 AND lot_id = $2',
          [socket.userId, lotId]
        );
        
        await query(
          'UPDATE lots SET watchers_count = GREATEST(watchers_count - 1, 0) WHERE id = $1',
          [lotId]
        );
        
        if (callback) callback({ success: true });
      } catch (error) {
        console.error('Remove watchlist error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });
    
    // Leave auction
    socket.on('leave-auction', (auctionId) => {
      socket.leave(`auction-${auctionId}`);
      
      if (activeRooms.has(auctionId)) {
        activeRooms.get(auctionId).viewers.delete(socket.id);
        auctionNamespace.to(`auction-${auctionId}`).emit('viewer-count', {
          count: activeRooms.get(auctionId).viewers.size,
        });
      }
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      if (socket.auctionId && activeRooms.has(socket.auctionId)) {
        activeRooms.get(socket.auctionId).viewers.delete(socket.id);
        auctionNamespace.to(`auction-${socket.auctionId}`).emit('viewer-count', {
          count: activeRooms.get(socket.auctionId).viewers.size,
        });
      }
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupAuctionSocket;