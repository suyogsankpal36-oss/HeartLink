const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");
const Notification = require("../models/Notification");
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
        .populate("reportedUser", "name email age gender isActive isVerified role")
        .populate("moderationHistory.actor", "name role"),
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
    const { status, actionOnUser, actionNote, restrictionDays, escalationTarget } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid report ID format." });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }
    // Compatibility for reports created before the moderation-history schema was introduced.
    if (!Array.isArray(report.moderationHistory)) report.moderationHistory = [];
    if (!report.escalation) report.escalation = { isEscalated: false };

    const validStatuses = ["open", "pending", "under_review", "reviewed", "resolved", "dismissed"];
    const validActions = ["warn", "restrict_messaging", "restrict_discovery", "suspend", "reactivate", "escalate"];
    const note = typeof actionNote === "string" ? actionNote.trim().slice(0, 600) : "";

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid moderation status value." });
    }
    if (actionOnUser && !validActions.includes(actionOnUser)) {
      return res.status(400).json({ message: "Invalid account moderation action." });
    }
    if (!status && !actionOnUser) {
      return res.status(400).json({ message: "Choose a status or an authorized moderation action." });
    }

    // Escalation changes the case only. It never grants staff access to messages or allows a
    // moderator to alter a higher-ranked account.
    if (actionOnUser === "escalate") {
      const targetRole = escalationTarget === "superadmin" ? "superadmin" : "admin";
      report.status = "under_review";
      report.escalation = {
        isEscalated: true,
        targetRole,
        reason: note || "Escalated for further review.",
        escalatedBy: req.userId,
        escalatedAt: new Date(),
      };
      report.moderationHistory.push({
        actor: req.userId,
        action: "escalated",
        note: report.escalation.reason,
      });
      await report.save();
      await logAdminAction(req.userId, "report_escalated", report.reportedUser, {
        reportId: report._id,
        targetRole,
      }, req.ip || "");
      return res.json({ success: true, message: `Report escalated to ${targetRole}.`, report });
    }

    let actingUser = null;
    let reportedUser = null;
    let restrictionUntil = null;

    // Moderators can act on members, admins on lower staff roles, and Super Admins on all lower roles.
    if (actionOnUser) {
      if (String(report.reportedUser) === String(req.userId)) {
        return res.status(400).json({ message: "You cannot moderate your own account." });
      }
      [actingUser, reportedUser] = await Promise.all([
        User.findById(req.userId).select("role"),
        User.findById(report.reportedUser).select("role isActive moderation"),
      ]);
      if (!actingUser || !reportedUser) {
        return res.status(404).json({ message: "Reported user no longer exists." });
      }
      if ((ROLE_RANK[reportedUser.role] || 1) >= (ROLE_RANK[actingUser.role] || 1)) {
        return res.status(403).json({ message: "Insufficient privileges to moderate an equal or higher role." });
      }
      if (!reportedUser.moderation) reportedUser.moderation = {};
      if (!reportedUser.moderation.restrictions) reportedUser.moderation.restrictions = {};
      if (!Array.isArray(reportedUser.moderation.warnings)) reportedUser.moderation.warnings = [];

      if (["restrict_messaging", "restrict_discovery"].includes(actionOnUser)) {
        const days = Number(restrictionDays);
        if (!Number.isInteger(days) || days < 1 || days > 30) {
          return res.status(400).json({ message: "Restriction duration must be a whole number from 1 to 30 days." });
        }
        restrictionUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        if (actionOnUser === "restrict_messaging") {
          reportedUser.moderation.restrictions.messagingUntil = restrictionUntil;
        } else {
          reportedUser.moderation.restrictions.discoveryUntil = restrictionUntil;
        }
      }

      if (actionOnUser === "warn") {
        reportedUser.moderation.warnings.push({
          report: report._id,
          issuedBy: req.userId,
          reason: report.reason,
          note,
        });
      }
      if (actionOnUser === "suspend") {
        reportedUser.isActive = false;
      }
      if (actionOnUser === "reactivate") {
        reportedUser.isActive = true;
      }
      await reportedUser.save();

      if (actionOnUser === "suspend") {
        await revokeUserSessions(reportedUser._id);
        req.app.get("io")?.in(`user_${reportedUser._id}`).disconnectSockets(true);
      }

      const actionNames = {
        warn: "warning_issued",
        restrict_messaging: "messaging_restricted",
        restrict_discovery: "discovery_restricted",
        suspend: "user_suspended",
        reactivate: "user_activated",
      };
      const historyActions = {
        warn: "warned",
        restrict_messaging: "messaging_restricted",
        restrict_discovery: "discovery_restricted",
        suspend: "suspended",
        reactivate: "reactivated",
      };
      report.moderationHistory.push({
        actor: req.userId,
        action: historyActions[actionOnUser],
        note,
        restrictionUntil,
      });

      const notificationCopy = {
        warn: { title: "Account warning", message: "A safety warning was added to your account. Please review our community guidelines." },
        restrict_messaging: { title: "Messaging temporarily restricted", message: "Your messaging access has been temporarily restricted. Please review our community guidelines." },
        restrict_discovery: { title: "Discovery temporarily restricted", message: "Your discovery actions have been temporarily restricted. Please review our community guidelines." },
        suspend: { title: "Account suspended", message: "Your account has been suspended following a safety review." },
        reactivate: { title: "Account restored", message: "Your account access has been restored." },
      }[actionOnUser];
      if (notificationCopy && mongoose.connection.readyState === 1) {
        await Notification.create({
          recipient: reportedUser._id,
          type: "safety_alert",
          title: notificationCopy.title,
          message: notificationCopy.message,
          referenceId: report._id,
        }).catch((error) => console.warn("Safety notification error:", error.message));
        req.app.get("io")?.to(`user_${reportedUser._id}`).emit("new_notification", {
          type: "safety_alert",
          title: notificationCopy.title,
          message: notificationCopy.message,
        });
      }

      await logAdminAction(req.userId, actionNames[actionOnUser], reportedUser._id, {
        viaReportId: report._id,
        status: status || report.status,
        restrictionUntil,
      }, req.ip || "");
      await logSecurityEvent(
        "account_lockout",
        actionOnUser === "suspend" ? "high" : actionOnUser === "warn" ? "low" : "medium",
        reportedUser._id,
        req.ip || "",
        { action: actionOnUser, moderatedBy: req.userId, reportId: report._id, restrictionUntil },
        req.get("user-agent") || "",
      );
    }

    if (status) {
      report.status = status;
      report.moderationHistory.push({ actor: req.userId, action: "status_updated", note: note || `Status changed to ${status}.` });
    }
    if (!actionOnUser && status) {
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
