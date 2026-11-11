/**
 * googleAuthService.js
 * 
 * Cryptographically verifies Google and Firebase ID tokens for HeartLink.
 * Uses Axios for HTTP calls to Google's public x509 cert and tokeninfo endpoints.
 * Prevents account takeover attacks (S1) by guaranteeing that client-provided emails
 * and UIDs are signed and verified by Google / Firebase before session creation.
 */

const jwt = require("jsonwebtoken");
const axios = require("axios");

let cachedCerts = null;
let certsExpiry = 0;

/**
 * Fetch and cache Google public x509 certificates used to sign Firebase Auth ID tokens.
 */
async function getGooglePublicCerts() {
  const now = Date.now();
  if (cachedCerts && now < certsExpiry) {
    return cachedCerts;
  }

  const response = await axios.get(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
    { timeout: 5000 }
  );

  cachedCerts = response.data;
  // Cache for 1 hour
  certsExpiry = now + 60 * 60 * 1000;
  return cachedCerts;
}

/**
 * Verify a Google ID token or Firebase Auth ID token.
 * 
 * @param {string} idToken - The JWT ID token issued by Google or Firebase Auth.
 * @returns {Promise<{email: string, uid: string, name: string, photoURL: string, emailVerified: boolean}>}
 */
async function verifyGoogleOrFirebaseToken(idToken) {
  if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
    throw new Error("Google authentication token (idToken) is required.");
  }

  const trimmedToken = idToken.trim();
  const decodedComplete = jwt.decode(trimmedToken, { complete: true });

  if (!decodedComplete || !decodedComplete.header || !decodedComplete.payload) {
    throw new Error("Malformed Google authentication token.");
  }

  const { header, payload } = decodedComplete;
  const issuer = payload.iss || "";

  // 1. Firebase Auth ID Token (iss: https://securetoken.google.com/<projectId>)
  if (issuer.startsWith("https://securetoken.google.com/")) {
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const tokenProjectId = issuer.slice("https://securetoken.google.com/".length);
    if (!projectId) throw new Error("Firebase sign-in is not configured on the server.");
    if (tokenProjectId !== projectId) throw new Error("Firebase token belongs to a different project.");

    const certs = await getGooglePublicCerts();
    const cert = certs[header.kid];
    if (!cert) {
      throw new Error(`Unrecognized key ID in Firebase token (${header.kid}).`);
    }

    const verified = jwt.verify(trimmedToken, cert, {
      algorithms: ["RS256"],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const email = verified.email ? verified.email.trim().toLowerCase() : null;
    if (!email) {
      throw new Error("Firebase token does not contain an email address.");
    }

    if (verified.email_verified !== true) {
      throw new Error("Firebase account email address is not verified.");
    }

    return {
      email,
      uid: verified.sub || verified.user_id,
      name: verified.name || verified.display_name || "",
      photoURL: verified.picture || "",
      emailVerified: true,
      authProvider: "google",
    };
  }

  // 2. Standard Google OAuth2 ID Token (iss: accounts.google.com or https://accounts.google.com)
  if (issuer === "accounts.google.com" || issuer === "https://accounts.google.com") {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
    if (!clientId) throw new Error("Google OAuth client sign-in is not configured on the server.");
    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(trimmedToken)}`;
    const response = await axios.get(tokenInfoUrl, { timeout: 5000 });
    const data = response.data;
    if (data.aud !== clientId) throw new Error("Google token audience does not match the configured client.");
    const email = data.email ? data.email.trim().toLowerCase() : null;
    if (!email) {
      throw new Error("Google OAuth token does not contain an email address.");
    }

    const isVerified = data.email_verified === "true" || data.email_verified === true;
    if (!isVerified) {
      throw new Error("Google account email is not verified.");
    }

    return {
      email,
      uid: data.sub,
      name: data.name || "",
      photoURL: data.picture || "",
      emailVerified: true,
      authProvider: "google",
    };
  }

  throw new Error(`Unsupported token issuer: "${issuer}". Only Google and Firebase tokens are accepted.`);
}

module.exports = {
  verifyGoogleOrFirebaseToken,
};
