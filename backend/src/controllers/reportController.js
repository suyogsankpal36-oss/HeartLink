const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");
const { revokeUserSessions } = require("../services/authTokens");
const { logAdminAction, logActivity, logSecurityEvent } = require("../services/auditLogger");

const ROLE_RANK = {
  member: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4,
};

const VALID_REASONS = [
  "inappropriate_photos",
  "inappropriate_content",
  "harassment",
  "fake_profile",
  "spam",
  "spam_or_scam",
  "underage",
  "other",
];

exports.createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, details, description } = req.body;

    if (!reportedUserId || !mongoose.Types.ObjectId.isValid(reportedUserId)) {
      return res.status(400).json({ message: "Valid reported user ID format is required." });
    }

    if (reportedUserId === req.userId.toString()) {
      return res.status(400).json({ message: "Valid reported user ID is required." });
    }

    let normalizedReason = reason;
    if (normalizedReason === "spam") normalizedReason = "spam_or_scam";
    if (normalizedReason === "inappropriate") normalizedReason = "inappropriate_photos";

    if (!normalizedReason || !VALID_REASONS.includes(normalizedReason)) {
      return res.status(400).json({
        message: "Please choose a valid reason for reporting this user.",
      });
    }

    const targetUser = await User.findById(reportedUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Reported user does not exist." });
    }

    const reportText = typeof details === "string" ? details : (typeof description === "string" ? description : "");

    const report = await Report.create({
      reporter: req.userId,
      reportedUser: reportedUserId,
      reason: normalizedReason,
      details: reportText.slice(0, 500).trim(),
      description: reportText.slice(0, 500).trim(),
      status: "open",
    });

    await logActivity(req.userId, "report_submitted", "security", `Submitted safety report (${normalizedReason})`, "success", {
      ip: req.ip || "",
      metadata: { reportId: report._id, reportedUserId, reason: normalizedReason },
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted. Our safety team will review this profile.",
      reportId: report._id,
    });
  } catch (error) {
    console.error("Create report error:", error.message);
    return res.status(500).json({ message: "Could not submit safety report." });
  }
};

exports.getAdminReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const status = req.query.status;
    const reason = req.query.reason;
    const validStatuses = ["open", "pending", "under_review", "reviewed", "resolved", "dismissed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid moderation status filter." });
    }
    const validReasons = ["inappropriate_photos", "inappropriate_content", "harassment", "fake_profile", "spam", "spam_or_scam", "underage", "other"];
    if (reason && !validReasons.includes(reason)) {
      return res.status(400).json({ message: "Invalid report reason filter." });
    }

    const query = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("reporter", "name email age gender")
        .populate("reportedUser", "name email age gender isActive isVerified role"),
      Report.countDocuments(query),
    ]);

    return res.json({
      success: true,
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin reports error:", error.message);
    return res.status(500).json({ message: "Could not retrieve moderation reports." });
  }
};

exports.updateAdminReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionOnUser } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid report ID format." });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    if (status) {
      const validStatuses = ["open", "pending", "under_review", "reviewed", "resolved", "dismissed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid moderation status value." });
      }
      report.status = status;
    }

    if (actionOnUser && !["suspend", "reactivate"].includes(actionOnUser)) {
      return res.status(400).json({ message: "Invalid account moderation action." });
    }

    // Moderators can act on member accounts. Admins can moderate members/moderators; Super Admins can moderate any lower role.
    if (actionOnUser) {
      if (String(report.reportedUser) === String(req.userId)) {
        return res.status(400).json({ message: "You cannot moderate your own account." });
      }
      const [actingUser, reportedUser] = await Promise.all([
        User.findById(req.userId).select("role"),
        User.findById(report.reportedUser).select("role isActive"),
      ]);
      if (!reportedUser) return res.status(404).json({ message: "Reported user no longer exists." });
      if (reportedUser.role !== "member" && !["admin", "superadmin"].includes(actingUser?.role)) {
        return res.status(403).json({ message: "Only an admin can moderate a staff account." });
      }
      if ((ROLE_RANK[reportedUser.role] || 1) >= (ROLE_RANK[actingUser?.role] || 1)) {
        return res.status(403).json({ message: "Insufficient privileges to moderate an equal or higher role." });
      }
      reportedUser.isActive = actionOnUser === "reactivate";
      await reportedUser.save();
      if (actionOnUser === "suspend") {
        await revokeUserSessions(reportedUser._id);
        req.app.get("io")?.in(`user_${reportedUser._id}`).disconnectSockets(true);
      }
      await logAdminAction(
        req.userId,
        actionOnUser === "suspend" ? "user_suspended" : "user_activated",
        reportedUser._id,
        { viaReportId: report._id, status },
        req.ip || "",
      );
      await logSecurityEvent(
        "account_lockout",
        actionOnUser === "suspend" ? "high" : "low",
        reportedUser._id,
        req.ip || "",
        { action: actionOnUser, moderatedBy: req.userId, reportId: report._id },
        req.get("user-agent") || "",
      );
    } else if (status) {
      await logAdminAction(req.userId, "report_updated", report.reportedUser, { reportId: report._id, status }, req.ip || "");
    }

    await report.save();

    return res.json({
      success: true,
      message: "Moderation report updated successfully.",
      report,
    });
  } catch (error) {
    console.error("Update admin report error:", error.message);
    return res.status(500).json({ message: "Could not update moderation report." });
  }
};
