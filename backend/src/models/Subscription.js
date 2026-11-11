const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["stripe", "razorpay"], required: true },
    plan: { type: String, enum: ["monthly", "quarterly", "annual"], required: true },
    status: { type: String, enum: ["pending", "active", "cancelled", "expired", "past_due"], default: "pending", index: true },
    startedAt: { type: Date, default: null },
    renewsAt: { type: Date, default: null },
    providerSubscriptionId: { type: String, trim: true, default: null, select: false },
    providerCustomerId: { type: String, trim: true, default: null, select: false },
  },
  { timestamps: true },
);

subscriptionSchema.index({ provider: 1, providerSubscriptionId: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model("Subscription", subscriptionSchema);
