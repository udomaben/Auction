// backend/src/services/queueService.js
const { query } = require('../config/database');
const { sendEmail } = require('./emailService');

let emailQueue = null;
let auctionEndQueue = null;
let paymentQueue = null;
let redisEnabled = false;

// Only initialize queues if Redis is configured and available
if (process.env.REDIS_HOST && process.env.REDIS_HOST !== '') {
  try {
    const Queue = require('bull');
    const redisConfig = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };
    
    emailQueue = new Queue('email', { redis: redisConfig });
    auctionEndQueue = new Queue('auction-end', { redis: redisConfig });
    paymentQueue = new Queue('payment', { redis: redisConfig });
    
    // Test connection
    emailQueue.client.on('connect', () => {
      console.log('✅ Bull queues initialized with Redis');
      redisEnabled = true;
    });
    
    emailQueue.client.on('error', (err) => {
      console.warn('⚠️ Redis connection error, queues disabled:', err.message);
      redisEnabled = false;
    });
    
    // Process email queue
    emailQueue.process(async (job) => {
      const { to, subject, template, data } = job.data;
      return await sendEmail({ to, subject, template, data });
    });
    
    // Process auction end queue
    auctionEndQueue.process(async (job) => {
      const { auctionId } = job.data;
      
      try {
        const auctionResult = await query(
          'SELECT title, auctioneer_id FROM auctions WHERE id = $1',
          [auctionId]
        );
        
        if (auctionResult.rows.length === 0) return;
        
        const auction = auctionResult.rows[0];
        
        // Get all winners
        const winnersResult = await query(`
          SELECT DISTINCT u.id, u.email, u.name, l.id as lot_id, l.title as lot_title, l.current_bid as winning_bid
          FROM lots l
          JOIN users u ON l.current_winner_id = u.id
          WHERE l.auction_id = $1 AND l.status = 'sold'
        `, [auctionId]);
        
        for (const winner of winnersResult.rows) {
          await emailQueue.add({
            to: winner.email,
            subject: `🎉 You won "${winner.lot_title}"!`,
            template: 'winner',
            data: {
              name: winner.name,
              lotTitle: winner.lot_title,
              winningBid: winner.winning_bid,
              auctionTitle: auction.title,
              paymentLink: `${process.env.CLIENT_URL}/payment/${winner.lot_id}`,
            },
          });
          
          // Create notification in DB
          await query(
            `INSERT INTO notifications (user_id, type, title, message, data, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              winner.id,
              'won_auction',
              `You won "${winner.lot_title}"!`,
              `Congratulations! You won ${winner.lot_title} with a bid of €${winner.winning_bid}.`,
              JSON.stringify({ lotId: winner.lot_id, auctionId }),
            ]
          );
        }
        
        // Update auction status
        await query('UPDATE auctions SET status = $1 WHERE id = $2', ['ended', auctionId]);
        
        console.log(`Auction ${auctionId} ended, notified ${winnersResult.rows.length} winners`);
      } catch (error) {
        console.error(`Error processing auction end for ${auctionId}:`, error);
      }
    });
    
    // Process payment queue
    paymentQueue.process(async (job) => {
      const { paymentId, lotId, buyerId, amount } = job.data;
      
      try {
        await query(
          `UPDATE payments 
           SET payment_status = 'completed', paid_at = NOW()
           WHERE id = $1`,
          [paymentId]
        );
        
        await query(
          `UPDATE lots 
           SET winner_paid = TRUE, payment_completed_at = NOW()
           WHERE id = $1`,
          [lotId]
        );
        
        await query(
          `UPDATE users 
           SET reputation_score = LEAST(reputation_score + 5, 100),
               total_paid = total_paid + $1
           WHERE id = $2`,
          [amount, buyerId]
        );
        
        console.log(`Payment ${paymentId} processed successfully`);
      } catch (error) {
        console.error(`Error processing payment ${paymentId}:`, error);
      }
    });
    
  } catch (error) {
    console.warn('⚠️ Failed to initialize Bull queues:', error.message);
    redisEnabled = false;
    // Create mock queues
    emailQueue = { add: async () => console.log('📧 Email would be sent (Redis unavailable)') };
    auctionEndQueue = { add: async () => {} };
    paymentQueue = { add: async () => {} };
  }
} else {
  console.log('ℹ️ Redis not configured, queues disabled');
  // Create mock queues that don't do anything
  emailQueue = { 
    add: async (data) => {
      console.log(`📧 Email would be sent to ${data.to} (Redis not configured)`);
      // Fallback: send email synchronously
      try {
        await sendEmail(data);
      } catch (error) {
        console.error('Fallback email failed:', error);
      }
    }
  };
  auctionEndQueue = { add: async () => console.log('⏰ Auction end notification (Redis not configured)') };
  paymentQueue = { add: async () => console.log('💰 Payment processing (Redis not configured)') };
}

// Schedule auction end checks (only if Redis is enabled)
const scheduleAuctionEndChecks = () => {
  if (!redisEnabled) {
    console.log('ℹ️ Auction end checks disabled (Redis not available)');
    return;
  }
  
  setInterval(async () => {
    try {
      const result = await query(`
        SELECT id, end_time, title
        FROM auctions 
        WHERE status = 'live' 
        AND end_time <= NOW() + INTERVAL '1 hour'
        AND end_time > NOW()
      `);
      
      for (const auction of result.rows) {
        const timeUntilEnd = new Date(auction.end_time) - new Date();
        const minutesLeft = Math.floor(timeUntilEnd / 60000);
        
        if (minutesLeft <= 30 && minutesLeft > 25 && auctionEndQueue) {
          // Get watchers
          const watchers = await query(`
            SELECT DISTINCT u.id, u.email, u.name
            FROM watchlist w
            JOIN users u ON w.user_id = u.id
            JOIN lots l ON w.lot_id = l.id
            WHERE l.auction_id = $1
          `, [auction.id]);
          
          for (const watcher of watchers.rows) {
            await emailQueue.add({
              to: watcher.email,
              subject: `⏰ "${auction.title}" ends in ${minutesLeft} minutes!`,
              template: 'auctionReminder',
              data: {
                name: watcher.name,
                auctionTitle: auction.title,
                timeLeft: `${minutesLeft} minutes`,
                auctionId: auction.id,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking auction end times:', error);
    }
  }, 60000);
};

// Start scheduler
scheduleAuctionEndChecks();

// Mock functions for when Redis is disabled
const addToEmailQueue = async (data) => {
  if (emailQueue && redisEnabled) {
    return await emailQueue.add(data);
  } else {
    console.log(`📧 Fallback email to ${data.to}`);
    return await sendEmail(data);
  }
};

const addToAuctionEndQueue = async (data) => {
  if (auctionEndQueue && redisEnabled) {
    return await auctionEndQueue.add(data);
  } else {
    console.log(`⏰ Fallback auction end for ${data.auctionId}`);
    // Process immediately
    return await auctionEndQueue?.add(data);
  }
};

const addToPaymentQueue = async (data) => {
  if (paymentQueue && redisEnabled) {
    return await paymentQueue.add(data);
  } else {
    console.log(`💰 Fallback payment for ${data.paymentId}`);
    return await paymentQueue?.add(data);
  }
};

module.exports = {
  emailQueue,
  auctionEndQueue,
  paymentQueue,
  redisEnabled,
  addToEmailQueue,
  addToAuctionEndQueue,
  addToPaymentQueue,
  setupBullQueues: () => {
    if (redisEnabled) {
      console.log('✅ Bull queues ready');
    } else {
      console.log('⚠️ Bull queues disabled (Redis not available)');
    }
  },
};