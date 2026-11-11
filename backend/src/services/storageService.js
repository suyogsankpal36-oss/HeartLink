const axios = require("axios");
const crypto = require("crypto");
const mongoose = require("mongoose");

const bucketName = "profilePhotos";
const cloudinaryConfigured = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
);

function getProfilePhotoBucket() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    const error = new Error("MongoDB Atlas is not connected.");
    error.status = 503;
    throw error;
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
}

function signature(parameters) {
  const payload = Object.keys(parameters).sort().map((key) => `${key}=${parameters[key]}`).join("&");
  return crypto.createHash("sha1").update(`${payload}${process.env.CLOUDINARY_API_SECRET}`).digest("hex");
}

async function storeProfilePhoto(file, userId) {
  const bucket = getProfilePhotoBucket();
  const filename = `${String(userId)}-${crypto.randomBytes(12).toString("hex")}.${file.detectedExtension}`;
  const upload = bucket.openUploadStream(filename, {
    contentType: file.mimetype,
    metadata: { ownerId: String(userId), contentType: file.mimetype, kind: "profile-photo" },
  });
  const photoId = upload.id.toString();

  try {
    await new Promise((resolve, reject) => {
      upload.once("error", reject);
      upload.once("finish", resolve);
      upload.end(file.buffer);
    });
  } catch (error) {
    await bucket.delete(upload.id).catch(() => {});
    throw error;
  }

  return `/uploads/profiles/${photoId}`;
}

async function deleteProfilePhoto(url) {
  if (typeof url !== "string") return true;
  if (url.startsWith("/uploads/profiles/")) {
    const photoId = new URL(url, "http://localhost").pathname.split("/").pop();
    if (!mongoose.Types.ObjectId.isValid(photoId)) return false;
    try {
      await getProfilePhotoBucket().delete(new mongoose.Types.ObjectId(photoId));
      return true;
    } catch (error) {
      return error.code === 26 || error.codeName === "NamespaceNotFound";
    }
  }
  if (!cloudinaryConfigured()) return true;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com" || !parsed.pathname.startsWith(`/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`)) return true;
    const publicId = parsed.pathname.split("/image/upload/")[1].replace(/^v\d+\//, "").replace(/\.[a-zA-Z0-9]+$/, "");
    if (!publicId.startsWith("heartlink/profiles/")) return true;
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { public_id: publicId, timestamp };
    const form = new FormData();
    form.append("api_key", process.env.CLOUDINARY_API_KEY);
    form.append("public_id", publicId);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature(params));
    const { data } = await axios.post(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`, form, { timeout: 15000 });
    return data?.result === "ok" || data?.result === "not found";
  } catch (error) {
    if (error.response) console.warn("Cloud storage photo deletion failed:", error.response.status);
    return false;
  }
}

module.exports = { storeProfilePhoto, deleteProfilePhoto, cloudinaryConfigured };
