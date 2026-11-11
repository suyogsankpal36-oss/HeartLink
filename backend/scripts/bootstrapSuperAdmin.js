const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

async function main() {
  const { SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, MONGODB_URI } = process.env;
  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD || !MONGODB_URI) {
    console.error('[ERROR] Missing SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, or MONGODB_URI in backend/.env');
    console.log('Please define in backend/.env:');
    console.log('  SUPERADMIN_EMAIL=admin@heartlink.app');
    console.log('  SUPERADMIN_PASSWORD=YourSecurePassword123!');
    process.exit(1);
  }

  try {
    console.log('[Bootstrap] Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Bootstrap] Connected successfully.');

    const email = SUPERADMIN_EMAIL.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === 'superadmin') {
        console.log(`[Bootstrap] Super Admin account already exists for ${email}. Exiting.`);
        process.exit(0);
      } else {
        console.log(`[Bootstrap] Elevating existing user ${email} to superadmin...`);
        existing.role = 'superadmin';
        existing.isActive = true;
        existing.isVerified = true;
        existing.isEmailVerified = true;
        await existing.save();
        console.log(`[Bootstrap] Successfully updated role of ${email} to superadmin.`);
        process.exit(0);
      }
    }

    const hashed = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);
    const superAdmin = new User({
      name: 'Super Administrator',
      email,
      password: hashed,
      age: 32,
      gender: 'other',
      interestedIn: ['all'],
      role: 'superadmin',
      isActive: true,
      isVerified: true,
      isEmailVerified: true,
      bio: 'System Super Administrator',
      city: 'Global',
    });

    await superAdmin.save();
    console.log(`[Bootstrap] Super Admin created successfully: ${email}`);
    console.log('[Bootstrap] NOTE: For security, you may now remove SUPERADMIN_PASSWORD from .env.');
  } catch (err) {
    console.error('[Bootstrap ERROR]:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Bootstrap] Database disconnected.');
  }
}

main();
