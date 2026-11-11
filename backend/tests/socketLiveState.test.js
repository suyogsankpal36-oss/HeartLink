const test = require("node:test");
const assert = require("node:assert/strict");

test("socket event bus delivers notifications, matches, and likes to recipient rooms", () => {
  const emitted = [];
  const fakeIo = {
    to(room) {
      return {
        emit(event, data) {
          emitted.push({ room, event, data });
        },
      };
    },
  };

  // 1. Like notification
  const targetUserId = "user-recipient-1";
  const likeType = "superlike";
  fakeIo.to(`user_${targetUserId}`).emit("like_received", { type: likeType, senderId: "user-sender-1" });
  fakeIo.to(`user_${targetUserId}`).emit("new_notification", {
    type: likeType,
    title: "Someone sent you a spark",
    message: "Alex liked your profile.",
  });

  // 2. Mutual match event
  const userA = "user-1";
  const userB = "user-2";
  const matchId = "match-123";
  fakeIo.to(`user_${userA}`).emit("new_match_event", { matchId, matchedUser: { id: userB, name: "Sam" } });
  fakeIo.to(`user_${userB}`).emit("new_match_event", { matchId, matchedUser: { id: userA, name: "Alex" } });
  fakeIo.to(`user_${userA}`).emit("new_notification", { type: "match", title: "New Match! 🎉", matchId });

  // 3. Unmatch event
  fakeIo.to(`user_${userA}`).emit("match_removed", { matchId });
  fakeIo.to(`user_${userB}`).emit("match_removed", { matchId });

  assert.equal(emitted.length, 7);
  assert.equal(emitted[0].event, "like_received");
  assert.equal(emitted[0].room, "user_user-recipient-1");
  assert.equal(emitted[1].event, "new_notification");
  assert.equal(emitted[1].data.type, "superlike");

  assert.equal(emitted[2].event, "new_match_event");
  assert.equal(emitted[2].room, "user_user-1");
  assert.equal(emitted[3].event, "new_match_event");
  assert.equal(emitted[3].room, "user_user-2");

  assert.equal(emitted[5].event, "match_removed");
  assert.equal(emitted[6].event, "match_removed");
});
