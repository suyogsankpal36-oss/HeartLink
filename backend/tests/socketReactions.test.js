const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeReactionEmoji, toggleUserReaction } = require("../src/sockets/socketService");

test("socket reactions accept one bounded emoji value", () => {
  assert.equal(normalizeReactionEmoji(" ❤️ "), "❤️");
  assert.equal(normalizeReactionEmoji(""), null);
  assert.equal(normalizeReactionEmoji(["❤️"]), null);
  assert.equal(normalizeReactionEmoji("12345678901"), null);
});

test("reaction changes and removal affect only the authenticated user's reaction", () => {
  const reactions = [{ user: "member-a", emoji: "❤️" }];

  assert.deepEqual(toggleUserReaction(reactions, "member-b", "👏"), [
    { user: "member-a", emoji: "❤️" },
    { user: "member-b", emoji: "👏" },
  ]);
  assert.deepEqual(toggleUserReaction(reactions, "member-a", "✨"), [
    { user: "member-a", emoji: "✨" },
    { user: "member-b", emoji: "👏" },
  ]);
  assert.deepEqual(toggleUserReaction(reactions, "member-a", "✨"), [
    { user: "member-b", emoji: "👏" },
  ]);
});
