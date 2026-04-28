// src/routes/payments.js
const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Placeholder for payment routes
// Will be implemented with Mercado Pago integration

router.post('/create-preference', auth, async (req, res) => {
  // TODO: Implement Mercado Pago preference creation
  res.json({ message: 'Payment endpoint - to be implemented' });
});

router.post('/webhook', async (req, res) => {
  // TODO: Implement Mercado Pago webhook handler
  res.status(200).json({ received: true });
});

module.exports = router;