// backend/src/scripts/migrate.js
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const runMigrations = async () => {
  console.log('🔄 Running database migrations...');
  
  try {
    // Read schema.sql
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ schema.sql not found at:', schemaPath);
      process.exit(1);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    console.log('✅ Schema created successfully');
    
    // Create migrations table to track what's been run
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

runMigrations();