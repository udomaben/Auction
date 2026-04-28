export const USER_ROLES = {
  ADMIN: 'admin',
  AUCTIONEER: 'auctioneer',
  BUYER: 'buyer',
}

export const AUCTION_STATUS = {
  SCHEDULED: 'scheduled',
  PREVIEW: 'preview',
  LIVE: 'live',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
}

export const LOT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SELLING: 'selling',
  SOLD: 'sold',
  UNSOLD: 'unsold',
  WITHDRAWN: 'withdrawn',
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
}

export const ITEM_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

export const CATEGORIES = [
  { id: 'art', name: 'Art', icon: '🎨' },
  { id: 'interiors', name: 'Interiors', icon: '🛋️' },
  { id: 'jewellery', name: 'Jewellery', icon: '💎' },
  { id: 'watches', name: 'Watches', icon: '⌚' },
  { id: 'fashion', name: 'Fashion', icon: '👗' },
  { id: 'coins', name: 'Coins & Stamps', icon: '💰' },
  { id: 'comics', name: 'Comics', icon: '📚' },
  { id: 'cars', name: 'Cars & Bikes', icon: '🚗' },
  { id: 'wine', name: 'Wine & Spirits', icon: '🍷' },
  { id: 'toys', name: 'Toys & Models', icon: '🧸' },
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'ending', label: 'Ending soon' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: Low to high' },
  { value: 'price_desc', label: 'Price: High to low' },
]

export const BID_INCREMENT = 10
export const HIGH_VALUE_THRESHOLD = 5000
export const PAYMENT_GRACE_DAYS = 3