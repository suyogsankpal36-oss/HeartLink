/**
 * database.js
 * 
 * MongoDB Atlas Connection Configuration for HeartLink.
 * Re-exports the primary database connection module from src/config/database.js
 * to ensure compatibility with root and src paths.
 */

module.exports = require("../src/config/database");
