const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 100, default: "" },
    category: { type: String, enum: ["account", "profile", "matching", "billing", "safety", "other"], default: "other" },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open", index: true },
  },
  { timestamps: true },
);

supportTicketSchema.index({ createdAt: -1 });
module.exports = mongoose.model("SupportTicket", supportTicketSchema);
