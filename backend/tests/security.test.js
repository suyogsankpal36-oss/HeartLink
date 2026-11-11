const test = require("node:test");
const assert = require("node:assert/strict");
const { parseDateOfBirth, calculateAge } = require("../src/utils/adultPolicy");
const { validateEnvironment } = require("../src/config/env");

test("adult policy accepts valid ISO dates and rejects impossible dates", () => {
  assert.equal(parseDateOfBirth("2000-02-29").toISOString(), "2000-02-29T00:00:00.000Z");
  assert.equal(parseDateOfBirth("2001-02-29"), null);
  assert.equal(parseDateOfBirth("02/29/2000"), null);
});

test("adult age is calculated before and on a birthday", () => {
  const dob = parseDateOfBirth("2008-10-26");
  assert.equal(calculateAge(dob, new Date("2026-10-25T12:00:00.000Z")), 17);
  assert.equal(calculateAge(dob, new Date("2026-10-26T00:00:00.000Z")), 18);
});

test("production environment requires distinct strong secrets and Atlas configuration", () => {
  const base = {
    NODE_ENV: "production",
    ACCESS_TOKEN_SECRET: "a".repeat(40),
    REFRESH_TOKEN_SECRET: "b".repeat(40),
    MONGODB_URI: "mongodb+srv://example.invalid/db",
    CLIENT_URL: "https://heartlink.example",
    PLAN_MONTHLY_AMOUNT_MINOR: "49900",
    PLAN_QUARTERLY_AMOUNT_MINOR: "119700",
    PLAN_ANNUAL_AMOUNT_MINOR: "358800",
  };
  assert.doesNotThrow(() => validateEnvironment(base));
  assert.throws(() => validateEnvironment({ ...base, REFRESH_TOKEN_SECRET: base.ACCESS_TOKEN_SECRET }), /must be different/);
  assert.throws(() => validateEnvironment({ ...base, CLOUDINARY_API_SECRET: "secret" }), /Cloudinary/);
});
