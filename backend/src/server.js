/**
 * server.js
 * 
 * Main Server Entry Point for HeartLink.
 * Integrates the Express application from app.js with the HTTP server,
 * sets up the Socket.IO real-time engine via socketService,
 * connects to MongoDB Atlas, and listens on the configured PORT.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const { validateEnvironment } = require("./config/env");
const { app, allowedOrigins } = require("./app");
const socketService = require("./sockets/socketService");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO with dynamic CORS matching Express configuration
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, "");
      const isNetlifyDeployment = /^https:\/\/([a-z0-9-]+--)?hilarious-parfait-3bfc2c\.netlify\.app$/i.test(normalizedOrigin);
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        isNetlifyDeployment ||
        (process.env.NODE_ENV !== "production" &&
          (normalizedOrigin.includes("localhost") ||
            normalizedOrigin.includes("127.0.0.1")));
      if (isAllowed) return callback(null, true);
      return callback(null, false);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Expose io instance to Express routes and controllers
app.set("io", io);

// Attach Socket.IO presence, messaging, typing, and WebRTC signaling
socketService.initSocket(io);

async function startServer() {
  try {
    validateEnvironment();

    server.listen(PORT, () => {
      console.log(`HeartLink server running at http://localhost:${PORT}`);
      console.log(`Socket.IO real-time engine ready.`);
    });

    connectDB().catch((error) => {
      console.warn(`[DATABASE WARNING] Atlas connection pending: ${error.message}`);
      console.warn(`[DATABASE NOTICE] Please verify your IP is whitelisted in MongoDB Atlas: Security > Network Access.`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer, io };
