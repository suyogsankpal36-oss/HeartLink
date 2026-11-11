const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");
const mongoose = require("mongoose");

const categories = new Set(["account", "profile", "matching", "billing", "safety", "other"]);

exports.createSupportTicket = async (req, res) => {
  try {
    const { email = "", category = "other", subject = "Support request", message } = req.body || {};
    const submittedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const user = req.userId ? await User.findById(req.userId).select("email") : null;
    if (req.userId && !user) return res.status(401).json({ message: "Your account is no longer available." });
    const contactEmail = user?.email || submittedEmail;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || contactEmail.length > 100) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (typeof subject !== "string" || !subject.trim() || subject.trim().length > 120) return res.status(400).json({ message: "Subject must be between 1 and 120 characters." });
    if (typeof message !== "string" || message.trim().length < 10 || message.trim().length > 3000) return res.status(400).json({ message: "Message must be between 10 and 3000 characters." });
    if (!categories.has(category)) return res.status(400).json({ message: "Select a valid support category." });

    await SupportTicket.create({
      user: req.userId || null,
      email: contactEmail,
      category,
      subject: subject.trim(),
      message: message.trim(),
    });
    return res.status(201).json({ success: true, message: "Your support request was received." });
  } catch {
    return res.status(500).json({ message: "Could not submit your support request." });
  }
};

exports.getAdminSupportTickets = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const query = {};
    if (req.query.status) {
      if (!["open", "in_progress", "resolved"].includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid support ticket status filter." });
      }
      query.status = req.query.status;
    }
    if (req.query.category) {
      if (!categories.has(req.query.category)) {
        return res.status(400).json({ message: "Invalid support ticket category filter." });
      }
      query.category = req.query.category;
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email"),
      SupportTicket.countDocuments(query),
    ]);

    return res.json({
      success: true,
      tickets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get admin support tickets error:", error.message);
    return res.status(500).json({ message: "Could not retrieve support tickets." });
  }
};

exports.updateAdminSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid support ticket ID format." });
    }
    if (!["open", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Choose a valid support ticket status." });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Support ticket not found." });
    ticket.status = status;
    await ticket.save();
    return res.json({ success: true, message: "Support ticket updated.", ticket });
  } catch (error) {
    console.error("Update admin support ticket error:", error.message);
    return res.status(500).json({ message: "Could not update support ticket." });
  }
};
