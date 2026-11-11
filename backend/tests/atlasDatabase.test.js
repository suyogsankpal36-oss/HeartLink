const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const connectDB = require("../config/database");

// Canonical Models
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
const errorHandler = require("../src/middleware/errorHandler");

test("database module rejects localhost and loopback URIs to prevent silent local database fallback", async () => {
  const originalUri = process.env.MONGODB_URI;
  try {
    process.env.MONGODB_URI = "mongodb://localhost:27017/heartlink_test";
    await assert.rejects(
      () => connectDB(),
      /local MongoDB connections are disabled/i,
    );

    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/heartlink_test";
    await assert.rejects(
      () => connectDB(),
      /local MongoDB connections are disabled/i,
    );

    process.env.MONGODB_URI = "mongodb://[::1]:27017/heartlink_test";
    await assert.rejects(
      () => connectDB(),
      /local MongoDB connections are disabled/i,
    );
  } finally {
    process.env.MONGODB_URI = originalUri;
  }
});

test("database module requires MONGODB_URI", async () => {
  const originalUri = process.env.MONGODB_URI;
  try {
    process.env.MONGODB_URI = "";
    await assert.rejects(
      () => connectDB(),
      /MONGODB_URI is required/i,
    );
  } finally {
    process.env.MONGODB_URI = originalUri;
  }
});

test("all 13 canonical Mongoose models are properly registered with collection schemas", () => {
  const models = [
    { model: User, collection: "users" },
    { model: Like, collection: "likes" },
    { model: Match, collection: "matches" },
    { model: Message, collection: "messages" },
    { model: Block, collection: "blocks" },
    { model: Notification, collection: "notifications" },
    { model: Report, collection: "reports" },
    { model: Subscription, collection: "subscriptions" },
    { model: SupportTicket, collection: "supporttickets" },
    { model: RefreshSession, collection: "refreshsessions" },
    { model: ActivityLog, collection: "activitylogs" },
    { model: AdminAuditLog, collection: "adminauditlogs" },
    { model: SecurityEvent, collection: "securityevents" },
  ];

  for (const { model, collection } of models) {
    assert.ok(model.schema instanceof mongoose.Schema, `${model.modelName} schema is missing`);
    assert.equal(model.collection.name, collection, `${model.modelName} mapped to unexpected collection`);
  }
});

test("User schema enforces adult age and 2dsphere geolocation index", () => {
  const indexes = User.schema.indexes();
  const hasGeoIndex = indexes.some(([fields]) => fields.location === "2dsphere");
  assert.ok(hasGeoIndex, "User model must have a 2dsphere index for location queries");

  const ageField = User.schema.path("age");
  assert.equal(ageField.options.min, 18);
});

test("errorHandler translates Mongo network/timeout errors to 503 Service Unavailable", () => {
  const req = {};
  let statusCode = null;
  let responseBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const timeoutErr = new Error("connection timed out");
  timeoutErr.name = "MongoTimeoutError";
  errorHandler(timeoutErr, req, res, () => {});

  assert.equal(statusCode, 503);
  assert.match(responseBody.message, /Atlas/i);
});
