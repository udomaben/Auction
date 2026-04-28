// src/services/paymentService.js
const mercadopago = require('mercadopago');
const { query, transaction } = require('../config/database');
const { paymentQueue } = require('./queueService');

// Initialize Mercado Pago
if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  });
  console.log('✅ Mercado Pago initialized');
}

const createPaymentPreference = async (lotId, buyerId, platformCommission = 9) => {
  try {
    // Get lot and auction info
    const lotResult = await query(
      `SELECT l.*, a.title as auction_title, a.commission_rate, u.name as seller_name, u.email as seller_email
       FROM lots l
       JOIN auctions a ON l.auction_id = a.id
       JOIN users u ON a.auctioneer_id = u.id
       WHERE l.id = $1`,
      [lotId]
    );
    
    if (lotResult.rows.length === 0) {
      throw new Error('Lot not found');
    }
    
    const lot = lotResult.rows[0];
    const finalAmount = parseFloat(lot.current_bid);
    const commissionAmount = finalAmount * (lot.commission_rate / 100);
    const sellerPayout = finalAmount - commissionAmount;
    
    // Create payment record
    const paymentResult = await query(
      `INSERT INTO payments (lot_id, buyer_id, seller_id, amount, platform_commission, seller_payout, payment_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
       RETURNING id`,
      [lotId, buyerId, lot.auctioneer_id, finalAmount, commissionAmount, sellerPayout]
    );
    
    const paymentId = paymentResult.rows[0].id;
    
    // Create Mercado Pago preference
    const preference = {
      items: [
        {
          id: lotId,
          title: lot.title,
          quantity: 1,
          currency_id: 'USD',
          unit_price: finalAmount,
          description: `Winning bid for ${lot.title} in auction: ${lot.auction_title}`,
        },
      ],
      payer: {
        email: req.user?.email || 'buyer@example.com',
      },
      back_urls: {
        success: `${process.env.CLIENT_URL}/payment/success`,
        failure: `${process.env.CLIENT_URL}/payment/failure`,
        pending: `${process.env.CLIENT_URL}/payment/pending`,
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_methods: [],
        installments: 1,
      },
      external_reference: paymentId,
      notification_url: `${process.env.API_URL}/api/payments/webhook`,
      metadata: {
        lot_id: lotId,
        buyer_id: buyerId,
        seller_id: lot.auctioneer_id,
        payment_id: paymentId,
      },
    };
    
    const response = await mercadopago.preferences.create(preference);
    
    return {
      preferenceId: response.body.id,
      initPoint: response.body.init_point,
      paymentId,
    };
  } catch (error) {
    console.error('Create payment preference error:', error);
    throw error;
  }
};

const processWebhook = async (paymentData) => {
  try {
    const { id, status, external_reference, metadata } = paymentData;
    
    if (status === 'approved') {
      // Update payment status in database
      await query(
        `UPDATE payments 
         SET payment_status = 'completed', 
             transaction_id = $1,
             mercadopago_payment_id = $2,
             paid_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [id, id, external_reference]
      );
      
      // Add to payment queue for processing
      await paymentQueue.add({
        paymentId: external_reference,
        lotId: metadata?.lot_id,
        buyerId: metadata?.buyer_id,
        amount: metadata?.amount,
      });
      
      return { success: true };
    } else if (status === 'failed') {
      await query(
        `UPDATE payments 
         SET payment_status = 'failed', 
             updated_at = NOW()
         WHERE id = $1`,
        [external_reference]
      );
      return { success: false, status };
    }
    
    return { success: true, status };
  } catch (error) {
    console.error('Process webhook error:', error);
    throw error;
  }
};

const getPaymentStatus = async (paymentId) => {
  try {
    const result = await query(
      `SELECT * FROM payments WHERE id = $1`,
      [paymentId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Payment not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Get payment status error:', error);
    throw error;
  }
};

const releasePaymentToSeller = async (paymentId) => {
  try {
    await transaction(async (client) => {
      const paymentResult = await client.query(
        `SELECT * FROM payments WHERE id = $1 FOR UPDATE`,
        [paymentId]
      );
      
      if (paymentResult.rows.length === 0) {
        throw new Error('Payment not found');
      }
      
      const payment = paymentResult.rows[0];
      
      if (payment.payment_status !== 'completed') {
        throw new Error('Payment not completed');
      }
      
      if (payment.released_to_seller_at) {
        throw new Error('Payment already released');
      }
      
      await client.query(
        `UPDATE payments 
         SET released_to_seller_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [paymentId]
      );
      
      // Update seller's total earnings
      await client.query(
        `UPDATE users 
         SET total_paid = total_paid + $1
         WHERE id = $2`,
        [payment.seller_payout, payment.seller_id]
      );
    });
    
    return { success: true };
  } catch (error) {
    console.error('Release payment error:', error);
    throw error;
  }
};

module.exports = {
  createPaymentPreference,
  processWebhook,
  getPaymentStatus,
  releasePaymentToSeller,
};