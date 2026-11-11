const os = require('os');
const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');
const Report = require('../models/Report');
const ActivityLog = require('../models/ActivityLog');
const AdminAuditLog = require('../models/AdminAuditLog');
const SecurityEvent = require('../models/SecurityEvent');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { revokeUserSessions } = require('../services/authTokens');
const { logAdminAction, logSecurityEvent } = require('../services/auditLogger');

// getDashboard — GET /api/v1/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      newRegistrations,
      newToday,
      totalAdmins,
      dailyActiveUsers,
      monthlyActiveUsers,
      failedLogins,
      totalMatches,
      messagesSent,
      openReports,
      recentUsers,
      recentActivities,
      recentAdminActions,
      registrationTrend,
      roleCounts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
      User.countDocuments({ role: { $in: ['admin', 'moderator', 'superadmin'] } }),
      User.countDocuments({ lastActive: { $gte: twentyFourHoursAgo }, isActive: true }),
      User.countDocuments({ lastActive: { $gte: thirtyDaysAgo }, isActive: true }),
      SecurityEvent.countDocuments({ type: 'failed_login', createdAt: { $gte: twentyFourHoursAgo } }),
      Match.countDocuments({ status: 'active' }),
      Message.countDocuments(),
      Report.countDocuments({ status: { $in: ['open', 'pending', 'under_review'] } }),
      User.find().sort({ createdAt: -1 }).limit(8).select('name email role isActive lastActive createdAt profilePhoto'),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email role'),
      AdminAuditLog.find().sort({ createdAt: -1 }).limit(10).populate('adminId', 'name email role').populate('targetId', 'name email'),
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    const roleCountsMap = roleCounts.reduce((acc, r) => { acc[r._id || 'member'] = r.count; return acc; }, {});

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newRegistrations,
        newToday,
        suspendedUsers: inactiveUsers,
        totalAdmins,
        dailyActiveUsers,
        monthlyActiveUsers,
        failedLogins,
        totalMatches,
        messagesSent,
        openReports,
      },
      recentUsers,
      recentActivities,
      recentAdminActions,
      registrationTrend,
      roleCounts: roleCountsMap,
    });
  } catch (err) {
    console.error('[Admin] getDashboard error:', err);
    res.status(500).json({ message: 'Failed to load dashboard.' });
  }
};

// getUsers — GET /api/v1/admin/users
// Query: page, limit, search, role, status (active/inactive), sortBy, sortOrder
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};
    if (search) {
      const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    if (role) {
      const roles = String(role)
        .split(',')
        .map((r) => r.trim())
        .filter((r) => ['member', 'moderator', 'admin', 'superadmin'].includes(r));
      if (roles.length === 1) filter.role = roles[0];
      else if (roles.length > 1) filter.role = { $in: roles };
    }
    if (status === 'active') filter.isActive = true;
    if (['inactive', 'suspended', 'banned'].includes(status)) filter.isActive = false;

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const allowedSort = ['createdAt','name','email','role','lastActive'];
    const sort = { [allowedSort.includes(sortBy) ? sortBy : 'createdAt']: sortDir };

    const [users, total] = await Promise.all([
      User.find(filter).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -googleId').sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit), limit });
  } catch (err) {
    console.error('[Admin] getUsers error:', err);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

// getUserById — GET /api/v1/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    console.error('[Admin] getUserById error:', err);
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
};

// updateUserStatus — PATCH /api/v1/admin/users/:id/status
// Body: { isActive: Boolean }
// Rules: cannot change superadmin unless caller is superadmin
exports.updateUserStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    if (req.userId && req.userId.toString() === req.params.id.toString()) {
      return res.status(403).json({ message: 'You cannot change your own account status.' });
    }
    const target = await User.findById(req.params.id).select('role isActive name email');
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (['superadmin', 'admin'].includes(target.role) && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only a Super Admin can change admin or superadmin status.' });
    }
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be a boolean.' });
    target.isActive = isActive;
    await target.save();
    if (!isActive) {
      await revokeUserSessions(target._id);
      req.app?.get?.('io')?.in?.(`user_${target._id}`).disconnectSockets?.(true);
    }
    await logAdminAction(req.userId, isActive ? 'user_activated' : 'user_suspended', target._id, { targetEmail: target.email }, req.ip);
    await logSecurityEvent(
      'account_lockout',
      isActive ? 'low' : 'high',
      target._id,
      req.ip || '',
      { action: isActive ? 'reactivated' : 'suspended', adminId: req.userId, targetEmail: target.email },
      typeof req.get === 'function' ? req.get('user-agent') || '' : '',
    );
    res.json({ message: `User ${isActive ? 'activated' : 'suspended'} successfully.`, user: { _id: target._id, isActive: target.isActive, role: target.role } });
  } catch (err) {
    console.error('[Admin] updateUserStatus error:', err);
    res.status(500).json({ message: 'Failed to update user status.' });
  }
};

