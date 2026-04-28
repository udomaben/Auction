// src/services/emailService.js
const nodemailer = require('nodemailer');

let transporter = null;

const initTransporter = () => {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email service error:', error);
      } else {
        console.log('✅ Email service ready');
      }
    });
  }
};

const templates = {
  welcome: (data) => ({
    subject: `Welcome to Auction Platform, ${data.name}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0033ff; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Auction Platform</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Hi ${data.name},</h2>
            <p>Thank you for joining our auction platform! We're excited to have you on board.</p>
            <p>With your account, you can:</p>
            <ul>
              <li>Bid on thousands of unique objects</li>
              <li>Follow your favorite auctions</li>
              <li>Receive personalized recommendations</li>
              <li>Track your bids and wins</li>
            </ul>
            <a href="${process.env.CLIENT_URL}/explore" style="display: inline-block; background-color: #0033ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              Start Exploring
            </a>
          </div>
          <div style="background-color: #f0f1f5; padding: 20px; text-align: center; font-size: 12px; color: #565b60;">
            <p>&copy; ${new Date().getFullYear()} Auction Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  
  outbid: (data) => ({
    subject: `⚠️ You've been outbid on "${data.lotTitle}"!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background-color: #e62333; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">You've Been Outbid!</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Hi ${data.name},</h2>
            <p>Someone placed a higher bid on <strong>${data.lotTitle}</strong>.</p>
            <div style="background-color: #f0f1f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Your bid:</strong> €${data.yourBid.toLocaleString()}</p>
              <p><strong>New bid:</strong> €${data.newBid.toLocaleString()}</p>
              <p><strong>Auction ends:</strong> ${new Date(data.endTime).toLocaleString()}</p>
            </div>
            <a href="${process.env.CLIENT_URL}/auction/${data.auctionId}/lot/${data.lotId}" style="display: inline-block; background-color: #0033ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Place Higher Bid
            </a>
          </div>
          <div style="background-color: #f0f1f5; padding: 20px; text-align: center; font-size: 12px; color: #565b60;">
            <p>&copy; ${new Date().getFullYear()} Auction Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  
  winner: (data) => ({
    subject: `🎉 Congratulations! You won "${data.lotTitle}"!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background-color: #11a88a; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">You Won!</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Congratulations ${data.name}!</h2>
            <p>You are the winner of <strong>${data.lotTitle}</strong>!</p>
            <div style="background-color: #f0f1f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Winning bid:</strong> €${data.winningBid.toLocaleString()}</p>
              <p><strong>Auction:</strong> ${data.auctionTitle}</p>
            </div>
            <p>Please complete your payment within 3 days to secure your item.</p>
            <a href="${data.paymentLink}" style="display: inline-block; background-color: #0033ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Make Payment
            </a>
          </div>
          <div style="background-color: #f0f1f5; padding: 20px; text-align: center; font-size: 12px; color: #565b60;">
            <p>&copy; ${new Date().getFullYear()} Auction Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  
  auctionReminder: (data) => ({
    subject: `⏰ Reminder: "${data.auctionTitle}" ends in ${data.timeLeft}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5a623; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Auction Ending Soon!</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Hi ${data.name},</h2>
            <p>The auction <strong>${data.auctionTitle}</strong> ends in ${data.timeLeft}!</p>
            <p>Don't miss your chance to win these special objects.</p>
            <a href="${process.env.CLIENT_URL}/auction/${data.auctionId}" style="display: inline-block; background-color: #0033ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              View Auction
            </a>
          </div>
          <div style="background-color: #f0f1f5; padding: 20px; text-align: center; font-size: 12px; color: #565b60;">
            <p>&copy; ${new Date().getFullYear()} Auction Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  
  paymentConfirmation: (data) => ({
    subject: `✓ Payment Confirmed for "${data.lotTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background-color: #11a88a; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Payment Confirmed!</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Thank you ${data.name}!</h2>
            <p>Your payment of <strong>€${data.amount.toLocaleString()}</strong> for <strong>${data.lotTitle}</strong> has been confirmed.</p>
            <p>The seller will now prepare your item for shipping. You will receive tracking information soon.</p>
            <a href="${process.env.CLIENT_URL}/buyer/orders" style="display: inline-block; background-color: #0033ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              View My Orders
            </a>
          </div>
          <div style="background-color: #f0f1f5; padding: 20px; text-align: center; font-size: 12px; color: #565b60;">
            <p>&copy; ${new Date().getFullYear()} Auction Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  
  passwordReset: (data) => ({
    subject: `Reset Your Password`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0033ff; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Reset Your Password</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Hi ${data.name},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            <a href="${data.resetLink}" style="display: inline-block; background-color: #0033ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
          </div>
          <div style="background-color: #f0f1f5; padding: 20px; text-align: center; font-size: 12px; color: #565b60;">
            <p>&copy; ${new Date().getFullYear()} Auction Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

const sendEmail = async ({ to, subject, template, data }) => {
  initTransporter();
  
  if (!transporter) {
    console.log('Email not configured, skipping send to:', to);
    return { success: false, message: 'Email service not configured' };
  }
  
  const templateData = templates[template](data);
  
  const mailOptions = {
    from: `"Auction Platform" <${process.env.EMAIL_FROM || 'noreply@auction.com'}>`,
    to,
    subject: subject || templateData.subject,
    html: templateData.html,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

const sendBulkEmails = async (emails) => {
  const results = [];
  for (const email of emails) {
    const result = await sendEmail(email);
    results.push({ ...result, to: email.to });
  }
  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  initTransporter,
};