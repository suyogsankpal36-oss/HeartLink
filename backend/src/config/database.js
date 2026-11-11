const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const atlasUri = process.env.MONGODB_URI?.trim();
  if (!atlasUri) throw new Error("MONGODB_URI is required. Set it to your MongoDB Atlas connection string in backend/.env.");
  if (!/^mongodb(?:\+srv)?:\/\//i.test(atlasUri)) throw new Error("MONGODB_URI must be a valid MongoDB connection string.");
  if (/^mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1|\[::1\])(?=[:/])/i.test(atlasUri)) {
    throw new Error("MONGODB_URI must point to MongoDB Atlas; local MongoDB connections are disabled.");
  }

  const mongooseOpts = {
    dbName: "heartlink",
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
  };

  try {
    const connection = await mongoose.connect(atlasUri, mongooseOpts);
    isConnected = true;
    console.log(`[DATABASE] MongoDB Atlas connected successfully to host: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    isConnected = false;
    throw new Error(`MongoDB Atlas connection failed: ${error.message}`);
  }
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("[DATABASE] MongoDB connection lost. Awaiting reconnect...");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  console.log("[DATABASE] MongoDB connection re-established.");
});

module.exports = connectDB;

