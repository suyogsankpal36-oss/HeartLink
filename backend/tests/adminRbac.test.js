const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

// Models
const User = require("../src/models/User");
const ActivityLog = require("../src/models/ActivityLog");
const AdminAuditLog = require("../src/models/AdminAuditLog");
const SecurityEvent = require("../src/models/SecurityEvent");

// Middleware & Controllers
const requireRole = require("../src/middleware/requireRole");
const adminController = require("../src/controllers/adminController");
const reportController = require("../src/controllers/reportController");
const auditLogger = require("../src/services/auditLogger");
const Report = require("../src/models/Report");

function makeMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    },
  };
}

test("User model supports 4-level role hierarchy including superadmin", () => {
  const roleField = User.schema.path("role");
  assert.ok(roleField, "Role field exists on User schema");
  const validRoles = roleField.enumValues;
  assert.deepEqual(
    validRoles.sort(),
    ["admin", "member", "moderator", "superadmin"].sort(),
    "Role enum must contain member, moderator, admin, and superadmin"
  );
});

test("Admin models ActivityLog, AdminAuditLog, SecurityEvent are registered with valid schemas", () => {
  const adminModels = [
    { model: ActivityLog, collection: "activitylogs" },
    { model: AdminAuditLog, collection: "adminauditlogs" },
    { model: SecurityEvent, collection: "securityevents" },
  ];

  for (const { model, collection } of adminModels) {
    assert.ok(model.schema instanceof mongoose.Schema, `${model.modelName} schema is missing`);
    assert.equal(model.collection.name, collection, `${model.modelName} mapped to unexpected collection`);
  }
});

test("ActivityLog schema indexes and required fields", () => {
  assert.ok(ActivityLog.schema.path("action"), "Action path exists");
  assert.equal(ActivityLog.schema.path("action").isRequired, true);
  assert.ok(ActivityLog.schema.path("category"), "Category path exists");
  assert.ok(ActivityLog.schema.path("status"), "Status path exists");
});

test("AdminAuditLog schema requires adminId and action", () => {
  assert.ok(AdminAuditLog.schema.path("adminId"), "adminId path exists");
  assert.equal(AdminAuditLog.schema.path("adminId").isRequired, true);
  assert.ok(AdminAuditLog.schema.path("action"), "Action path exists");
  assert.equal(AdminAuditLog.schema.path("action").isRequired, true);
});

test("SecurityEvent schema validates severity and event type", () => {
  assert.ok(SecurityEvent.schema.path("type"), "Type path exists");
  assert.equal(SecurityEvent.schema.path("type").isRequired, true);
  const severities = SecurityEvent.schema.path("severity").enumValues;
  assert.ok(severities.includes("critical"));
  assert.ok(severities.includes("high"));
  assert.ok(severities.includes("medium"));
  assert.ok(severities.includes("low"));
});

