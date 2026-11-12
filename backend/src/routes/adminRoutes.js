const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const adminController = require('../controllers/adminController');

// All admin routes require authentication + at minimum moderator role
router.use(authMiddleware);

// SUPER_ADMIN + ADMIN + MODERATOR routes
const staffOnly = requireRole('superadmin', 'admin', 'moderator');

// SUPER_ADMIN + ADMIN only
const adminOnly = requireRole('superadmin', 'admin');

// SUPER_ADMIN only
const superAdminOnly = requireRole('superadmin');

router.get('/moderation/overview', staffOnly, adminController.getModeratorOverview);
router.get('/dashboard', adminOnly, adminController.getDashboard);
router.get('/users', adminOnly, adminController.getUsers);
router.get('/users/:id', staffOnly, adminController.getUserById);
router.patch('/users/:id', adminOnly, adminController.updateUserProfile);
router.patch('/users/:id/status', adminOnly, adminController.updateUserStatus);
router.patch('/users/:id/role', superAdminOnly, adminController.updateUserRole);
router.get('/users/:id/activities', adminOnly, adminController.getUserActivities);
router.get('/activities', adminOnly, adminController.getActivities);
router.get('/analytics', adminOnly, adminController.getAnalytics);
router.get('/security', adminOnly, adminController.getSecurityEvents);
router.get('/audit-logs', adminOnly, adminController.getAuditLogs);
router.get('/database/health', superAdminOnly, adminController.getDatabaseHealth);
router.get('/system/health', adminOnly, adminController.getSystemHealth);
router.get('/notifications', staffOnly, adminController.getNotifications);
router.patch('/notifications/read-all', staffOnly, adminController.markAllNotificationsRead);
router.patch('/notifications/:id/read', staffOnly, adminController.markNotificationRead);

module.exports = router;
