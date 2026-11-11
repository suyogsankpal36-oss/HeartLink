const { logSecurityEvent } = require("../services/auditLogger");

module.exports = function requireRole(...roles) {
  return async function authorizeRole(req, res, next) {
    try {
      // Expect authMiddleware to have attached full user object to req.user
      const user = req.user;
      if (!user || user.isActive === false || !roles.includes(user.role)) {
        await logSecurityEvent(
          "unauthorized_api",
          "medium",
          req.userId || user?._id || null,
          req.ip || "",
          { path: req.originalUrl, method: req.method, userRole: user?.role || null, requiredRoles: roles },
          typeof req.get === "function" ? req.get("user-agent") || "" : "",
        );
        return res.status(403).json({ message: "You are not allowed to perform this action." });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
};
