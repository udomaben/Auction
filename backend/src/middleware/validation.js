// src/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  };
};

// Auth validations
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  body('role')
    .optional()
    .isIn(['buyer', 'auctioneer'])
    .withMessage('Role must be buyer or auctioneer'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Auction validations
const createAuctionValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  body('startTime')
    .isISO8601()
    .withMessage('Valid start time is required')
    .custom(value => new Date(value) > new Date())
    .withMessage('Start time must be in the future'),
  body('endTime')
    .isISO8601()
    .withMessage('Valid end time is required')
    .custom((value, { req }) => new Date(value) > new Date(req.body.startTime))
    .withMessage('End time must be after start time'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
];

const createLotValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required'),
  body('startingBid')
    .isFloat({ min: 1 })
    .withMessage('Starting bid must be at least 1'),
  body('bidIncrement')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Bid increment must be at least 1'),
  body('reservePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Reserve price must be a positive number'),
];

// Bid validation
const placeBidValidation = [
  body('lotId')
    .isUUID()
    .withMessage('Valid lot ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Bid amount must be a positive number'),
];

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createAuctionValidation,
  createLotValidation,
  placeBidValidation,
  paginationValidation,
};