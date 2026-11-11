const mongoose = require("mongoose");
const User = require("../models/User");
const Like = require("../models/Like");
const Match = require("../models/Match");
const Message = require("../models/Message");
const Block = require("../models/Block");
const Notification = require("../models/Notification");
const { calculateAge } = require("../utils/adultPolicy");
const { INTEREST_SET } = require("../utils/interests");
const { isEmailVerificationComplete } = require("../utils/emailVerification");
const { logActivity } = require("../services/auditLogger");

function calculateCompatibility(currentUser, targetUser) {
  if (!currentUser || !targetUser) return 75;

  let score = 62; // baseline

  // 1. Mutual Interests (up to +24%)
  const userInterests = currentUser.interests || [];
  const targetInterests = targetUser.interests || [];
  const mutual = targetInterests.filter((item) => userInterests.includes(item));
  score += Math.min(24, mutual.length * 8);

  // 2. Dating Intent / Looking for (+10%)
  if (
    currentUser.lookingFor &&
    targetUser.lookingFor &&
    currentUser.lookingFor === targetUser.lookingFor
  ) {
    score += 10;
  }

  // 3. Lifestyle matches (+8%)
  const curLife = currentUser.lifestyle || {};
  const tarLife = targetUser.lifestyle || {};
  if (curLife.workout && tarLife.workout && curLife.workout === tarLife.workout) score += 4;
  if (curLife.pets && tarLife.pets && curLife.pets === tarLife.pets) score += 4;

  // 4. Deterministic hash variance so score varies organically per user pair
  const hash = (currentUser._id.toString() + targetUser._id.toString())
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variance = (hash % 11) - 3; // -3 to +7
  score += variance;

  return Math.min(99, Math.max(68, score));
}

function distanceLabel(firstCoordinates, secondCoordinates) {
  if (!Array.isArray(firstCoordinates) || !Array.isArray(secondCoordinates)) return "";
  const [firstLongitude, firstLatitude] = firstCoordinates;
  const [secondLongitude, secondLatitude] = secondCoordinates;
  const radians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDelta = radians(secondLatitude - firstLatitude);
  const longitudeDelta = radians(secondLongitude - firstLongitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(firstLatitude)) * Math.cos(radians(secondLatitude)) *
    Math.sin(longitudeDelta / 2) ** 2;
  const kilometers = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const bucket = kilometers <= 1 ? 1 : Math.ceil(kilometers / 5) * 5;
  return `Within ${bucket} km`;
}

function formatProfile(user, currentUser = null, distance = "") {
  const currentUserInterests = currentUser?.interests || [];
  const mutualInterests = Array.isArray(user.interests)
    ? user.interests.filter((item) => currentUserInterests.includes(item))
    : [];

  const photos =
    Array.isArray(user.photos) && user.photos.length > 0
      ? user.photos
      : [user.profilePhoto].filter(Boolean);

  const profilePhoto = user.profilePhoto || photos[0] || "";

  const compatibilityScore = currentUser
    ? calculateCompatibility(currentUser, user)
    : 80;

  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : user.age,
    gender: user.gender,
    bio: user.bio || "",
    city: user.city || "",
    interests: user.interests || [],
    mutualInterests,
    lookingFor: user.lookingFor || "relationship",
    profilePhoto,
    photos,
    prompts: user.prompts || [],
    lifestyle: user.lifestyle || {},
    isVerified: !!user.isVerified,
    ...(distance ? { distance } : {}),
    compatibilityScore,
    createdAt: user.createdAt,
  };
}

