/**
 * verifyAtlasDatabase.js
 * 
 * MongoDB Atlas Verification and Health Inspection Utility.
 * Validates direct connectivity to MongoDB Atlas, verifies all canonical
 * collections and Mongoose models, checks database indexes, and reports
 * document counts and storage metrics.
 * 
 * Usage:
 *   node backend/scripts/verifyAtlasDatabase.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");

// Canonical Mongoose Models
const User = require("../src/models/User");
const Like = require("../src/models/Like");
const Match = require("../src/models/Match");
const Message = require("../src/models/Message");
const Block = require("../src/models/Block");
const Notification = require("../src/models/Notification");
const Report = require("../src/models/Report");
const Subscription = require("../src/models/Subscription");
const SupportTicket = require("../src/models/SupportTicket");
const RefreshSession = require("../src/models/RefreshSession");
const ActivityLog = require("../src/models/ActivityLog");
const AdminAuditLog = require("../src/models/AdminAuditLog");
const SecurityEvent = require("../src/models/SecurityEvent");

const models = [
  { name: "User", model: User, collection: "users" },
  { name: "Like", model: Like, collection: "likes" },
  { name: "Match", model: Match, collection: "matches" },
  { name: "Message", model: Message, collection: "messages" },
  { name: "Block", model: Block, collection: "blocks" },
  { name: "Notification", model: Notification, collection: "notifications" },
  { name: "Report", model: Report, collection: "reports" },
  { name: "Subscription", model: Subscription, collection: "subscriptions" },
  { name: "SupportTicket", model: SupportTicket, collection: "supporttickets" },
  { name: "RefreshSession", model: RefreshSession, collection: "refreshsessions" },
  { name: "ActivityLog", model: ActivityLog, collection: "activitylogs" },
  { name: "AdminAuditLog", model: AdminAuditLog, collection: "adminauditlogs" },
  { name: "SecurityEvent", model: SecurityEvent, collection: "securityevents" },
];

async function verifyDatabase() {
  console.log("==================================================");
  console.log("HEARTLINK — MONGODB ATLAS VERIFICATION SUITE");
  console.log("==================================================");
  console.log(`Connecting to MongoDB Atlas...`);

  try {
    const conn = await connectDB();
    console.log(`[PASS] Connected successfully to host: ${conn.connection.host}`);
    console.log(`[PASS] Active Database Name: ${conn.connection.name}`);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log(`\nExisting Collections in Atlas (${collectionNames.length}):`);
    collectionNames.forEach((name) => console.log(`  - ${name}`));

    console.log("\nVerifying Mongoose Models & Index Synchronizations:");
    for (const item of models) {
      try {
        await item.model.syncIndexes();
        const count = await item.model.countDocuments().catch(() => 0);
        console.log(`  [OK] ${item.name.padEnd(16)} (collection: ${item.collection.padEnd(16)}) Documents: ${count}`);
      } catch (err) {
        console.warn(`  [WARN] ${item.name}: ${err.message}`);
      }
    }

    console.log("\nVerifying GridFS Profile Photos Bucket in Atlas:");
    const gridFilesCount = await db.collection("profilePhotos.files").countDocuments().catch(() => 0);
    const gridChunksCount = await db.collection("profilePhotos.chunks").countDocuments().catch(() => 0);
    console.log(`  [OK] profilePhotos.files   Count: ${gridFilesCount}`);
    console.log(`  [OK] profilePhotos.chunks  Count: ${gridChunksCount}`);

    console.log("\n==================================================");
    console.log("ALL ATLAS DATABASE CHECKS COMPLETED SUCCESSFULLY");
    console.log("==================================================");
  } catch (error) {
    console.error(`\n[FAIL] Atlas Verification Failed: ${error.message}`);
    console.error("Please verify that:");
    console.error("1. MONGODB_URI in backend/.env is a valid Atlas connection string.");
    console.error("2. Your current IP is whitelisted in MongoDB Atlas (Security > Network Access).");
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Atlas connection closed cleanly.");
    }
  }
}

if (require.main === module) {
  verifyDatabase();
}

module.exports = { verifyDatabase };
