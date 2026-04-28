// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { sendEmail } = require('../services/emailService');
const { validationResult } = require('express-validator');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { name, email, password, role = 'buyer', phoneNumber } = req.body;
    
    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, phone_number, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role, phoneNumber || null]
    );
    
    const user = result.rows[0];
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    
    // Send welcome email (async, don't wait)
    sendEmail({
      to: user.email,
      subject: 'Welcome to Auction Platform!',
      template: 'welcome',
      data: { name: user.name },
    }).catch(err => console.error('Welcome email failed:', err));
    
    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { email, password } = req.body;
    
    const result = await query(
      'SELECT id, name, email, password_hash, role, blocked, verified, identity_verified, reputation_score FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    if (user.blocked) {
      return res.status(403).json({ error: 'Account has been blocked' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    
    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        identityVerified: user.identity_verified,
        reputationScore: user.reputation_score,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const result = await query(
      'SELECT id, role FROM users WHERE id = $1 AND blocked = false',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    const user = result.rows[0];
    const newToken = generateToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);
    
    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, phone_number, verified, identity_verified, 
              reputation_score, rating, review_count, created_at, 
              address_street, address_city, address_country, address_postal_code
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

const logout = async (req, res) => {
  // In a real implementation, you might want to blacklist the token
  // For now, just return success
  res.json({ success: true });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await query('SELECT id, name FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Don't reveal that user doesn't exist for security
      return res.json({ success: true, message: 'If an account exists, a reset link was sent' });
    }
    
    const user = result.rows[0];
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: 'passwordReset',
      data: { name: user.name, resetLink },
    });
    
    res.json({ success: true, message: 'If an account exists, a reset link was sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, decoded.id]);
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
};