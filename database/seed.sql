-- ============================================
-- SEED DATA FOR AUCTION PLATFORM
-- ============================================

-- Password: Admin123! (bcrypt hash)
INSERT INTO users (id, name, email, password_hash, role, verified, identity_verified, reputation_score, created_at)
VALUES (
    uuid_generate_v4(),
    'System Administrator',
    'admin@auction.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyK9I4s0Y8Z8Dy', -- Admin123!
    'admin',
    true,
    true,
    100,
    NOW()
);

-- Sample Auctioneer
INSERT INTO users (id, name, email, password_hash, role, verified, identity_verified, reputation_score, created_at)
VALUES (
    uuid_generate_v4(),
    'Premium Auctioneer',
    'auctioneer@example.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyK9I4s0Y8Z8Dy', -- Auction123!
    'auctioneer',
    true,
    true,
    95,
    NOW()
);

-- Sample Buyer
INSERT INTO users (id, name, email, password_hash, role, verified, identity_verified, reputation_score, created_at)
VALUES (
    uuid_generate_v4(),
    'Collector Buyer',
    'buyer@example.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyK9I4s0Y8Z8Dy', -- Buyer123!
    'buyer',
    true,
    false,
    100,
    NOW()
);