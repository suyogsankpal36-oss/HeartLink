const mongoose = require("mongoose");
const { calculateAge } = require("../utils/adultPolicy");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 120,
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator(value) {
          if (value == null) return true; // Allows legacy accounts created before date-of-birth collection.
          const age = calculateAge(value);
          return Number.isInteger(age) && age >= 18 && age <= 120;
        },
        message: "Users must be at least 18 years old.",
      },
    },
    termsAcceptedAt: {
      type: Date,
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationRequired: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "other"],
      required: true,
    },
    interestedIn: {
      type: [{
        type: String,
        enum: ["male", "female", "non-binary", "other", "all"],
      }],
      default: ["all"],
    },
    role: {
      type: String,
      enum: ["member", "moderator", "admin", "superadmin"],
      default: "member",
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: [Number],
    },
    interests: {
      type: [String],
      default: [],
    },
    lookingFor: {
      type: String,
      enum: ["relationship", "friendship", "casual"],
      default: "relationship",
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    photos: {
      type: [String],
      default: [],
    },
    prompts: [
      {
        question: { type: String, trim: true },
        answer: { type: String, trim: true, maxlength: 400 },
      },
    ],
    lifestyle: {
      zodiac: { type: String, default: "" },
      drinking: { type: String, default: "" },
      smoking: { type: String, default: "" },
      workout: { type: String, default: "" },
      pets: { type: String, default: "" },
      education: { type: String, default: "" },
      height: { type: String, default: "" },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    discoveryPreferences: {
      genderPreference: {
        type: String,
        enum: ["all", "female", "male", "non-binary", "other"],
        default: "all",
      },
      minAge: { type: Number, default: 18, min: 18, max: 120 },
      maxAge: { type: Number, default: 50, min: 18, max: 120 },
      distance: { type: Number, default: 50 },
      hideProfile: { type: Boolean, default: false },
    },
    isIncognito: {
      type: Boolean,
      default: false,
    },
    notificationSettings: {
      newMatches: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      sounds: { type: Boolean, default: true },
    },
    privacySettings: {
      showOnlineStatus: { type: Boolean, default: true },
      readReceipts: { type: Boolean, default: true },
      shareApproximateLocation: { type: Boolean, default: true },
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    googleId: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  { timestamps: true }
);

userSchema.index({ isActive: 1, gender: 1, age: 1, createdAt: -1 });
userSchema.index({ location: "2dsphere" }, { sparse: true });
userSchema.index({ dateOfBirth: 1, isActive: 1, gender: 1 });

userSchema.pre("validate", function deriveAgeFromDateOfBirth() {
  if (this.dateOfBirth) {
    this.age = calculateAge(this.dateOfBirth);
  }
});

module.exports = mongoose.model("User", userSchema);
