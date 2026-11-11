module.exports = function errorHandler(error, req, res, next) {
  console.error("[SERVER ERROR]", error.message);
  if (res.headersSent) return next(error);

  if (
    error.name === "MongoServerSelectionError" ||
    error.name === "MongoTimeoutError" ||
    error.name === "MongoNetworkError" ||
    (error.name === "MongooseError" && error.message.includes("buffering timed out"))
  ) {
    return res.status(503).json({
      message: "Database service temporarily unavailable. Please verify MongoDB Atlas connection and IP whitelist.",
    });
  }

  const status = error.status || error.statusCode || 500;
  const message = process.env.NODE_ENV === "production" && status === 500
    ? "An internal server error occurred."
    : error.message || "An unexpected error occurred.";
  return res.status(status).json({ message });
};
