// src/server.js
const { app, server, io } = require('./app');

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║   🚀 AUCTION PLATFORM BACKEND STARTED                                 ║
║                                                                       ║
║   📍 API URL: http://localhost:${PORT}                                 ║
║   🔌 WebSocket: ws://localhost:${PORT}                                 ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}            ║
║   🗄️  Database: PostgreSQL                                           ║
║                                                                       ║
║   📚 Main Endpoints:                                                 ║
║   • GET  /health              - Health check                         ║
║   • POST /api/auth/login      - User login                           ║
║   • POST /api/auth/register   - User registration                    ║
║   • GET  /api/auctions        - List auctions                        ║
║   • GET  /api/auctions/:id    - Get auction details                  ║
║   • POST /api/auctions        - Create auction (auctioneer)          ║
║   • GET  /api/admin/dashboard - Admin dashboard                      ║
║                                                                      ║
║   🔌 Socket.IO Events:                                               ║
║   • join-auction    - Join auction room for real-time updates        ║
║   • place-bid       - Place a bid on a lot                           ║
║   • set-auto-bid    - Set automatic bidding (max bid)                ║
║   • add-watchlist   - Add lot to user's watchlist                    ║
║   • leave-auction   - Leave auction room                             ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };