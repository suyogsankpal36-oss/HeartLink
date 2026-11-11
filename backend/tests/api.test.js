const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { app } = require("../src/app");

test("health liveness endpoint responds without a database connection", async () => {
  const response = await request(app).get("/api/live");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "alive");
});

test("protected profile APIs reject requests without an access token", async () => {
  const response = await request(app).get("/api/v1/profiles");
  assert.equal(response.status, 401);
  assert.match(response.body.message, /authentication required/i);
});

test("registration rejects an underage date of birth before accessing MongoDB", async () => {
  const underageDate = new Date();
  underageDate.setUTCFullYear(underageDate.getUTCFullYear() - 17);
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Alex Example",
      email: "alex@example.com",
      password: "HeartLinkPass123",
      dateOfBirth: underageDate.toISOString().slice(0, 10),
      gender: "other",
      termsAccepted: true,
    });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /18 years old/i);
});

test("verification resend validates email before looking up an account", async () => {
  const response = await request(app)
    .post("/api/v1/auth/resend-verification")
    .send({ email: "not-an-email" });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /valid email/i);
});

test("subscription catalog is server-owned and checkout remains disabled", async () => {
  const response = await request(app).get("/api/v1/subscriptions/plans");
  assert.equal(response.status, 200);
  assert.equal(response.body.paymentEnabled, false);
  assert.deepEqual(response.body.plans.map((plan) => plan.id), ["monthly", "quarterly", "annual"]);
  assert.ok(response.body.plans.every((plan) => Number.isSafeInteger(plan.amountMinor) && plan.amountMinor > 0));
});

test("anonymous support requests validate their email before persistence", async () => {
  const response = await request(app)
    .post("/api/v1/support")
    .send({ email: "not-an-email", category: "other", subject: "Help", message: "Please help me with this account." });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /valid email/i);
});

test("route parity: /api/likes and /api/profile photo endpoints enforce authentication", async () => {
  const [receivedLikes, sentLikes, photoDelete] = await Promise.all([
    request(app).get("/api/likes/received"),
    request(app).get("/api/likes/sent"),
    request(app).delete("/api/profile/me/photos/test-photo-id"),
  ]);

  assert.equal(receivedLikes.status, 401);
  assert.equal(sentLikes.status, 401);
  assert.equal(photoDelete.status, 401);
});

test("auth refresh endpoint exists on /api/v1/auth/refresh and responds with 401 when unauthenticated", async () => {
  const response = await request(app).post("/api/v1/auth/refresh");
  assert.equal(response.status, 401);
  assert.match(response.body.message, /session expired|sign in again/i);
});