exports.getDiscoveryFeed = async (req, res) => {
  try {
    const {
      gender,
      minAge,
      maxAge,
      distance,
      lookingFor,
      city,
      interest,
      search,
      verifiedOnly,
      limit = 40,
      page = 1,
    } = req.query;

    const currentUser = await User.findById(req.userId);
    if (gender !== undefined && !["all", "male", "female", "non-binary", "other"].includes(gender)) return res.status(400).json({ message: "Invalid gender filter." });
    if (lookingFor !== undefined && !["all", "relationship", "friendship", "casual"].includes(lookingFor)) return res.status(400).json({ message: "Invalid dating intent filter." });

    // Find all users already liked or passed by the current user
    const [swiped, blocks] = await Promise.all([
      Like.find({ fromUser: req.userId }).select("toUser"),
      Block.find({
        $or: [{ blocker: req.userId }, { blockedUser: req.userId }],
      }),
    ]);

    const blockedIds = blocks.map((b) =>
      b.blocker.toString() === req.userId.toString() ? b.blockedUser : b.blocker
    );

    const excludedIds = [req.userId, ...swiped.map((s) => s.toUser), ...blockedIds];

    const query = {
      _id: { $nin: excludedIds },
      isActive: { $ne: false },
      isIncognito: { $ne: true },
      "discoveryPreferences.hideProfile": { $ne: true },
      $or: [
        { emailVerificationRequired: { $ne: true } },
        { isEmailVerified: true },
      ],
      email: { $not: /(@heartlink\.qa|@test\.com|qa_automation|test_)/i },
      name: { $not: /^Test /i },
    };

    const prefs = currentUser?.discoveryPreferences || {};

    const selectedGender = gender !== undefined ? gender : (prefs.genderPreference || "all");
    if (selectedGender && selectedGender !== "all") {
      query.gender = selectedGender;
    }

    if (lookingFor && lookingFor !== "all") {
      query.lookingFor = lookingFor;
    }

    const effectiveMinAge = minAge ? Number(minAge) : (prefs.minAge || 18);
    const effectiveMaxAge = maxAge ? Number(maxAge) : (prefs.maxAge || 120);

    if (!Number.isInteger(effectiveMinAge) || !Number.isInteger(effectiveMaxAge) || effectiveMinAge < 18 || effectiveMaxAge > 120 || effectiveMinAge > effectiveMaxAge) {
      return res.status(400).json({ message: "Age filters must be between 18 and 120 with minimum less than maximum." });
    }
    const oldestBirthDate = new Date();
    oldestBirthDate.setFullYear(oldestBirthDate.getFullYear() - (effectiveMaxAge + 1));
    oldestBirthDate.setDate(oldestBirthDate.getDate() + 1);
    const youngestBirthDate = new Date();
    youngestBirthDate.setFullYear(youngestBirthDate.getFullYear() - effectiveMinAge);
    query.$and = [
      { $or: [
        { dateOfBirth: { $gt: oldestBirthDate, $lte: youngestBirthDate } },
        { dateOfBirth: { $exists: false }, age: { $gte: effectiveMinAge, $lte: effectiveMaxAge } },
      ] },
    ];

    if (currentUser?.gender) {
      query.$and.push({ $or: [
        { interestedIn: { $in: [currentUser.gender, "all"] } },
        { interestedIn: { $exists: false } },
        { interestedIn: { $size: 0 } },
      ] });
    }

    const requestedDistance = distance === undefined ? Number(prefs.distance || 50) : Number(distance);
    if (!Number.isInteger(requestedDistance) || requestedDistance < 1 || requestedDistance > 500) {
      return res.status(400).json({ message: "Distance must be a whole number between 1 and 500 kilometers." });
    }
    const maxDistance = requestedDistance;
    const coordinates = currentUser?.location?.coordinates;
    if (coordinates?.length === 2 && currentUser?.privacySettings?.shareApproximateLocation !== false) {
      query.location = { $geoWithin: { $centerSphere: [coordinates, maxDistance / 6378.1] } };
      query["privacySettings.shareApproximateLocation"] = { $ne: false };
    }

    if (city !== undefined && (typeof city !== "string" || city.length > 100)) return res.status(400).json({ message: "City filter must be 100 characters or fewer." });
    const selectedInterests = typeof interest === "string" && interest.trim() ? interest.split(",").map((value) => value.trim()).filter(Boolean) : [];
    if (interest !== undefined && (typeof interest !== "string" || interest.length > 400 || selectedInterests.length > INTEREST_SET.size || selectedInterests.some((value) => !INTEREST_SET.has(value)))) return res.status(400).json({ message: "Interest filters are invalid." });

    if (city && city.trim()) {
      const escapedCity = city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.city = { $regex: new RegExp(escapedCity, "i") };
    }

    if (selectedInterests.length) {
      query.interests = { $in: selectedInterests };
    }

    if (search !== undefined) {
      if (typeof search !== "string" || search.length > 100) return res.status(400).json({ message: "Search must be 100 characters or fewer." });
      if (search.trim()) {
        const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.$and.push({ $or: [
          { name: { $regex: escapedSearch, $options: "i" } },
          { city: { $regex: escapedSearch, $options: "i" } },
          { bio: { $regex: escapedSearch, $options: "i" } },
          { interests: { $regex: escapedSearch, $options: "i" } },
        ] });
      }
    }

    if (verifiedOnly === "true") {
      query.isVerified = true;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (!Number.isInteger(pageNum) || pageNum < 1 || !Number.isInteger(limitNum) || limitNum < 1 || limitNum > 50) return res.status(400).json({ message: "Page must be positive and limit must be between 1 and 50." });
    const skip = (pageNum - 1) * limitNum;

    const [totalCount, potentialMatches] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
    ]);

    const profiles = potentialMatches.map((user) => {
      const sharesLocation = user.privacySettings?.shareApproximateLocation !== false;
      const distanceLabelValue = coordinates?.length === 2 && sharesLocation
        ? distanceLabel(coordinates, user.location?.coordinates)
        : "";
      return formatProfile(user, currentUser, distanceLabelValue);
    });

    // Sort profiles with highest compatibility first
    profiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const hasMore = pageNum < totalPages;

    return res.json({
      count: profiles.length,
      totalCount,
      page: pageNum,
      totalPages,
      hasMore,
      profiles,
    });
  } catch (error) {
    console.error("Discovery feed error:", error.message);
    return res.status(500).json({ message: "Could not load discovery feed." });
  }
};

