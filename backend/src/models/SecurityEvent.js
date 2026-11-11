const mongoose = require('mongoose');
const securityEventSchema = new mongoose.Schema({
  type: { type: String, enum: ['failed_login','brute_force','suspicious_access','unauthorized_api','account_lockout','role_change','password_change','admin_login','session_revoked'], required: true },
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'low' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });
securityEventSchema.index({ createdAt: -1 });
securityEventSchema.index({ type: 1, createdAt: -1 });
securityEventSchema.index({ severity: 1, createdAt: -1 });
module.exports = mongoose.model('SecurityEvent', securityEventSchema);
