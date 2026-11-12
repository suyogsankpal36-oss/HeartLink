const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "inappropriate_photos",
        "inappropriate_content",
        "harassment",
        "fake_profile",
        "spam",
        "spam_or_scam",
        "underage",
        "other",
      ],
    },
    details: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    description: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "pending", "under_review", "reviewed", "resolved", "dismissed"],
      default: "open",
    },
    moderationHistory: {
      type: [{
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        action: {
          type: String,
          enum: ["status_updated", "warned", "messaging_restricted", "discovery_restricted", "suspended", "reactivated", "escalated"],
          required: true,
        },
        note: { type: String, trim: true, maxlength: 600, default: "" },
        restrictionUntil: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
    escalation: {
      isEscalated: { type: Boolean, default: false },
      targetRole: { type: String, enum: ["admin", "superadmin"], default: null },
      reason: { type: String, trim: true, maxlength: 600, default: "" },
      escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      escalatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
