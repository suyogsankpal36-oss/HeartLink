const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { validateEnvironment } = require("./env");

const backendEnvPath = path.resolve(__dirname, "../../.env");
const frontendEnvPath = path.resolve(__dirname, "../../../frontend/.env");
dotenv.config({ path: backendEnvPath, quiet: true });

const errors = [];
try {
  validateEnvironment(process.env);
} catch (error) {
  errors.push(error.message);
}

let frontendEnv = {};
if (fs.existsSync(frontendEnvPath)) {
  frontendEnv = dotenv.parse(fs.readFileSync(frontendEnvPath));
}

const firebaseClientKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];
const configuredClientKeys = firebaseClientKeys.filter((key) => frontendEnv[key]?.trim());
const backendFirebaseProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
if (configuredClientKeys.length === 0) {
  console.log("Firebase Google sign-in is disabled; frontend Firebase settings are blank.");
}
if (configuredClientKeys.length > 0 && configuredClientKeys.length < firebaseClientKeys.length) {
  const missing = firebaseClientKeys.filter((key) => !frontendEnv[key]?.trim());
  errors.push(`Firebase web config is incomplete in frontend/.env. Set: ${missing.join(", ")}.`);
}
if (configuredClientKeys.length === firebaseClientKeys.length) {
  if (!backendFirebaseProjectId) {
    errors.push("FIREBASE_PROJECT_ID is required in backend/.env when Firebase web config is enabled.");
  } else if (frontendEnv.VITE_FIREBASE_PROJECT_ID.trim() !== backendFirebaseProjectId) {
    errors.push("FIREBASE_PROJECT_ID and VITE_FIREBASE_PROJECT_ID must match.");
  }
}

if (errors.length) {
  console.error("Environment configuration needs attention:");
  errors.forEach((message) => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log("MongoDB Atlas URI is configured (value hidden).");
  console.log(configuredClientKeys.length === firebaseClientKeys.length
    ? "Firebase web config and backend project ID are present and match."
    : "Firebase Google sign-in is disabled; no complete frontend Firebase config was found.");
}