exports.swipeLike = async (req, res) => {
  try {
    const body = req.body || {};
    const targetUserId = req.params.userId || body.targetUserId;
    const comment =
      typeof body.comment === "string" ? body.comment.trim().slice(0, 280) : "";
    const likeType = body.type === undefined ? "like" : body.type;

    if (!["like", "superlike"].includes(likeType)) {
      return res.status(400).json({ message: "Like type must be like or superlike." });
    }

    if (!targetUserId || targetUserId === req.userId.toString()) {
      return res.status(400).json({ message: "Valid target user ID required." });
    }
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    // Check if target user is blocked
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: req.userId, blockedUser: targetUserId },
        { blocker: targetUserId, blockedUser: req.userId },
      ],
    });

    if (isBlocked) {
      return res.status(400).json({ message: "Cannot interact with a blocked user." });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetUserId),
    ]);
    if (
      !targetUser ||
      targetUser.isActive === false ||
      targetUser.isIncognito === true ||
      targetUser.discoveryPreferences?.hideProfile === true ||
      !isEmailVerificationComplete(targetUser)
    ) {
      return res.status(404).json({ message: "Target user not found." });
    }

    // Check if target user has already liked the current user (e.g. from the Likes tab)
    const targetLike = await Like.findOne({
      fromUser: targetUserId,
      toUser: req.userId,
      type: { $in: ["like", "superlike"] },
    });

    if (!targetLike) {
      const effectiveAge = (user) => user.dateOfBirth ? calculateAge(user.dateOfBirth) : user.age;
      const viewerPreferences = currentUser?.discoveryPreferences || {};
      const candidatePreferences = targetUser.interestedIn?.length ? targetUser.interestedIn : ["all"];
      const viewerAge = effectiveAge(currentUser || {});
      const targetAge = effectiveAge(targetUser);
      const genderMatches = !viewerPreferences.genderPreference || viewerPreferences.genderPreference === "all" || viewerPreferences.genderPreference === targetUser.gender;
      const candidateAcceptsViewer = candidatePreferences.includes("all") || candidatePreferences.includes(currentUser?.gender);
      const viewerAcceptsAge = targetAge >= (viewerPreferences.minAge || 18) && targetAge <= (viewerPreferences.maxAge || 120);
      const candidateAcceptsAge = viewerAge >= (targetUser.discoveryPreferences?.minAge || 18) && viewerAge <= (targetUser.discoveryPreferences?.maxAge || 120);
      if (!currentUser || !genderMatches || !candidateAcceptsViewer || !viewerAcceptsAge || !candidateAcceptsAge) {
        return res.status(403).json({ message: "This profile is not eligible for your current discovery preferences." });
      }
    }

    // Persist the selected action type so a super-like is distinct from a normal like.
    let currentLike;
    try {
      currentLike = await Like.findOneAndUpdate(
        { fromUser: req.userId, toUser: targetUserId },
        { $set: { type: likeType, comment } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      currentLike = await Like.findOneAndUpdate(
        { fromUser: req.userId, toUser: targetUserId },
        { $set: { type: likeType, comment } },
        { new: true },
      );
    }

    if (targetLike) {
      // It's a mutual match!
      const [participantA, participantB] = [req.userId.toString(), targetUserId.toString()].sort();
      let match;
      try {
        match = await Match.findOneAndUpdate(
          { participantA, participantB },
          {
            $set: { status: "active", unmatchedAt: null },
            $setOnInsert: { users: [participantA, participantB], matchedAt: new Date() },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      } catch (error) {
        if (error.code !== 11000) throw error;
        match = await Match.findOne({ participantA, participantB, status: "active" });
        if (!match) throw error;
      }

      // If either user sent a comment on their like, start conversation with it!
      const initialComment = comment || targetLike.comment;
      if (initialComment && !match.lastMessage) {
        const commenterId = comment ? req.userId : targetUserId;
        const recipientId = comment ? targetUserId : req.userId;
        const openingMsg = await Message.create({
          match: match._id,
          sender: commenterId,
          receiver: recipientId,
          text: initialComment,
          read: false,
        });

        const updatedMatch = await Match.findOneAndUpdate(
          { _id: match._id, status: "active", lastMessage: null },
          { $set: { lastMessage: openingMsg._id, lastMessageAt: openingMsg.createdAt } },
          { new: true },
        );
        if (updatedMatch) match = updatedMatch;
        else await Message.deleteOne({ _id: openingMsg._id });
      }

      const matchNotificationsEnabled = targetUser.notificationSettings?.newMatches !== false;
      if (matchNotificationsEnabled) {
        await Notification.findOneAndUpdate(
          { recipient: targetUserId, sender: req.userId, type: "match", matchId: match._id },
          {
            $setOnInsert: {
              recipient: targetUserId,
              sender: req.userId,
              type: "match",
              title: "New Match! 🎉",
              message: `${currentUser?.name || "Someone"} matched with you!`,
              matchId: match._id,
            },
          },
          { upsert: true, new: true },
        ).catch((e) => console.warn("Match notification error:", e.message));
      }

      const io = req.app.get("io");
      if (io) {
        io.to(`user_${targetUserId}`).emit("new_match_event", {
          matchId: match._id,
          matchedUser: formatProfile(currentUser, targetUser),
        });
        io.to(`user_${req.userId}`).emit("new_match_event", {
          matchId: match._id,
          matchedUser: formatProfile(targetUser, currentUser),
        });
        if (matchNotificationsEnabled) {
          io.to(`user_${targetUserId}`).emit("new_notification", {
            type: "match",
            title: "New Match! 🎉",
            message: `${currentUser?.name || "Someone"} matched with you!`,
            matchId: match._id,
          });
        }
      }

      await logActivity(req.userId, "match_created", "discovery", "Matched with a HeartLink member", "success", {
        ip: req.ip || "",
        metadata: { matchId: match._id, targetUserId },
      });

      return res.json({
        success: true,
        isMatch: true,
        matchId: match._id,
        matchedUser: formatProfile(targetUser, currentUser),
      });
    }

    const likeNotificationsEnabled = targetUser.notificationSettings?.likes !== false;
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${targetUserId}`).emit("like_received", {
        type: likeType,
        senderId: req.userId,
      });
    }
    if (likeNotificationsEnabled) {
      await Notification.findOneAndUpdate(
        { recipient: targetUserId, sender: req.userId, type: likeType, referenceId: currentLike?._id },
        {
          $setOnInsert: {
            recipient: targetUserId,
            sender: req.userId,
            type: likeType,
            title: likeType === "superlike" ? "Someone sent you a spark" : "Someone likes you",
            message: `${currentUser?.name || "Someone"} liked your profile.`,
            referenceId: currentLike?._id,
          },
        },
        { upsert: true, new: true },
      ).catch((e) => console.warn("Like notification error:", e.message));

      io?.to(`user_${targetUserId}`).emit("new_notification", {
        type: likeType,
        title: likeType === "superlike" ? "Someone sent you a spark" : "Someone likes you",
        message: `${currentUser?.name || "Someone"} liked your profile.`,
      });
    }

    return res.json({
      success: true,
      isMatch: false,
    });
  } catch (error) {
    console.error("Swipe like error:", error.message);
    return res.status(500).json({ message: "Failed to record like." });
  }
};

exports.swipePass = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.body.targetUserId;

    if (!targetUserId || targetUserId === req.userId.toString()) {
      return res.status(400).json({ message: "Valid target user ID required." });
    }
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    await Like.findOneAndUpdate(
      { fromUser: req.userId, toUser: targetUserId },
      { type: "pass" },
      { upsert: true, returnDocument: "after" }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Swipe pass error:", error.message);
    return res.status(500).json({ message: "Failed to record pass." });
  }
};

exports.rewindSwipe = async (req, res) => {
  try {
    // Find the most recent 'pass' like by this user
    const lastPass = await Like.findOne({
      fromUser: req.userId,
      type: "pass",
    }).sort({ updatedAt: -1 });

    if (!lastPass) {
      return res
        .status(404)
        .json({ message: "No recent passed profiles to rewind." });
    }

    const targetUser = await User.findById(lastPass.toUser);
    await Like.findByIdAndDelete(lastPass._id);

    const currentUser = await User.findById(req.userId);

    return res.json({
      success: true,
      message: `Rewound ${targetUser?.name || "profile"}!`,
      profile: targetUser ? formatProfile(targetUser, currentUser) : null,
    });
  } catch (error) {
    console.error("Rewind error:", error.message);
    return res.status(500).json({ message: "Failed to rewind." });
  }
};

exports.resetPasses = async (req, res) => {
  try {
    // 1. Delete all passes
    const passResult = await Like.deleteMany({
      fromUser: req.userId,
      type: "pass",
    });

    // 2. Identify active mutual matches so existing chats remain intact
    const matches = await Match.find({ users: req.userId }).select("users");
    const matchedUserIds = matches
      .flatMap((m) => m.users.map((u) => u.toString()))
      .filter((id) => id !== req.userId.toString());

    // 3. Delete non-mutual likes/superlikes so user can rediscover profiles
    const likeResult = await Like.deleteMany({
      fromUser: req.userId,
      type: { $in: ["like", "superlike"] },
      toUser: { $nin: matchedUserIds },
    });

    const totalReset = (passResult.deletedCount || 0) + (likeResult.deletedCount || 0);

    return res.json({
      success: true,
      resetCount: totalReset,
      message:
        totalReset > 0
          ? `Reset ${totalReset} previous swipe${totalReset === 1 ? "" : "s"}. You can explore them again!`
          : "Deck refreshed! You can explore profiles again.",
    });
  } catch (error) {
    console.error("Reset passes error:", error.message);
    return res.status(500).json({ message: "Failed to reset passed profiles." });
  }
};

exports.distanceLabel = distanceLabel;
