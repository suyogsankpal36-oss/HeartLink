const mongoose = require('mongoose');
const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, trim: true },
  category: { type: String, enum: ['auth','profile','discovery','messaging','admin','system','security'], default: 'system' },
  description: { type: String, trim: true, default: '' },
  resourceType: { type: String, trim: true, default: '' },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  status: { type: String, enum: ['success','failure','warning'], default: 'success' },
  requestId: { type: String, trim: true, default: '' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
module.exports = mongoose.model('ActivityLog', activityLogSchema);
