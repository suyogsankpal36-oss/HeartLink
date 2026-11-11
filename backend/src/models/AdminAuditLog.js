const mongoose = require('mongoose');
const adminAuditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, trim: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetType: { type: String, default: 'user' },
  result: { type: String, enum: ['success','failure'], default: 'success' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: '' },
}, { timestamps: true });
adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
