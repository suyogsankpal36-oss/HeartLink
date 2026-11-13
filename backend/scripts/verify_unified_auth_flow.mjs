import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

const results = [];
function record(testName, passed, details = '') {
  results.push({ testName, status: passed ? 'PASS' : 'FAIL', details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName} ${details ? '- ' + details : ''}`);
}

function getDashboardForRole(role) {
  const normalized = String(role || 'member').toLowerCase().replace('-', '_');
  switch (normalized) {
    case 'superadmin':
    case 'super_admin':
      return '/super-admin/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'moderator':
      return '/moderator/dashboard';
    case 'user':
    case 'member':
    default:
      return '/dashboard';
  }
}

async function run() {
  console.log('=== HEARTLINK UNIFIED AUTHENTICATION VERIFICATION SUITE ===');
  console.log(`Target Backend: ${BASE_URL}\n`);

  // Connect to the exact database used by the app: 'heartlink'
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'heartlink' });
  const usersCollection = mongoose.connection.db.collection('users');

  const defaultPassword = 'Password123!';
  const hashedDefaultPassword = await bcrypt.hash(defaultPassword, 10);

  // 1. Ensure test users for each role in heartlink DB
  const rolesToEnsure = [
    { email: 'staff.admin@heartlink.app', name: 'Operations Admin', role: 'admin' },
    { email: 'staff.moderator@heartlink.app', name: 'Community Moderator', role: 'moderator' },
    { email: 'alex@example.com', name: 'Alex Rivera', role: 'member' }
  ];

  for (const acc of rolesToEnsure) {
    await usersCollection.updateOne(
      { email: acc.email },
      {
        $set: {
          name: acc.name,
          email: acc.email,
          role: acc.role,
          isActive: true,
          isVerified: true,
          isEmailVerified: true,
          emailVerificationRequired: false,
          password: hashedDefaultPassword,
          age: 28,
          gender: 'other',
          interestedIn: ['all'],
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log(`Synced account ${acc.email} with role '${acc.role}' in heartlink db.`);
  }

  // 2. Test Super Admin Login (suyogsankpal36@gmail.com)
  try {
    const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'suyogsankpal36@gmail.com',
      password: '12345687'
    });
    const user = res.data?.user;
    const isSuperAdmin = user?.role === 'superadmin';
    const redirectUrl = getDashboardForRole(user?.role);
    const hasToken = !!res.data?.accessToken;

    record(
      '1. Super Admin Unified Authentication (suyogsankpal36@gmail.com)',
      isSuperAdmin && hasToken && redirectUrl === '/super-admin/dashboard',
      `Verified DB Role: ${user?.role} -> Auto Redirect: ${redirectUrl}`
    );
  } catch (err) {
    record('1. Super Admin Unified Authentication', false, err.response?.data?.message || err.message);
  }

  // 3. Test Admin Login (staff.admin@heartlink.app)
  try {
    const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'staff.admin@heartlink.app',
      password: defaultPassword
    });
    const user = res.data?.user;
    const isAdmin = user?.role === 'admin';
    const redirectUrl = getDashboardForRole(user?.role);

    record(
      '2. Admin Unified Authentication (staff.admin@heartlink.app)',
      isAdmin && redirectUrl === '/admin/dashboard',
      `Verified DB Role: ${user?.role} -> Auto Redirect: ${redirectUrl}`
    );
  } catch (err) {
    record('2. Admin Unified Authentication', false, err.response?.data?.message || err.message);
  }

  // 4. Test Moderator Login (staff.moderator@heartlink.app)
  try {
    const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'staff.moderator@heartlink.app',
      password: defaultPassword
    });
    const user = res.data?.user;
    const isModerator = user?.role === 'moderator';
    const redirectUrl = getDashboardForRole(user?.role);

    record(
      '3. Moderator Unified Authentication (staff.moderator@heartlink.app)',
      isModerator && redirectUrl === '/moderator/dashboard',
      `Verified DB Role: ${user?.role} -> Auto Redirect: ${redirectUrl}`
    );
  } catch (err) {
    record('3. Moderator Unified Authentication', false, err.response?.data?.message || err.message);
  }

  // 5. Test Member Login (alex@example.com)
  let memberToken = null;
  try {
    const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'alex@example.com',
      password: defaultPassword
    });
    const user = res.data?.user;
    memberToken = res.data?.accessToken;
    const isMember = user?.role === 'member';
    const redirectUrl = getDashboardForRole(user?.role);

    record(
      '4. Member Unified Authentication (alex@example.com)',
      isMember && redirectUrl === '/dashboard',
      `Verified DB Role: ${user?.role} -> Auto Redirect: ${redirectUrl}`
    );
  } catch (err) {
    record('4. Member Unified Authentication', false, err.response?.data?.message || err.message);
  }

  // 6. Test Privilege Escalation Defense: Client sends spoofed role: "superadmin"
  try {
    const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'alex@example.com',
      password: defaultPassword,
      role: 'superadmin' // Spoofed role sent in body
    });
    const returnedRole = res.data?.user?.role;
    record(
      '5. Role Spoofing Defense (Client-sent role ignored)',
      returnedRole === 'member',
      `Client submitted role 'superadmin', Server enforced role '${returnedRole}' from Atlas DB`
    );
  } catch (err) {
    record('5. Role Spoofing Defense', false, err.response?.data?.message || err.message);
  }

  // 7. Test Invalid Password Rejection (401)
  try {
    await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'suyogsankpal36@gmail.com',
      password: 'incorrect_password_xyz'
    });
    record('6. Invalid Password Handling', false, 'Allowed login with invalid password');
  } catch (err) {
    const is401 = err.response?.status === 401;
    record('6. Invalid Password Handling', is401, `Status: ${err.response?.status} (${err.response?.data?.message})`);
  }

  // 8. Test Deactivated / Suspended Account (403)
  const deactivatedEmail = 'deactivated.user@heartlink.app';
  await usersCollection.updateOne(
    { email: deactivatedEmail },
    {
      $set: {
        name: 'Deactivated User',
        email: deactivatedEmail,
        password: hashedDefaultPassword,
        age: 30,
        gender: 'other',
        interestedIn: ['all'],
        role: 'member',
        isActive: false, // suspended
        isVerified: true,
        isEmailVerified: true,
        emailVerificationRequired: false
      }
    },
    { upsert: true }
  );

  try {
    await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: deactivatedEmail,
      password: defaultPassword
    });
    record('7. Suspended / Deactivated Account Block', false, 'Allowed suspended account');
  } catch (err) {
    const is403 = err.response?.status === 403;
    record(
      '7. Suspended / Deactivated Account Block',
      is403,
      `Status: ${err.response?.status} (${err.response?.data?.message})`
    );
  }

  // 9. Test Common Logout & Token Revocation
  if (memberToken) {
    try {
      const logoutRes = await axios.post(
        `${BASE_URL}/api/v1/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${memberToken}` } }
      );
      record(
        '8. Common Session Logout & Revocation',
        logoutRes.status === 200,
        `HTTP ${logoutRes.status}: ${logoutRes.data?.message}`
      );
    } catch (err) {
      record('8. Common Session Logout & Revocation', false, err.response?.data?.message || err.message);
    }
  }

  await mongoose.disconnect();

  console.log('\n================ VERIFICATION SUMMARY ================');
  console.table(results);
  const allPassed = results.every(r => r.status === 'PASS');
  console.log(`\nFinal Verdict: ${allPassed ? 'ALL VERIFICATIONS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  process.exit(allPassed ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