test("requireRole middleware permits users with matching or higher roles", async () => {
  const superAdminGuard = requireRole("superadmin");
  const adminGuard = requireRole("superadmin", "admin");
  const modGuard = requireRole("superadmin", "admin", "moderator");

  // Mock request/response helpers
  const createMock = (role, isActive = true) => ({
    req: { user: { role, isActive }, userId: "650000000000000000000001" },
    res: {
      statusCode: 200,
      data: null,
      status(code) { this.statusCode = code; return this; },
      json(obj) { this.data = obj; return this; }
    },
    calledNext: false,
    next() { this.calledNext = true; }
  });

  // 1. Super Admin accessing superadmin route
  const saReq = createMock("superadmin");
  await superAdminGuard(saReq.req, saReq.res, () => saReq.next());
  assert.equal(saReq.calledNext, true, "Superadmin should pass superadminGuard");
  assert.equal(saReq.res.statusCode, 200);

  // 2. Admin attempting to access superadmin-only route
  const adminOnSa = createMock("admin");
  await superAdminGuard(adminOnSa.req, adminOnSa.res, () => adminOnSa.next());
  assert.equal(adminOnSa.calledNext, false, "Admin must be blocked from superadmin-only route");
  assert.equal(adminOnSa.res.statusCode, 403);

  // 3. Admin accessing admin route
  const adminOnAdmin = createMock("admin");
  await adminGuard(adminOnAdmin.req, adminOnAdmin.res, () => adminOnAdmin.next());
  assert.equal(adminOnAdmin.calledNext, true, "Admin should pass adminGuard");

  // 4. Moderator attempting to access admin route
  const modOnAdmin = createMock("moderator");
  await adminGuard(modOnAdmin.req, modOnAdmin.res, () => modOnAdmin.next());
  assert.equal(modOnAdmin.calledNext, false, "Moderator must be blocked from admin route");
  assert.equal(modOnAdmin.res.statusCode, 403);

  // 5. Member attempting to access staff route
  const memberOnStaff = createMock("member");
  await modGuard(memberOnStaff.req, memberOnStaff.res, () => memberOnStaff.next());
  assert.equal(memberOnStaff.calledNext, false, "Regular member must be blocked from staff route");
  assert.equal(memberOnStaff.res.statusCode, 403);

  // 6. Deactivated superadmin attempting access
  const deactivatedSa = createMock("superadmin", false);
  await superAdminGuard(deactivatedSa.req, deactivatedSa.res, () => deactivatedSa.next());
  assert.equal(deactivatedSa.calledNext, false, "Deactivated account must be rejected");
  assert.equal(deactivatedSa.res.statusCode, 403);
});

test("adminController exports all 15 required enterprise endpoints", () => {
  const expectedControllers = [
    "getDashboard",
    "getUsers",
    "getUserById",
    "updateUserProfile",
    "updateUserStatus",
    "updateUserRole",
    "getUserActivities",
    "getActivities",
    "getAnalytics",
    "getSecurityEvents",
    "getAuditLogs",
    "getDatabaseHealth",
    "getSystemHealth",
    "getNotifications",
    "markNotificationRead",
    "markAllNotificationsRead",
  ];

  for (const fnName of expectedControllers) {
    assert.equal(typeof adminController[fnName], "function", `adminController.${fnName} must be a function`);
  }
});

test("auditLogger provides logAdminAction, logActivity, and logSecurityEvent services without throwing when disconnected", async () => {
  assert.equal(typeof auditLogger.logAdminAction, "function");
  assert.equal(typeof auditLogger.logActivity, "function");
  assert.equal(typeof auditLogger.logSecurityEvent, "function");
  await assert.doesNotReject(() => auditLogger.logActivity("650000000000000000000001", "login", "auth", "Test login"));
  await assert.doesNotReject(() => auditLogger.logSecurityEvent("failed_login", "low", null, "127.0.0.1", {}));
});

test("reportController enforces 4-role moderation hierarchy (superadmin > admin > moderator > member)", async () => {
  const origReportFind = Report.findById;
  const origUserFind = User.findById;
  try {
    const reportId = "650000000000000000000099";
    const actorId = "650000000000000000000001";
    const targetId = "650000000000000000000002";

    Report.findById = async () => ({
      _id: reportId,
      reportedUser: targetId,
      status: "open",
      async save() { return this; },
    });

    // Admin attempting to suspend Super Admin -> 403
    User.findById = (id) => ({
      select: async () => (String(id) === actorId ? { _id: actorId, role: "admin" } : { _id: targetId, role: "superadmin", isActive: true, async save() {} }),
    });
    const res1 = makeMockRes();
    await reportController.updateAdminReport({ params: { id: reportId }, userId: actorId, body: { actionOnUser: "suspend" }, ip: "127.0.0.1", get: () => "" }, res1);
    assert.equal(res1.statusCode, 403, "Admin must not moderate a Super Admin account");

    // Admin attempting to moderate another Admin -> 403
    User.findById = (id) => ({
      select: async () => (String(id) === actorId ? { _id: actorId, role: "admin" } : { _id: targetId, role: "admin", isActive: true, async save() {} }),
    });
    const res2 = makeMockRes();
    await reportController.updateAdminReport({ params: { id: reportId }, userId: actorId, body: { actionOnUser: "suspend" }, ip: "127.0.0.1", get: () => "" }, res2);
    assert.equal(res2.statusCode, 403, "Admin must not moderate an equal Admin account");

    // Super Admin reacting on an Admin -> 200
    let targetSaved = false;
    User.findById = (id) => ({
      select: async () => (String(id) === actorId
        ? { _id: actorId, role: "superadmin" }
        : { _id: targetId, role: "admin", isActive: false, async save() { targetSaved = true; } }),
    });
    const res3 = makeMockRes();
    await reportController.updateAdminReport({ params: { id: reportId }, userId: actorId, body: { status: "resolved", actionOnUser: "reactivate" }, ip: "127.0.0.1", get: () => "" }, res3);
    assert.equal(res3.statusCode, 200, "Super Admin must be allowed to reactivate a suspended Admin");
    assert.equal(targetSaved, true);
  } finally {
    Report.findById = origReportFind;
    User.findById = origUserFind;
  }
});

