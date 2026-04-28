// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await query(
      `SELECT id, email, name, role, blocked, identity_verified, reputation_score 
       FROM users WHERE id = $1 AND blocked = false`,
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      throw new Error();
    }
    
    req.user = result.rows[0];
    req.userId = result.rows[0].id;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query(
        'SELECT id, email, name, role FROM users WHERE id = $1 AND blocked = false',
        [decoded.id]
      );
      if (result.rows.length > 0) {
        req.user = result.rows[0];
        req.userId = result.rows[0].id;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

const isAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const isAuctioneer = async (req, res, next) => {
  if (req.user.role !== 'auctioneer' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Auctioneer access required' });
  }
  next();
};

const isAuctioneerOrAdmin = async (req, res, next) => {
  if (req.user.role === 'buyer') {
    return res.status(403).json({ error: 'Auctioneer or admin access required' });
  }
  next();
};

const checkVerifiedForHighValue = async (req, res, next) => {
  const { lotId } = req.params;
  
  const lotResult = await query(
    'SELECT buy_now_price, reserve_price, starting_bid FROM lots WHERE id = $1',
    [lotId]
  );
  
  if (lotResult.rows.length === 0) {
    return res.status(404).json({ error: 'Lot not found' });
  }
  
  const lot = lotResult.rows[0];
  const highValueThreshold = 5000;
  const lotValue = lot.buy_now_price || lot.reserve_price || lot.starting_bid;
  
  if (lotValue > highValueThreshold && !req.user.identity_verified) {
    return res.status(403).json({
      error: 'Identity verification required for high-value lots',
      requiresVerification: true,
    });
  }
  
  next();
};

module.exports = {
  auth,
  optionalAuth,
  isAdmin,
  isAuctioneer,
  isAuctioneerOrAdmin,
  checkVerifiedForHighValue,
};