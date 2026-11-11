const authMiddleware = require("./authMiddleware");

module.exports = function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return authMiddleware(req, res, next);
};