// updateUserRole — PATCH /api/v1/admin/users/:id/role
// Body: { role: 'member'|'moderator'|'admin'|'superadmin' }
// Only superadmin can assign superadmin. Admin cannot promote to admin/superadmin.
exports.updateUserRole = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    const target = await User.findById(req.params.id).select('role name email');
    if (!target) return res.status(404).json({ message: 'User not found.' });

    const { role } = req.body;
    const validRoles = ['member', 'moderator', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role.' });

    const callerRole = req.user.role;
    if (role === 'superadmin' && callerRole !== 'superadmin') {
      return res.status(403).json({ message: 'Only a Super Admin can assign the superadmin role.' });
    }
    if (target.role === 'superadmin' && callerRole !== 'superadmin') {
      return res.status(403).json({ message: 'Only a Super Admin can demote another Super Admin.' });
    }
    if (['admin','superadmin'].includes(role) && callerRole === 'admin') {
      return res.status(403).json({ message: 'Admins cannot assign admin or superadmin roles.' });
    }
    // prevent self-promotion
    if (req.userId.toString() === target._id.toString()) {
      return res.status(403).json({ message: 'You cannot change your own role.' });
    }

    const prevRole = target.role;
    target.role = role;
    await target.save();
    if (prevRole !== role && role === 'member') {
      await revokeUserSessions(target._id);
    }
    await logAdminAction(req.userId, 'role_changed', target._id, { from: prevRole, to: role, targetEmail: target.email }, req.ip);
    await logSecurityEvent(
      'role_change',
      role === 'superadmin' || prevRole === 'superadmin' ? 'high' : 'medium',
      target._id,
      req.ip || '',
      { from: prevRole, to: role, adminId: req.userId, targetEmail: target.email },
      typeof req.get === 'function' ? req.get('user-agent') || '' : '',
    );
    res.json({ message: 'Role updated.', user: { _id: target._id, role: target.role } });
  } catch (err) {
    console.error('[Admin] updateUserRole error:', err);
    res.status(500).json({ message: 'Failed to update role.' });
  }
};

// getUserActivities — GET /api/v1/admin/users/:id/activities
exports.getUserActivities = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      ActivityLog.find({ userId: req.params.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ActivityLog.countDocuments({ userId: req.params.id }),
    ]);
    res.json({ activities, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Admin] getUserActivities error:', err);
    res.status(500).json({ message: 'Failed to fetch user activities.' });
  }
};

// getActivities — GET /api/v1/admin/activities
// Query: page, limit, search (action/description), category, status, userId, startDate, endDate
exports.getActivities = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 30));
    const skip = (page - 1) * limit;
    const { search, category, status, userId, startDate, endDate } = req.query;

    const filter = {};
    if (search) { const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); filter.$or = [{ action: re }, { description: re }]; }
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.userId = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [activities, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email role'),
      ActivityLog.countDocuments(filter),
    ]);
    res.json({ activities, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Admin] getActivities error:', err);
    res.status(500).json({ message: 'Failed to fetch activities.' });
  }
};

// getAnalytics — GET /api/v1/admin/analytics
// Query: period (7d|30d|90d|1y)
exports.getAnalytics = async (req, res) => {
  try {
    const periodDays = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[req.query.period] || 30;
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const [
      registrationTrend,
      activeUsersTrend,
      roleDist,
      statusDist,
      newUsers,
      newMatches,
      messages,
      totalUsersCount,
      activeRecentlyCount,
      topLocations,
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),
      User.aggregate([
        { $match: { lastActive: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastActive' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $project: { name: '$_id', value: '$count', _id: 0 } },
      ]),
      User.aggregate([
        { $group: { _id: '$isActive', count: { $sum: 1 } } },
        { $project: { name: { $cond: ['$_id', 'Active', 'Inactive'] }, value: '$count', _id: 0 } },
      ]),
      User.countDocuments({ createdAt: { $gte: since } }),
      Match.countDocuments({ createdAt: { $gte: since } }),
      Message.countDocuments({ createdAt: { $gte: since } }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, lastActive: { $gte: since } }),
      User.aggregate([
        { $match: { city: { $nin: [null, ''] } } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
        { $project: { city: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    const retention = totalUsersCount > 0 ? Math.round((activeRecentlyCount / totalUsersCount) * 100) : 0;

    res.json({
      registrationTrend,
      dailySignups: registrationTrend,
      activeUsersTrend,
      roleDist,
      statusDist,
      newUsers,
      newMatches,
      messages,
      retention,
      topLocations,
      period: req.query.period || '30d',
    });
  } catch (err) {
    console.error('[Admin] getAnalytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics.' });
  }
};

// getSecurityEvents — GET /api/v1/admin/security
// Query: page, limit, type, severity, userId, startDate, endDate
exports.getSecurityEvents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { type, severity, userId, startDate, endDate } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.userId = userId;
    if (startDate || endDate) { filter.createdAt = {}; if (startDate) filter.createdAt.$gte = new Date(startDate); if (endDate) filter.createdAt.$lte = new Date(endDate); }

    const [events, total] = await Promise.all([
      SecurityEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email'),
      SecurityEvent.countDocuments(filter),
    ]);
    res.json({ events, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Admin] getSecurityEvents error:', err);
    res.status(500).json({ message: 'Failed to fetch security events.' });
  }
};

// getAuditLogs — GET /api/v1/admin/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { adminId, action, startDate, endDate } = req.query;
    const filter = {};
    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) filter.adminId = adminId;
    if (action) filter.action = String(action).trim();
    if (startDate || endDate) { filter.createdAt = {}; if (startDate) filter.createdAt.$gte = new Date(startDate); if (endDate) filter.createdAt.$lte = new Date(endDate); }

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('adminId', 'name email role').populate('targetId', 'name email'),
      AdminAuditLog.countDocuments(filter),
    ]);
    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Admin] getAuditLogs error:', err);
    res.status(500).json({ message: 'Failed to fetch audit logs.' });
  }
};

