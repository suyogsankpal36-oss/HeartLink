const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["like", "pass", "superlike"],
      default: "like",
    },
    comment: {
      type: String,
      maxlength: 280,
      default: "",
    },
  },
  { timestamps: true }
);

likeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
likeSchema.index({ fromUser: 1, type: 1, updatedAt: -1 });
likeSchema.index({ toUser: 1, type: 1, updatedAt: -1 });

module.exports = mongoose.model("Like", likeSchema);