test("adminController.updateUserStatus blocks self-suspension and admin-vs-superadmin edits", async () => {
  const origUserFind = User.findById;
  try {
    const actorId = "650000000000000000000010";
    const targetId = "650000000000000000000020";

    // Self-suspension check
    const selfRes = makeMockRes();
    await adminController.updateUserStatus(
      { params: { id: actorId }, userId: actorId, user: { role: "superadmin" }, body: { isActive: false } },
      selfRes,
    );
    assert.equal(selfRes.statusCode, 403, "Self-suspension must be forbidden");

    // Admin attempting to suspend Super Admin -> 403
    User.findById = () => ({
      select: async () => ({ _id: targetId, role: "superadmin", isActive: true, email: "sa@heartlink.app" }),
    });
    const privRes = makeMockRes();
    await adminController.updateUserStatus(
      { params: { id: targetId }, userId: actorId, user: { role: "admin" }, body: { isActive: false } },
      privRes,
    );
    assert.equal(privRes.statusCode, 403, "Admin must not change Super Admin status");
  } finally {
    User.findById = origUserFind;
  }
});

test("adminController health endpoints never leak credentials and return expected metrics", async () => {
  const sysRes = makeMockRes();
  await adminController.getSystemHealth({ app: { get: () => null } }, sysRes);
  assert.ok(sysRes.data, "getSystemHealth returns payload");
  assert.equal(typeof sysRes.data.memoryUsage, "number");
  assert.ok(sysRes.data.services && "api" in sysRes.data.services && "mongodb" in sysRes.data.services && "socketio" in sysRes.data.services);
  assert.ok(sysRes.data.platform);
  assert.ok(!JSON.stringify(sysRes.data).includes("mongodb+srv://"), "Must never leak connection URI");

  const dbRes = makeMockRes();
  await adminController.getDatabaseHealth({}, dbRes);
  if (mongoose.connection.readyState !== 1) {
    assert.equal(dbRes.statusCode, 503);
    assert.equal(dbRes.data.connected, false);
  }
});

test("adminController rejects empty user name on updateUserProfile and invalid dates on log queries with 400", async () => {
  const origUserFind = User.findById;
  try {
    const targetId = "650000000000000000000021";
    User.findById = () => ({
      select: async () => ({ _id: targetId, role: "member", name: "Existing", bio: "" }),
    });
    const emptyNameRes = makeMockRes();
    await adminController.updateUserProfile(
      { params: { id: targetId }, userId: "650000000000000000000010", user: { role: "admin" }, body: { name: "   " } },
      emptyNameRes,
    );
    assert.equal(emptyNameRes.statusCode, 400, "Blank name should return 400 instead of Mongoose ValidationError 500");
  } finally {
    User.findById = origUserFind;
  }

  for (const fn of ["getActivities", "getSecurityEvents", "getAuditLogs"]) {
    const res = makeMockRes();
    await adminController[fn]({ query: { startDate: "not-a-date" } }, res);
    assert.equal(res.statusCode, 400, `${fn} should return 400 for invalid startDate`);
  }
});
