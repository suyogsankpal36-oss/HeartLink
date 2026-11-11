const mongoose = require('mongoose');
const AdminAuditLog = require('../models/AdminAuditLog');
const ActivityLog = require('../models/ActivityLog');
const SecurityEvent = require('../models/SecurityEvent');

function canWriteToDatabase() {
  return mongoose.connection.readyState === 1;
}

async function logAdminAction(adminId, action, targetId = null, metadata = {}, ip = '') {
  if (!canWriteToDatabase()) return null;
  try {
    return await AdminAuditLog.create({ adminId, action, targetId, metadata, ip, result: 'success' });
  } catch (err) {
    console.error('[AuditLogger] Failed to write admin audit log:', err.message);
    return null;
  }
}

async function logActivity(userId, action, category = 'system', description = '', status = 'success', extra = {}) {
  if (!canWriteToDatabase()) return null;
  try {
    return await ActivityLog.create({ userId, action, category, description, status, ...extra });
  } catch (err) {
    console.error('[AuditLogger] Failed to write activity log:', err.message);
    return null;
  }
}

async function logSecurityEvent(type, severity = 'low', userId = null, ip = '', details = {}, userAgent = '') {
  if (!canWriteToDatabase()) return null;
  try {
    return await SecurityEvent.create({ type, severity, userId, ip, details, userAgent });
  } catch (err) {
    console.error('[AuditLogger] Failed to write security event:', err.message);
    return null;
  }
}

module.exports = { logAdminAction, logActivity, logSecurityEvent };
