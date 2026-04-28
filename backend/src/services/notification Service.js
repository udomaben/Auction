// src/services/notificationService.js
const { query } = require('../config/database');
const { emailQueue } = require('./queueService');

const createNotification = async (userId, type, title, message, data = null) => {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

const notifyOutbid = async (userId, lotId, lotTitle, newBid, auctionId) => {
  const notificationId = await createNotification(
    userId,
    'outbid',
    `You've been outbid on "${lotTitle}"`,
    `Someone placed a higher bid of €${newBid.toLocaleString()}. Place a new bid to stay in the lead!`,
    { lotId, auctionId, newBid }
  );
  
  // Send email
  const userResult = await query(
    'SELECT email, name FROM users WHERE id = $1',
    [userId]
  );
  
  if (userResult.rows.length > 0) {
    await emailQueue.add({
      to: userResult.rows[0].email,
      subject: `⚠️ You've been outbid on "${lotTitle}"!`,
      template: 'outbid',
      data: {
        name: userResult.rows[0].name,
        lotTitle,
        yourBid: null,
        newBid,
        auctionId,
        lotId,
        endTime: null,
      },
    });
  }
  
  return notificationId;
};

const notifyWon = async (userId, lotId, lotTitle, winningBid, auctionId) => {
  const notificationId = await createNotification(
    userId,
    'won_auction',
    `🎉 You won "${lotTitle}"!`,
    `Congratulations! You won ${lotTitle} with a bid of €${winningBid.toLocaleString()}. Complete your payment within 3 days.`,
    { lotId, auctionId, winningBid }
  );
  
  // Send email
  const userResult = await query(
    'SELECT email, name FROM users WHERE id = $1',
    [userId]
  );
  
  if (userResult.rows.length > 0) {
    await emailQueue.add({
      to: userResult.rows[0].email,
      subject: `🎉 Congratulations! You won "${lotTitle}"!`,
      template: 'winner',
      data: {
        name: userResult.rows[0].name,
        lotTitle,
        winningBid,
        auctionTitle: null,
        paymentLink: `${process.env.CLIENT_URL}/payment/${lotId}`,
      },
    });
  }
  
  return notificationId;
};

const notifyAuctionStart = async (auctionId, auctionTitle, startTime) => {
  try {
    // Get users who follow this auction category or specific auction
    const followers = await query(`
      SELECT DISTINCT u.id, u.email, u.name
      FROM users u
      LEFT JOIN watchlist w ON w.user_id = u.id
      LEFT JOIN lots l ON w.lot_id = l.id
      WHERE l.auction_id = $1 OR u.id IN (
        SELECT user_id FROM auction_followers WHERE auction_id = $1
      )
    `, [auctionId]);
    
    for (const follower of followers.rows) {
      await createNotification(
        follower.id,
        'auction_start',
        `✨ Auction started: "${auctionTitle}"`,
        `The auction "${auctionTitle}" has started! Start bidding now!`,
        { auctionId }
      );
      
      await emailQueue.add({
        to: follower.email,
        subject: `✨ Auction started: "${auctionTitle}"`,
        template: 'auctionReminder',
        data: {
          name: follower.name,
          auctionTitle,
          timeLeft: 'just started',
          auctionId,
        },
      });
    }
  } catch (error) {
    console.error('Notify auction start error:', error);
  }
};

const notifyAuctionEnding = async (auctionId, auctionTitle, minutesLeft) => {
  try {
    // Get users watching this auction
    const watchers = await query(`
      SELECT DISTINCT u.id, u.email, u.name
      FROM watchlist w
      JOIN users u ON w.user_id = u.id
      JOIN lots l ON w.lot_id = l.id
      WHERE l.auction_id = $1
    `, [auctionId]);
    
    for (const watcher of watchers.rows) {
      await createNotification(
        watcher.id,
        'auction_ending',
        `⏰ "${auctionTitle}" ends in ${minutesLeft} minutes!`,
        `Don't miss your chance! The auction "${auctionTitle}" is ending soon.`,
        { auctionId, minutesLeft }
      );
      
      await emailQueue.add({
        to: watcher.email,
        subject: `⏰ "${auctionTitle}" ends in ${minutesLeft} minutes!`,
        template: 'auctionReminder',
        data: {
          name: watcher.name,
          auctionTitle,
          timeLeft: `${minutesLeft} minutes`,
          auctionId,
        },
      });
    }
  } catch (error) {
    console.error('Notify auction ending error:', error);
  }
};

const notifyPaymentReminder = async (lotId, lotTitle, buyerId, daysLeft) => {
  const notificationId = await createNotification(
    buyerId,
    'payment_reminder',
    `⏰ Payment reminder for "${lotTitle}"`,
    `You have ${daysLeft} days left to complete your payment for ${lotTitle}. Don't lose your winning item!`,
    { lotId, daysLeft }
  );
  
  const userResult = await query(
    'SELECT email, name FROM users WHERE id = $1',
    [buyerId]
  );
  
  if (userResult.rows.length > 0) {
    await emailQueue.add({
      to: userResult.rows[0].email,
      subject: `⏰ Payment reminder for "${lotTitle}"`,
      template: 'paymentReminder',
      data: {
        name: userResult.rows[0].name,
        lotTitle,
        daysLeft,
        paymentLink: `${process.env.CLIENT_URL}/payment/${lotId}`,
      },
    });
  }
  
  return notificationId;
};

module.exports = {
  createNotification,
  notifyOutbid,
  notifyWon,
  notifyAuctionStart,
  notifyAuctionEnding,
  notifyPaymentReminder,
};