// backend/src/scripts/seed.js
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const seedDatabase = async () => {
  console.log('🌱 Seeding database...');
  
  try {
    // Check if admin already exists
    const adminCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['admin@auction.com']
    );
    
    if (adminCheck.rows.length === 0) {
      // Hash passwords
      const saltRounds = 12;
      const adminPassword = await bcrypt.hash('Admin123!', saltRounds);
      const auctioneerPassword = await bcrypt.hash('Auction123!', saltRounds);
      const buyerPassword = await bcrypt.hash('Buyer123!', saltRounds);
      
      // Create admin user
      const adminResult = await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, verified, identity_verified, reputation_score, created_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        ['System Administrator', 'admin@auction.com', adminPassword, 'admin', true, true, 100]
      );
      console.log('✅ Admin user created (admin@auction.com / Admin123!)');
      
      // Create auctioneer user
      const auctioneerResult = await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, verified, identity_verified, reputation_score, created_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        ['Premium Auctioneer', 'auctioneer@example.com', auctioneerPassword, 'auctioneer', true, true, 95]
      );
      console.log('✅ Auctioneer user created (auctioneer@example.com / Auction123!)');
      
      const auctioneerId = auctioneerResult.rows[0].id;
      
      // Create sample auction
      await pool.query(
        `INSERT INTO auctions (id, auctioneer_id, title, description, slug, start_time, end_time, category, cover_image, status, created_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW() - INTERVAL '1 day', NOW() + INTERVAL '5 days', $5, $6, 'live', NOW())`,
        [auctioneerId, 'Premier Art Auction', 'Fine art from renowned artists', 'premier-art-auction', 'Art', '/images/sample-auction.jpg']
      );
      console.log('✅ Sample auction created');
      
      // Create buyer user
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, verified, identity_verified, reputation_score, created_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
        ['Collector Buyer', 'buyer@example.com', buyerPassword, 'buyer', true, false, 100]
      );
      console.log('✅ Buyer user created (buyer@example.com / Buyer123!)');
      
    } else {
      console.log('ℹ️ Users already exist, skipping seed');
    }
    
    console.log('🎉 Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();