// getDatabaseHealth — GET /api/v1/admin/database/health
exports.getDatabaseHealth = async (req, res) => {
  try {
    const readyState = mongoose.connection.readyState;
    const connected = readyState === 1;
    if (!connected) {
      return res.status(503).json({ connected: false, status: 'disconnected', error: 'Database not connected.' });
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const statsList = await Promise.all(
      collections.map(async (col) => {
        try {
          const [count, collStats] = await Promise.all([
            db.collection(col.name).estimatedDocumentCount(),
            db.command({ collStats: col.name }).catch(() => null),
          ]);
          return {
            name: col.name,
            count,
            size: collStats?.size || 0,
            avgObjSize: collStats?.avgObjSize || 0,
            nindexes: collStats?.nindexes ?? null,
          };
        } catch {
          return { name: col.name, count: null, size: null, nindexes: null };
        }
      })
    );
    statsList.sort((a, b) => a.name.localeCompare(b.name));
    res.json({
      connected: true,
      status: 'connected',
      dbName: db.databaseName,
      collections: statsList,
    });
  } catch (err) {
    console.error('[Admin] getDatabaseHealth error:', err);
    res.status(500).json({ message: 'Failed to fetch database health.' });
  }
};

// getSystemHealth — GET /api/v1/admin/system/health
exports.getSystemHealth = async (req, res) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    const mem = process.memoryUsage();
    const totalMem = os.totalmem() || 1;
    const usedPercent = mem.heapTotal
      ? Math.min(100, Math.round((mem.heapUsed / mem.heapTotal) * 100))
      : Math.min(100, Math.round((mem.rss / totalMem) * 100));
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeFormatted = `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`;

    res.json({
      status: dbConnected ? 'ok' : 'degraded',
      database: dbConnected ? 'connected' : 'disconnected',
      uptime: uptimeFormatted,
      uptimeSeconds,
      uptimeFormatted,
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: usedPercent,
      memory: {
        usedPercent,
        heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
      },
      cpuUsage: Number((os.loadavg()[0] || 0).toFixed(2)),
      services: {
        api: 'up',
        mongodb: dbConnected ? 'up' : 'down',
        socketio: req.app?.get?.('io') ? 'up' : 'down',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Admin] getSystemHealth error:', err);
    res.status(500).json({ message: 'Failed to fetch system health.' });
  }
};

// getNotifications — GET /api/v1/admin/notifications
// Admin-scoped: returns system & safety notifications for current admin/staff user
exports.getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const notifFilter = { recipient: req.userId, type: { $in: ['system', 'safety_alert'] } };
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(notifFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(notifFilter),
      Notification.countDocuments({ ...notifFilter, read: false }),
    ]);
    res.json({ notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Admin] getNotifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

// markAllNotificationsRead — PATCH /api/v1/admin/notifications/read-all
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.userId, type: { $in: ['system', 'safety_alert'] }, read: false },
      { $set: { read: true, isRead: true, readAt: new Date() } }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount || 0 });
  } catch (err) {
    console.error('[Admin] markAllNotificationsRead error:', err);
    res.status(500).json({ message: 'Failed to mark notifications as read.' });
  }
};

// markNotificationRead — PATCH /api/v1/admin/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid notification ID.' });
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId },
      { $set: { read: true, isRead: true, readAt: new Date() } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ notification: notif });
  } catch (err) {
    console.error('[Admin] markNotificationRead error:', err);
    res.status(500).json({ message: 'Failed to mark notification as read.' });
  }
};

// updateUserProfile — PATCH /api/v1/admin/users/:id
// Allow admin to edit limited user fields (name, bio, isActive)
exports.updateUserProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    const target = await User.findById(req.params.id).select('role name email bio isActive');
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (target.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only a Super Admin can edit another Super Admin.' });
    }
    const { name, bio } = req.body;
    if (name !== undefined) target.name = String(name).trim().slice(0, 80);
    if (bio !== undefined) target.bio = String(bio).trim().slice(0, 500);
    await target.save();
    await logAdminAction(req.userId, 'user_profile_edited', target._id, { targetEmail: target.email }, req.ip);
    res.json({ message: 'User profile updated.', user: target });
  } catch (err) {
    console.error('[Admin] updateUserProfile error:', err);
    res.status(500).json({ message: 'Failed to update user profile.' });
  }
};
