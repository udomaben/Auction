// src/utils/helpers.js
const slugify = require('slugify');

const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
    locale: 'en',
  }) + '-' + Date.now().toString(36);
};

const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } else if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } else if (format === 'datetime') {
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toISOString();
};

const calculateTimeLeft = (endTime) => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;
  
  if (diff <= 0) {
    return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (86400000)) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return { ended: false, days, hours, minutes, seconds, total: diff };
};

const formatTimeLeft = (endTime) => {
  const timeLeft = calculateTimeLeft(endTime);
  
  if (timeLeft.ended) return 'Auction ended';
  if (timeLeft.days > 0) return `${timeLeft.days}d ${timeLeft.hours}h left`;
  if (timeLeft.hours > 0) return `${timeLeft.hours}h ${timeLeft.minutes}m left`;
  if (timeLeft.minutes > 0) return `${timeLeft.minutes}m ${timeLeft.seconds}s left`;
  return `${timeLeft.seconds}s left`;
};

const generateRandomId = () => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
  return re.test(phone);
};

const maskEmail = (email) => {
  const [local, domain] = email.split('@');
  const maskedLocal = local.substring(0, 2) + '***' + local.substring(local.length - 1);
  return `${maskedLocal}@${domain}`;
};

const maskPhone = (phone) => {
  if (phone.length <= 4) return '***';
  return phone.substring(0, 2) + '***' + phone.substring(phone.length - 2);
};

const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

module.exports = {
  generateSlug,
  formatCurrency,
  formatDate,
  calculateTimeLeft,
  formatTimeLeft,
  generateRandomId,
  validateEmail,
  validatePhone,
  maskEmail,
  maskPhone,
  deepClone,
  sleep,
  retry,
};