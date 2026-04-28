// src/routes/auth.js
const express = require('express');
const {
  register,
  login,
  refreshToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate, registerValidation, loginValidation } = require('../middleware/validation');
const router = express.Router();

router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);

module.exports = router;