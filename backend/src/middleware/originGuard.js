function isLocalDevelopmentOrigin(origin) {
  if (process.env.NODE_ENV === "production") return false;

  try {
    const parsed = new URL(origin);
    return parsed.protocol === "http:"
      && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname.toLowerCase())
      && !parsed.username
      && !parsed.password;
  } catch {
    return false;
  }
}

function originGuard(allowedOrigins) {
  const normalizedOrigins = new Set(allowedOrigins.map((origin) => origin.replace(/\/+$/, "")));

  return function validateOrigin(req, res, next) {
    const origin = req.get("origin");
    if (!origin) return next();

    const normalizedOrigin = origin.replace(/\/+$/, "");
    if (!normalizedOrigins.has(normalizedOrigin) && !isLocalDevelopmentOrigin(normalizedOrigin)) {
      return res.status(403).json({ message: "Request origin is not allowed." });
    }

    return next();
  };
}

originGuard.isLocalDevelopmentOrigin = isLocalDevelopmentOrigin;

module.exports = originGuard;
