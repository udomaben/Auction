-- ============================================
-- AUCTION PLATFORM - COMPLETE POSTGRESQL SCHEMA
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'auctioneer', 'buyer')),
    phone_number VARCHAR(50),
    avatar_url TEXT,
    bio TEXT,
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    identity_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB,
    
    -- Reputation system
    reputation_score INTEGER DEFAULT 100 CHECK (reputation_score BETWEEN 0 AND 100),
    total_paid DECIMAL(12,2) DEFAULT 0,
    total_unpaid DECIMAL(12,2) DEFAULT 0,
    unpaid_bids_count INTEGER DEFAULT 0,
    
    -- Address
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_country VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_state VARCHAR(100),
    
    -- Account status
    blocked BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    account_locked_until TIMESTAMP,
    
    -- Rating
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    
    -- Settings
    notification_settings JSONB DEFAULT '{
        "outbid": true,
        "auction_start": true,
        "auction_end": true,
        "won_auction": true,
        "payment_reminder": true
    }',
    
    -- Metadata
    last_login TIMESTAMP,
    last_active TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_reputation ON users(reputation_score);
CREATE INDEX idx_users_blocked ON users(blocked);

-- ============================================
-- AUCTIONS TABLE
-- ============================================
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auctioneer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    
    -- Timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    extended_until TIMESTAMP,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'preview', 'live', 'ended', 'cancelled')),
    
    -- Categories
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[],
    
    -- Media
    cover_image TEXT,
    gallery_images TEXT[],
    video_url TEXT,
    
    -- Streaming
    is_live_streaming BOOLEAN DEFAULT FALSE,
    agora_channel_name VARCHAR(255),
    stream_key TEXT,
    
    -- Statistics
    total_lots INTEGER DEFAULT 0,
    total_bids INTEGER DEFAULT 0,
    total_view_count INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    
    -- Financial
    commission_rate DECIMAL(5,2) DEFAULT 9.00,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Visibility
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auctions_auctioneer ON auctions(auctioneer_id);
CREATE INDEX idx_auctions_status_time ON auctions(status, start_time, end_time);
CREATE INDEX idx_auctions_slug ON auctions(slug);
CREATE INDEX idx_auctions_category ON auctions(category);
CREATE INDEX idx_auctions_featured ON auctions(is_featured) WHERE is_featured = true;

-- ============================================
-- LOTS TABLE
-- ============================================
CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    
    -- Basic info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE,
    
    -- Position in auction
    lot_number INTEGER NOT NULL,
    position INTEGER,
    
    -- Pricing
    starting_bid DECIMAL(12,2) NOT NULL,
    current_bid DECIMAL(12,2) DEFAULT 0,
    current_winner_id UUID REFERENCES users(id),
    bid_increment DECIMAL(12,2) DEFAULT 10.00,
    reserve_price DECIMAL(12,2),
    reserve_met BOOLEAN DEFAULT FALSE,
    buy_now_price DECIMAL(12,2),
    
    -- Media
    main_image TEXT NOT NULL,
    additional_images TEXT[],
    video_url TEXT,
    
    -- Condition & details
    condition VARCHAR(50) DEFAULT 'good' 
        CHECK (condition IN ('new', 'like_new', 'very_good', 'good', 'fair', 'poor')),
    year INTEGER,
    brand VARCHAR(100),
    material VARCHAR(100),
    dimensions JSONB,
    weight DECIMAL(10,2),
    
    -- Expert estimate
    expert_estimate_min DECIMAL(12,2),
    expert_estimate_max DECIMAL(12,2),
    expert_notes TEXT,
    
    -- Shipping
    shipping_from_country VARCHAR(100),
    shipping_cost DECIMAL(12,2),
    free_pickup BOOLEAN DEFAULT FALSE,
    combined_shipping_allowed BOOLEAN DEFAULT TRUE,
    shipping_notes TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'active', 'selling', 'sold', 'unsold', 'withdrawn')),
    
    -- Statistics
    total_bids INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    watchers_count INTEGER DEFAULT 0,
    
    -- Sale info
    final_sale_amount DECIMAL(12,2),
    second_highest_bidder_id UUID REFERENCES users(id),
    second_highest_amount DECIMAL(12,2),
    winner_paid BOOLEAN DEFAULT FALSE,
    payment_completed_at TIMESTAMP,
    
    -- Auto-bids (JSON - admin only visibility)
    auto_bids JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lots_auction ON lots(auction_id, lot_number);
