const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getProfile,
  updateProfile,
  getUserProfileById,
  deleteProfilePhoto,
} = require("../controllers/profileController");
const { deleteAccount } = require("../controllers/authController");

router.get("/", authMiddleware, getProfile);
router.get("/me", authMiddleware, getProfile);
router.delete("/", authMiddleware, deleteAccount);
router.get("/:id", authMiddleware, getUserProfileById);
router.delete("/photo", authMiddleware, deleteProfilePhoto);
router.delete("/photos/:photoId", authMiddleware, deleteProfilePhoto);
router.delete("/me/photos/:photoId", authMiddleware, deleteProfilePhoto);

const updateWithUpload = (req, res, next) => {
  upload.single("photo")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message || "Photo upload failed.",
      });
    }
    return next();
  });
};

router.put("/", authMiddleware, updateWithUpload, updateProfile);
router.patch("/", authMiddleware, updateWithUpload, updateProfile);
router.patch("/me", authMiddleware, updateWithUpload, updateProfile);
router.post(
  "/me/photos",
  authMiddleware,
  updateWithUpload,
  updateProfile
);

module.exports = router;
