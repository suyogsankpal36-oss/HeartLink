const test = require("node:test");
const assert = require("node:assert/strict");

const User = require("../src/models/User");
const Report = require("../src/models/Report");
const { activeRestrictionUntil, restrictionMessage } = require("../src/utils/moderation");

test("moderation schema records warnings and independently scoped temporary restrictions", () => {
  assert.ok(User.schema.path("moderation.warnings"));
  assert.ok(User.schema.path("moderation.restrictions.messagingUntil"));
  assert.ok(User.schema.path("moderation.restrictions.discoveryUntil"));
  assert.ok(Report.schema.path("moderationHistory"));
  assert.ok(Report.schema.path("escalation.isEscalated"));
  assert.ok(Report.schema.path("escalation.targetRole").enumValues.includes("superadmin"));
});

test("activeRestrictionUntil only returns future restrictions for the requested scope", () => {
  const now = new Date("2026-11-11T08:00:00.000Z");
  const future = new Date("2026-11-12T08:00:00.000Z");
  const past = new Date("2026-11-10T08:00:00.000Z");
  const user = {
    moderation: {
      restrictions: {
        messagingUntil: future,
        discoveryUntil: past,
      },
    },
  };

  assert.equal(activeRestrictionUntil(user, "messaging", now).toISOString(), future.toISOString());
  assert.equal(activeRestrictionUntil(user, "discovery", now), null);
  assert.match(restrictionMessage("messaging", future), /Messaging is temporarily restricted/i);
});

test("moderation report schema only permits audited workflow actions", () => {
  const actionPath = Report.schema.path("moderationHistory").schema.path("action");
  assert.ok(actionPath.enumValues.includes("warned"));
  assert.ok(actionPath.enumValues.includes("messaging_restricted"));
  assert.ok(actionPath.enumValues.includes("discovery_restricted"));
  assert.ok(actionPath.enumValues.includes("escalated"));
});
