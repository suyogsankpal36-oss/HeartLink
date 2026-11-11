const Subscription = require("../models/Subscription");

function getPlans() {
  const currency = (process.env.SUBSCRIPTION_CURRENCY || "INR").toUpperCase();
  const plans = [
    { id: "monthly", label: "1 Month", durationMonths: 1, amountMinor: Number(process.env.PLAN_MONTHLY_AMOUNT_MINOR || 49900), note: "Flexible start" },
    { id: "quarterly", label: "3 Months", durationMonths: 3, amountMinor: Number(process.env.PLAN_QUARTERLY_AMOUNT_MINOR || 119700), note: "Three month plan" },
    { id: "annual", label: "12 Months", durationMonths: 12, amountMinor: Number(process.env.PLAN_ANNUAL_AMOUNT_MINOR || 358800), note: "Best value" },
  ];
  return { currency, plans, paymentEnabled: false };
}

exports.getPlans = (req, res) => res.json(getPlans());

exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.userId }).sort({ createdAt: -1 }).select("plan status startedAt renewsAt createdAt provider");
    return res.json({ subscription: subscription || null, paymentEnabled: false });
  } catch {
    return res.status(500).json({ message: "Could not load your membership status." });
  }
};
