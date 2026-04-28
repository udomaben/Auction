const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Test endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

app.get('/api/auctions', (req, res) => {
  res.json({
    auctions: [
      {
        id: 1,
        title: 'Test Auction',
        status: 'live',
        auctioneer_name: 'Test Seller',
        cover_image: null,
        end_time: new Date(Date.now() + 86400000).toISOString(),
        total_lots: 10,
        total_bids: 25,
        highest_bid: 1500
      }
    ],
    pagination: { total: 1, page: 1, limit: 20, pages: 1 }
  });
});

app.get('/api/auctions/featured-lots', (req, res) => {
  res.json({ lots: [] });
});

app.get('/api/auctions/ending-soon', (req, res) => {
  res.json({ auctions: [] });
});

app.listen(PORT, () => {
  console.log(`✅ Test backend running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}/health`);
});