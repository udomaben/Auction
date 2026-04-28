// src/utils/constants.js

const USER_ROLES = {
  ADMIN: 'admin',
  AUCTIONEER: 'auctioneer',
  BUYER: 'buyer',
};

const AUCTION_STATUS = {
  SCHEDULED: 'scheduled',
  PREVIEW: 'preview',
  LIVE: 'live',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
};

const LOT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SELLING: 'selling',
  SOLD: 'sold',
  UNSOLD: 'unsold',
  WITHDRAWN: 'withdrawn',
};

const BID_STATUS = {
  WINNING: 'winning',
  OUTBID: 'outbid',
  LOST: 'lost',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const NOTIFICATION_TYPES = {
  OUTBID: 'outbid',
  WON_AUCTION: 'won_auction',
  AUCTION_START: 'auction_start',
  AUCTION_ENDING: 'auction_ending',
  PAYMENT_REMINDER: 'payment_reminder',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  SHIPPING_UPDATED: 'shipping_updated',
};

const ITEM_CONDITIONS = {
  NEW: 'new',
  LIKE_NEW: 'like_new',
  VERY_GOOD: 'very_good',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
};

const CATEGORIES = [
  { id: 'art', name: 'Art', icon: '/icons/art.svg' },
  { id: 'interiors', name: 'Interiors', icon: '/icons/interiors.svg' },
  { id: 'jewellery', name: 'Jewellery', icon: '/icons/jewellery.svg' },
  { id: 'watches', name: 'Watches', icon: '/icons/watches.svg' },
  { id: 'fashion', name: 'Fashion', icon: '/icons/fashion.svg' },
  { id: 'coins', name: 'Coins & Stamps', icon: '/icons/coins.svg' },
  { id: 'comics', name: 'Comics', icon: '/icons/comics.svg' },
  { id: 'cars', name: 'Cars & Bikes', icon: '/icons/cars.svg' },
  { id: 'wine', name: 'Wine & Spirits', icon: '/icons/wine.svg' },
  { id: 'asian', name: 'Asian & Tribal', icon: '/icons/asian.svg' },
  { id: 'toys', name: 'Toys & Models', icon: '/icons/toys.svg' },
  { id: 'archaeology', name: 'Archaeology', icon: '/icons/archaeology.svg' },
  { id: 'sports', name: 'Sports', icon: '/icons/sports.svg' },
  { id: 'music', name: 'Music & Movies', icon: '/icons/music.svg' },
  { id: 'books', name: 'Books & History', icon: '/icons/books.svg' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'ending', label: 'Ending soon' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: Low to high' },
  { value: 'price_desc', label: 'Price: High to low' },
];

const HIGH_VALUE_THRESHOLD = 5000; // USD/EUR

const BID_EXTENSION_TIME = 120000; // 2 minutes in milliseconds
const PAYMENT_GRACE_DAYS = 3;
const AUTO_OUTBID_NOTIFICATION_DELAY = 1000; // 1 second

const CACHE_TTL = {
  AUCTIONS: 60, // 1 minute
  AUCTION_DETAIL: 30, // 30 seconds
  CATEGORIES: 3600, // 1 hour
  USER_PROFILE: 300, // 5 minutes
};

const RATE_LIMITS = {
  GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },
  AUTH: { windowMs: 15 * 60 * 1000, max: 20 },
  BID: { windowMs: 60 * 1000, max: 10 },
  CREATE_AUCTION: { windowMs: 60 * 60 * 1000, max: 10 },
};

module.exports = {
  USER_ROLES,
  AUCTION_STATUS,
  LOT_STATUS,
  BID_STATUS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  ITEM_CONDITIONS,
  CATEGORIES,
  SORT_OPTIONS,
  HIGH_VALUE_THRESHOLD,
  BID_EXTENSION_TIME,
  PAYMENT_GRACE_DAYS,
  AUTO_OUTBID_NOTIFICATION_DELAY,
  CACHE_TTL,
  RATE_LIMITS,
};