// backend/src/scripts/createAdmin.js
const bcrypt = require('bcryptjs');
const readline = require('readline');
const { pool } = require('../config/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

const createAdmin = async () => {
  console.log('\n🔐 Create New Admin User\n');
  
  const name = await question('Admin name: ');
  const email = await question('Admin email: ');
  const password = await question('Admin password (min 6 chars): ');
  
  if (!name || !email || !password) {
    console.error('❌ All fields are required');
    rl.close();
    process.exit(1);
  }
  
  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters');
    rl.close();
    process.exit(1);
  }
  
  try {
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (existing.rows.length > 0) {
      console.error('❌ User with this email already exists');
      rl.close();
      process.exit(1);
    }
    
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, verified, identity_verified, reputation_score, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, 'admin', true, true, 100, NOW())`,
      [name, email, passwordHash]
    );
    
    console.log(`\n✅ Admin user "${email}" created successfully!`);
  } catch (error) {
    console.error('❌ Failed to create admin:', error.message);
  }
  
  rl.close();
  process.exit(0);
};

createAdmin();