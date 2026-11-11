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
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
