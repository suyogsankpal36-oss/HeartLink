function validateEnvironment(env = process.env) {
  if (!env.MONGODB_URI?.trim()) throw new Error("MONGODB_URI is required. Set your MongoDB Atlas connection string in backend/.env.");
  if (!/^mongodb(?:\+srv)?:\/\//i.test(env.MONGODB_URI.trim())) throw new Error("MONGODB_URI must be a MongoDB connection string.");
  if (/^mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1|\[::1\])(?=[:/])/i.test(env.MONGODB_URI.trim())) {
    throw new Error("MONGODB_URI must point to MongoDB Atlas; local MongoDB connections are disabled.");
  }
  if (env.FIREBASE_PROJECT_ID && !/^[a-z0-9-]{6,30}$/.test(env.FIREBASE_PROJECT_ID)) {
    throw new Error("FIREBASE_PROJECT_ID must be a valid Firebase project ID.");
  }
  if (env.NODE_ENV !== "production") return;

  const accessSecret = env.ACCESS_TOKEN_SECRET || env.JWT_SECRET || "";
  const refreshSecret = env.REFRESH_TOKEN_SECRET || env.JWT_REFRESH_SECRET || "";

  if (accessSecret.length < 32 || accessSecret.startsWith("replace_with_")) {
    throw new Error("ACCESS_TOKEN_SECRET (or JWT_SECRET) must be a generated secret of at least 32 characters.");
  }
  if (refreshSecret.length < 32 || refreshSecret.startsWith("replace_with_")) {
    throw new Error("REFRESH_TOKEN_SECRET (or JWT_REFRESH_SECRET) must be a generated secret of at least 32 characters.");
  }
  if (accessSecret === refreshSecret) {
    throw new Error("Access and refresh token secrets must be different values.");
  }
  const origins = [env.CLIENT_URL, ...(env.CORS_ORIGINS || "").split(",")].filter(Boolean).map((origin) => origin.trim());
  if (!origins.length) throw new Error("Set CLIENT_URL or CORS_ORIGINS to your production frontend origin.");
  if (origins.some((origin) => !origin.startsWith("https://"))) throw new Error("Every production frontend origin must use HTTPS.");

  const cloudinaryFields = [env.CLOUDINARY_CLOUD_NAME, env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET];
  if (cloudinaryFields.some(Boolean) && !cloudinaryFields.every(Boolean)) throw new Error("Configure all three Cloudinary variables together.");

  const smtpFields = [env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASSWORD, env.SMTP_FROM];
  if (smtpFields.some(Boolean) && !smtpFields.every(Boolean)) throw new Error("Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM together.");

  for (const name of ["PLAN_MONTHLY_AMOUNT_MINOR", "PLAN_QUARTERLY_AMOUNT_MINOR", "PLAN_ANNUAL_AMOUNT_MINOR"]) {
    const value = Number(env[name]);
    if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive amount in minor currency units.`);
  }
}

module.exports = { validateEnvironment };
