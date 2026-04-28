// src/utils/validators.js

const validateAuctionDates = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();
  
  if (start < now) {
    return { valid: false, message: 'Start time must be in the future' };
  }
  
  if (end <= start) {
    return { valid: false, message: 'End time must be after start time' };
  }
  
  const minDuration = 60 * 60 * 1000; // 1 hour
  if (end - start < minDuration) {
    return { valid: false, message: 'Auction must last at least 1 hour' };
  }
  
  const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 days
  if (end - start > maxDuration) {
    return { valid: false, message: 'Auction cannot exceed 30 days' };
  }
  
  return { valid: true };
};

const validateBidAmount = (amount, currentBid, bidIncrement, startingBid, isFirstBid = false) => {
  if (isFirstBid) {
    if (amount < startingBid) {
      return { valid: false, message: `Minimum bid is ${startingBid}` };
    }
  } else {
    const minBid = currentBid + bidIncrement;
    if (amount < minBid) {
      return { valid: false, message: `Minimum bid is ${minBid}` };
    }
  }
  
  if (amount > 1000000) {
    return { valid: false, message: 'Bid amount exceeds maximum allowed' };
  }
  
  return { valid: true };
};

const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
};

const validateImageUrl = (url) => {
  if (!url) return { valid: false, message: 'Image URL is required' };
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const lowerUrl = url.toLowerCase();
  
  const hasValidExtension = allowedExtensions.some(ext => lowerUrl.includes(ext));
  if (!hasValidExtension) {
    return { valid: false, message: 'Image must be JPG, PNG, WEBP, or GIF' };
  }
  
  return { valid: true };
};

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
  
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: 'Invalid phone number format' };
  }
  
  return { valid: true };
};

const validateAddress = (address) => {
  const required = ['street', 'city', 'country', 'postalCode'];
  const missing = required.filter(field => !address[field]);
  
  if (missing.length > 0) {
    return { valid: false, message: `Missing required fields: ${missing.join(', ')}` };
  }
  
  if (address.postalCode && !/^[A-Z0-9\s-]{3,10}$/i.test(address.postalCode)) {
    return { valid: false, message: 'Invalid postal code format' };
  }
  
  return { valid: true };
};

const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const cardRegex = /^[0-9]{13,19}$/;
  
  if (!cardRegex.test(cleaned)) {
    return { valid: false, message: 'Invalid card number' };
  }
  
  // Luhn algorithm
  let sum = 0;
  let alternate = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let n = parseInt(cleaned.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n = (n % 10) + 1;
    }
    sum += n;
    alternate = !alternate;
  }
  
  if (sum % 10 !== 0) {
    return { valid: false, message: 'Invalid card number' };
  }
  
  return { valid: true };
};

const validateExpiryDate = (month, year) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, message: 'Card has expired' };
  }
  
  if (month < 1 || month > 12) {
    return { valid: false, message: 'Invalid expiry month' };
  }
  
  return { valid: true };
};

module.exports = {
  validateAuctionDates,
  validateBidAmount,
  validatePassword,
  validateImageUrl,
  validatePhoneNumber,
  validateAddress,
  validateCardNumber,
  validateExpiryDate,
};