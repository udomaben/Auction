// backend/src/routes/auctions.js
const express = require('express');
const {
  getAuctions,
  getFeaturedLots,
  getEndingSoon,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
  addLot,
  updateLot,
  deleteLot,
  moveLot,
  getMyAuctions,
  updateAuctionStream,
} = require('../controllers/auctionController');
const { placeBid, setAutoBid, getBidHistory } = require('../controllers/bidController');
const { auth, isAuctioneerOrAdmin, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// ============================================
// IMPORTANT: SPECIFIC ROUTES MUST COME FIRST
// ============================================

// Public routes - specific first
router.get('/', optionalAuth, getAuctions);
router.get('/featured-lots', optionalAuth, getFeaturedLots);     // ← MUST be before /:id
router.get('/ending-soon', optionalAuth, getEndingSoon);         // ← MUST be before /:id

// Auctioneer's own auctions
router.get('/my/auctions', auth, isAuctioneerOrAdmin, getMyAuctions);

// Generic auction by ID - MUST be LAST
router.get('/:id', optionalAuth, getAuctionById);

// Lot bid history
router.get('/lots/:lotId/bids', getBidHistory);

// ============================================
// PROTECTED ROUTES
// ============================================

// Auction CRUD
router.post('/', auth, isAuctioneerOrAdmin, createAuction);
router.put('/:id', auth, isAuctioneerOrAdmin, updateAuction);
router.delete('/:id', auth, isAuctioneerOrAdmin, deleteAuction);

// Lot management
router.post('/:auctionId/lots', auth, isAuctioneerOrAdmin, addLot);
router.put('/lots/:lotId', auth, isAuctioneerOrAdmin, updateLot);
router.delete('/lots/:lotId', auth, isAuctioneerOrAdmin, deleteLot);
router.patch('/lots/:lotId/move', auth, isAuctioneerOrAdmin, moveLot);

// Bidding
router.post('/bids', auth, placeBid);
router.post('/auto-bids', auth, setAutoBid);

// Live streaming
router.patch('/:auctionId/stream', auth, isAuctioneerOrAdmin, updateAuctionStream);

module.exports = router;