CREATE INDEX idx_lots_status ON lots(status);
CREATE INDEX idx_lots_current_winner ON lots(current_winner_id);
CREATE INDEX idx_lots_slug ON lots(slug);

-- ============================================
-- BIDS TABLE
-- ============================================
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    amount DECIMAL(12,2) NOT NULL,
    is_auto_bid BOOLEAN DEFAULT FALSE,
    max_bid_amount DECIMAL(12,2),
    
    -- System info
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    
    -- Status
    is_winning BOOLEAN DEFAULT FALSE,
    was_outbid BOOLEAN DEFAULT FALSE,
    outbid_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bids_lot ON bids(lot_id, amount DESC);
CREATE INDEX idx_bids_user ON bids(user_id);
CREATE INDEX idx_bids_created ON bids(created_at DESC);
CREATE INDEX idx_bids_winning ON bids(lot_id, is_winning) WHERE is_winning = true;

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID NOT NULL REFERENCES lots(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    
    amount DECIMAL(12,2) NOT NULL,
    platform_commission DECIMAL(12,2) NOT NULL,
    seller_payout DECIMAL(12,2) NOT NULL,
    
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    
    transaction_id VARCHAR(255),
    mercadopago_payment_id VARCHAR(255),
    
    payment_data JSONB,
    
    paid_at TIMESTAMP,
    released_to_seller_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_buyer ON payments(buyer_id);
CREATE INDEX idx_payments_seller ON payments(seller_id);
CREATE INDEX idx_payments_lot ON payments(lot_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- ============================================
-- WATCHLIST TABLE
-- ============================================
CREATE TABLE watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, lot_id)
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id);
CREATE INDEX idx_watchlist_lot ON watchlist(lot_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    data JSONB,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    email_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auctioneer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
    
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    
    -- Category ratings
    communication_rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    shipping_rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    item_accuracy_rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    seller_response TEXT,
    seller_response_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(buyer_id, lot_id)
);

CREATE INDEX idx_reviews_auctioneer ON reviews(auctioneer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================
-- AUTO-BID LOGS (admin audit)
-- ============================================
CREATE TABLE auto_bid_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID NOT NULL REFERENCES lots(id),
    user_id UUID NOT NULL REFERENCES users(id),
    max_amount DECIMAL(12,2) NOT NULL,
    was_triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auto_bid_logs_lot ON auto_bid_logs(lot_id);
CREATE INDEX idx_auto_bid_logs_user ON auto_bid_logs(user_id);

-- ============================================
-- AUCTION VIEWS (analytics)
-- ============================================
CREATE TABLE auction_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id),
    user_id UUID REFERENCES users(id),
    session_id UUID,
    ip_address INET,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auction_views_auction ON auction_views(auction_id);
CREATE INDEX idx_auction_views_date ON auction_views(viewed_at);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON auctions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON lots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update lot on new bid
CREATE OR REPLACE FUNCTION update_lot_on_new_bid()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lots 
    SET current_bid = NEW.amount,
        current_winner_id = NEW.user_id,
        total_bids = total_bids + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.lot_id AND current_bid < NEW.amount;
    
    UPDATE bids 
    SET is_winning = FALSE, 
        was_outbid = TRUE,
        outbid_at = CURRENT_TIMESTAMP
    WHERE lot_id = NEW.lot_id AND is_winning = TRUE AND user_id != NEW.user_id;
    
    UPDATE bids 
    SET is_winning = TRUE
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_bid_insert
AFTER INSERT ON bids
FOR EACH ROW
EXECUTE FUNCTION update_lot_on_new_bid();

-- Function to check reserve price
CREATE OR REPLACE FUNCTION check_reserve_price()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reserve_price IS NOT NULL AND NEW.current_bid >= NEW.reserve_price THEN
        NEW.reserve_met = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_lot_update
BEFORE UPDATE ON lots
FOR EACH ROW
EXECUTE FUNCTION check_reserve_price();