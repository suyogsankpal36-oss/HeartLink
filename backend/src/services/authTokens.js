const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const RefreshSession = require("../models/RefreshSession");

const REFRESH_COOKIE = "heartlink_refresh";
const REFRESH_TTL = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
const ACCESS_TTL = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
let localAccessSecret;
let localRefreshSecret;

function getSecret(names, localSecret) {
  const nameList = Array.isArray(names) ? names : [names];
  for (const name of nameList) {
    const val = process.env[name];
    if (val) return val;
  }
  const primaryName = nameList[0];
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${primaryName} must be configured in production.`);
  }
  if (!localSecret.value) localSecret.value = crypto.randomBytes(48).toString("hex");
  return localSecret.value;
}

function secrets() {
  return {
    access: getSecret(["ACCESS_TOKEN_SECRET", "JWT_SECRET"], { get value() { return localAccessSecret; }, set value(value) { localAccessSecret = value; } }),
    refresh: getSecret(["REFRESH_TOKEN_SECRET", "JWT_REFRESH_SECRET", "JWT_SECRET"], { get value() { return localRefreshSecret; }, set value(value) { localRefreshSecret = value; } }),
  };
}

function secondsFromDuration(value) {
  const match = String(value).match(/^(\d+)(s|m|h|d)$/i);
  if (!match) throw new Error("Token expiration must use seconds, minutes, hours, or days (for example 15m or 7d).");
  const amount = Number(match[1]);
  return amount * ({ s: 1, m: 60, h: 3600, d: 86400 })[match[2].toLowerCase()];
}

function cookieOptions() {
  const production = process.env.NODE_ENV === "production";
  let sameSite = (process.env.COOKIE_SAME_SITE || (production ? "none" : "lax")).toLowerCase();
  if (!["strict", "lax", "none"].includes(sameSite)) sameSite = "lax";
  if (sameSite === "none" && !production && process.env.COOKIE_SECURE !== "true") {
    sameSite = "lax";
  }
  return {
    httpOnly: true,
    secure: production || process.env.COOKIE_SECURE === "true",
    sameSite,
    path: "/api",
    maxAge: secondsFromDuration(REFRESH_TTL) * 1000,
  };
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, cookieOptions());
}

function clearRefreshCookie(res) {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(REFRESH_COOKIE, options);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return null;
}

function createAccessToken(userId, sessionId) {
  return jwt.sign({ userId: userId.toString(), sessionId: sessionId.toString(), tokenType: "access" }, secrets().access, { expiresIn: ACCESS_TTL });
}

function createRefreshToken(userId, sessionId) {
  return jwt.sign({ userId: userId.toString(), sessionId: sessionId.toString(), tokenType: "refresh" }, secrets().refresh, { expiresIn: REFRESH_TTL });
}

function verifyAccessToken(token) {
  const decoded = jwt.verify(token, secrets().access);
  if (decoded.tokenType !== "access" || !decoded.userId || !decoded.sessionId) throw new Error("Invalid access token.");
  return decoded;
}

function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, secrets().refresh);
  if (decoded.tokenType !== "refresh" || !decoded.userId || !decoded.sessionId) throw new Error("Invalid refresh token.");
  return decoded;
}

async function issueSession(res, user) {
  const sessionId = new mongoose.Types.ObjectId();
  const refreshToken = createRefreshToken(user._id, sessionId);
  const expiresAt = new Date(Date.now() + secondsFromDuration(REFRESH_TTL) * 1000);
  await RefreshSession.create({ _id: sessionId, user: user._id, tokenHash: hashToken(refreshToken), expiresAt });
  setRefreshCookie(res, refreshToken);
  return { accessToken: createAccessToken(user._id, sessionId), refreshToken };
}

async function rotateSession(req, res) {
  const token = readCookie(req, REFRESH_COOKIE) || req.body?.refreshToken || req.headers?.["x-refresh-token"];
  if (!token) return null;

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(decoded.sessionId) || !mongoose.Types.ObjectId.isValid(decoded.userId)) return null;
  const nextRefreshToken = createRefreshToken(decoded.userId, decoded.sessionId);
  const nextExpiry = new Date(Date.now() + secondsFromDuration(REFRESH_TTL) * 1000);
  const updated = await RefreshSession.findOneAndUpdate(
    { _id: decoded.sessionId, user: decoded.userId, tokenHash: hashToken(token), revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { tokenHash: hashToken(nextRefreshToken), expiresAt: nextExpiry, lastUsedAt: new Date() } },
    { new: true },
  ).select("user");

  if (!updated) return null;
  const user = await require("../models/User").findById(updated.user);
  if (!user || user.isActive === false) {
    await RefreshSession.updateOne({ _id: decoded.sessionId }, { $set: { revokedAt: new Date() } });
    return null;
  }

  setRefreshCookie(res, nextRefreshToken);
  return { accessToken: createAccessToken(user._id, decoded.sessionId), refreshToken: nextRefreshToken, user };
}

async function revokeSession(req, res) {
  const token = readCookie(req, REFRESH_COOKIE) || req.body?.refreshToken || req.headers?.["x-refresh-token"];
  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      await RefreshSession.updateOne(
        { _id: decoded.sessionId, user: decoded.userId, tokenHash: hashToken(token), revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    } catch {
      // Clear invalid or expired cookies without revealing token details.
    }
  }
  clearRefreshCookie(res);
}

async function revokeUserSessions(userId) {
  await RefreshSession.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

module.exports = {
  REFRESH_COOKIE,
  createAccessToken,
  hashToken,
  issueSession,
  readCookie,
  revokeSession,
  revokeUserSessions,
  rotateSession,
  verifyAccessToken,
};
