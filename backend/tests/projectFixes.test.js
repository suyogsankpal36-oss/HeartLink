const test = require("node:test");
const assert = require("node:assert/strict");
const { INTERESTS, INTEREST_SET } = require("../src/utils/interests");
const { isEmailVerificationComplete } = require("../src/utils/emailVerification");
const { isValidCoordinates } = require("../src/utils/location");
const { distanceLabel } = require("../src/controllers/discoverController");
const { filterAvailableMatches } = require("../src/controllers/matchController");

test("shared interest catalog contains the choices used by profile and discovery APIs", () => {
  assert.ok(INTERESTS.length > 0);
  assert.equal(INTEREST_SET.size, INTERESTS.length);
  for (const interest of ["Food", "Books", "Coffee", "Hiking", "Yoga", "Dogs", "Design", "Reading", "Gaming", "Technology"]) {
    assert.ok(INTEREST_SET.has(interest), `${interest} should be accepted`);
  }
});

test("verification visibility allows accounts only when required verification is complete", () => {
  assert.equal(isEmailVerificationComplete({ emailVerificationRequired: false, isEmailVerified: false }), true);
  assert.equal(isEmailVerificationComplete({ emailVerificationRequired: true, isEmailVerified: false }), false);
  assert.equal(isEmailVerificationComplete({ emailVerificationRequired: true, isEmailVerified: true }), true);
});

test("location coordinates are validated as longitude and latitude", () => {
  assert.equal(isValidCoordinates([-180, 90]), true);
  assert.equal(isValidCoordinates([181, 0]), false);
  assert.equal(isValidCoordinates([0, -91]), false);
  assert.equal(isValidCoordinates([0, Number.NaN]), false);
  assert.equal(isValidCoordinates([0]), false);
});

test("distance labels are bucketed and never expose coordinates", () => {
  assert.equal(distanceLabel([0, 0], [0.01, 0]), "Within 5 km");
  assert.equal(distanceLabel([0, 0], [1, 0]), "Within 115 km");
  assert.equal(distanceLabel([0, 0], undefined), "");
});

test("match result filtering tolerates stale null rows", () => {
  assert.deepEqual(
    filterAvailableMatches([null, { matchedUser: null }, { matchedUser: { id: "member-1" } }]),
    [{ matchedUser: { id: "member-1" } }],
  );
});
