const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    participantA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    participantB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "unmatched"],
      default: "active",
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    unmatchedAt: { type: Date, default: null },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

matchSchema.index({ users: 1 });
matchSchema.index({ users: 1, updatedAt: -1 });
matchSchema.index({ participantA: 1, participantB: 1 }, { unique: true, sparse: true });

matchSchema.pre("validate", function canonicalizeParticipants() {
  if (!Array.isArray(this.users) || this.users.length !== 2) return;
  const [participantA, participantB] = this.users.map((id) => id.toString()).sort();
  this.participantA = participantA;
  this.participantB = participantB;
});

module.exports = mongoose.model("Match", matchSchema);
