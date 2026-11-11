const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { app } = require("../src/app");
const { createRefreshToken, hashToken } = require("../src/services/authTokens");
const mongoose = require("mongoose");

test("SYNC 1: API welcome and health checks are accessible", async () => {
  const root = await request(app).get("/");
  assert.equal(root.status, 200);
  assert.equal(root.body.success, true);
  assert.match(root.body.message, /HeartLink API/i);

  const live = await request(app).get("/api/live");
  assert.equal(live.status, 200);
  assert.equal(live.body.status, "alive");
});

test("SYNC 2: Protected frontend endpoints return 401 when unauthenticated", async () => {
  const endpoints = [
    ["GET", "/api/v1/profiles/me"],
    ["GET", "/api/v1/profiles"],
    ["GET", "/api/v1/likes/received"],
    ["GET", "/api/v1/likes/sent"],
    ["GET", "/api/v1/matches"],
    ["GET", "/api/v1/conversations"],
    ["GET", "/api/v1/settings"],
    ["GET", "/api/v1/subscriptions/me"],
  ];

  for (const [method, url] of endpoints) {
    const res = await request(app)[method.toLowerCase()](url);
    assert.equal(res.status, 401, `Expected 401 for ${method} ${url}`);
  }
});

test("SYNC 3: Refresh endpoint POST /api/v1/auth/refresh rejects invalid/empty tokens gracefully", async () => {
  const emptyRes = await request(app).post("/api/v1/auth/refresh").send({});
  assert.equal(emptyRes.status, 401);
  assert.match(emptyRes.body.message, /session expired|sign in again/i);

  const invalidRes = await request(app)
    .post("/api/v1/auth/refresh")
    .send({ refreshToken: "invalid.jwt.token" });
  assert.equal(invalidRes.status, 401);
});

test("SYNC 4: Input validations match frontend contracts", async () => {
  // 1. Password change requires authenticated session
  const pwRes = await request(app).post("/api/v1/auth/change-password").send({
    currentPassword: "old",
    newPassword: "short",
  });
  assert.equal(pwRes.status, 401);

  // 2. Support ticket requires message length >= 10 and valid email
  const supRes = await request(app).post("/api/v1/support").send({
    email: "test@example.com",
    category: "other",
    subject: "Help",
    message: "short",
  });
  assert.equal(supRes.status, 400);
  assert.match(supRes.body.message, /between 10 and 3000 characters/i);
});

test("SYNC 5: Pricing catalog is synchronized and secure", async () => {
  const res = await request(app).get("/api/v1/subscriptions/plans");
  assert.equal(res.status, 200);
  assert.equal(res.body.paymentEnabled, false);
  assert.equal(res.body.plans.length, 3);
  assert.deepEqual(
    res.body.plans.map((p) => p.id),
    ["monthly", "quarterly", "annual"]
  );
});
