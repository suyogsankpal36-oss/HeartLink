const User = require("../models/User");
const { broadcastPresence } = require("../services/presenceService");

const genders = new Set(["all", "female", "male", "non-binary", "other"]);
const notificationKeys = new Set(["newMatches", "messages", "likes", "sounds"]);
const privacyKeys = new Set(["showOnlineStatus", "readReceipts", "shareApproximateLocation"]);

function validateBooleanSettings(value, allowedKeys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (entries.some(([key, setting]) => !allowedKeys.has(key) || typeof setting !== "boolean")) return null;
  return Object.fromEntries(entries);
}

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("discoveryPreferences notificationSettings privacySettings location");
    if (!user) return res.status(404).json({ message: "Account not found." });
    return res.json({
      discoveryPreferences: user.discoveryPreferences,
      notificationSettings: user.notificationSettings,
      privacySettings: user.privacySettings,
      hasApproximateLocation: user.location?.coordinates?.length === 2,
    });
  } catch {
    return res.status(500).json({ message: "Could not load your settings." });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const body = req.body || {};
    const visibilityChanged = body.privacySettings?.showOnlineStatus !== undefined;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Account not found." });

    if (body.discoveryPreferences !== undefined) {
      const value = body.discoveryPreferences;
      if (!value || typeof value !== "object" || Array.isArray(value)) return res.status(400).json({ message: "Discovery preferences must be an object." });
      const allowedKeys = new Set(["genderPreference", "minAge", "maxAge", "distance", "hideProfile"]);
      if (Object.keys(value).some((key) => !allowedKeys.has(key))) return res.status(400).json({ message: "Discovery preferences contain an unsupported field." });
      const { genderPreference, minAge, maxAge, distance, hideProfile } = value;
      if (genderPreference !== undefined && !genders.has(genderPreference)) return res.status(400).json({ message: "Invalid gender preference." });
      if (minAge !== undefined && (!Number.isInteger(Number(minAge)) || Number(minAge) < 18 || Number(minAge) > 120)) return res.status(400).json({ message: "Minimum age must be between 18 and 120." });
      if (maxAge !== undefined && (!Number.isInteger(Number(maxAge)) || Number(maxAge) < 18 || Number(maxAge) > 120)) return res.status(400).json({ message: "Maximum age must be between 18 and 120." });
      if (distance !== undefined && (!Number.isInteger(Number(distance)) || Number(distance) < 1 || Number(distance) > 500)) return res.status(400).json({ message: "Distance must be between 1 and 500 kilometers." });
      if (hideProfile !== undefined && typeof hideProfile !== "boolean") return res.status(400).json({ message: "Profile visibility must be a boolean." });
      const current = user.discoveryPreferences?.toObject?.() || user.discoveryPreferences || {};
      const merged = { ...current, ...value };
      if (Number(merged.minAge) > Number(merged.maxAge)) return res.status(400).json({ message: "Minimum age must not exceed maximum age." });
      user.discoveryPreferences = {
        genderPreference: merged.genderPreference,
        minAge: Number(merged.minAge),
        maxAge: Number(merged.maxAge),
        distance: Number(merged.distance),
        hideProfile: Boolean(merged.hideProfile),
      };
    }

    if (body.notificationSettings !== undefined) {
      if (!body.notificationSettings || Object.keys(body.notificationSettings).length === 0) return res.status(400).json({ message: "Provide at least one notification setting." });
      const settings = validateBooleanSettings(body.notificationSettings, notificationKeys);
      if (!settings) return res.status(400).json({ message: "Notification settings are invalid." });
      user.notificationSettings = { ...(user.notificationSettings?.toObject?.() || user.notificationSettings || {}), ...settings };
    }

    if (body.privacySettings !== undefined) {
      if (!body.privacySettings || Object.keys(body.privacySettings).length === 0) return res.status(400).json({ message: "Provide at least one privacy setting." });
      const settings = validateBooleanSettings(body.privacySettings, privacyKeys);
      if (!settings) return res.status(400).json({ message: "Privacy settings are invalid." });
      user.privacySettings = { ...(user.privacySettings?.toObject?.() || user.privacySettings || {}), ...settings };
      if (settings.shareApproximateLocation === false) user.location = undefined;
    }

    await user.save();
    if (visibilityChanged) {
      broadcastPresence(req.app.get("io"), user._id).catch((error) => console.warn("Presence preference update error:", error.message));
    }
    return res.json({
      discoveryPreferences: user.discoveryPreferences,
      notificationSettings: user.notificationSettings,
      privacySettings: user.privacySettings,
      hasApproximateLocation: user.location?.coordinates?.length === 2,
    });
  } catch {
    return res.status(500).json({ message: "Could not save your settings." });
  }
};
