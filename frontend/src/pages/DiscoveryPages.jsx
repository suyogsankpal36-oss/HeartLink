import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flag,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api, apiErrorMessage, resolvePhotoUrl } from "../services/api";
import { AppShell } from "../components/Layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorNotice,
  IconButton,
  Modal,
  PageSpinner,
  PageTransition,
  SearchBar,
  Select,
  TextArea,
} from "../components/ui";

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or abusive behavior" },
  { value: "fake_profile", label: "Fake profile or impersonation" },
  { value: "spam_or_scam", label: "Spam, solicitation, or scam" },
  { value: "inappropriate_photos", label: "Inappropriate photos or content" },
  { value: "underage", label: "Appears under 18 years old" },
  { value: "other", label: "Other safety concern" },
];

export function ReportDialog({ open, user: targetUser, onClose, onSubmitted }) {
  const [reason, setReason] = useState("harassment");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("harassment");
      setDetails("");
      setError("");
    }
  }, [open, targetUser?.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!targetUser) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/reports", {
        reportedUserId: targetUser.id || targetUser._id,
        reason,
        details: details.trim(),
      });
      toast.success(data.message || "Safety report submitted.");
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not submit safety report."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Report ${targetUser?.name || "Member"}`}
      subtitle="Our Trust & Safety moderation team reviews all member reports."
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="report-member-form" variant="danger" size="sm" loading={busy}>
            Submit Report
          </Button>
        </>
      }
    >
      <form id="report-member-form" onSubmit={submit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
            {error}
          </div>
        )}
        <Select
          id="report-reason"
          label="Reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={REPORT_REASONS}
        />
        <TextArea
          id="report-details"
          label="Additional context"
          hint="Optional details help moderators review faster (up to 500 characters)."
          maxLength={500}
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe what happened..."
        />
      </form>
    </Modal>
  );
}

function SwipeableDatingCard({
  profile,
  nextProfile,
  onPass,
  onLike,
  onSpark,
  onRewind,
  acting,
  onReport,
  onBlock,
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTapRef = useRef(0);

  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-16, 16]);
  const likeOpacity = useTransform(x, [20, 90], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -90], [0, 1]);

  useEffect(() => {
    setPhotoIndex(0);
    setShowDetails(false);
    x.set(0);
    controls.set({ x: 0, rotate: 0, opacity: 1, scale: 1 });
  }, [profile?.id, profile?._id, controls, x]);

  const photos = (
    Array.isArray(profile?.photos) && profile.photos.length > 0
      ? profile.photos
      : [profile?.profilePhoto]
  ).filter(Boolean);

  const currentUrl = photos[photoIndex] ? resolvePhotoUrl(photos[photoIndex]) : "";
  const nextPhotos = (
    Array.isArray(nextProfile?.photos) && nextProfile.photos.length > 0
      ? nextProfile.photos
      : [nextProfile?.profilePhoto]
  ).filter(Boolean);
  const nextUrl = nextPhotos[0] ? resolvePhotoUrl(nextPhotos[0]) : "";

  const triggerPass = useCallback(async () => {
    if (acting) return;
    await controls.start({
      x: -460,
      rotate: -20,
      opacity: 0,
      transition: { duration: 0.26, ease: "easeOut" },
    });
    onPass();
    x.set(0);
    controls.set({ x: 0, rotate: 0, opacity: 1, scale: 1 });
  }, [acting, controls, onPass, x]);

  const triggerLike = useCallback(async () => {
    if (acting) return;
    await controls.start({
      x: 460,
      rotate: 20,
      opacity: 0,
      transition: { duration: 0.26, ease: "easeOut" },
    });
    onLike();
    x.set(0);
    controls.set({ x: 0, rotate: 0, opacity: 1, scale: 1 });
  }, [acting, controls, onLike, x]);

  const handleDragEnd = async (_e, info) => {
    if (acting) return;
    if (info.offset.x > 105) {
      await controls.start({
        x: 460,
        rotate: 20,
        opacity: 0,
        transition: { duration: 0.22, ease: "easeOut" },
      });
      onLike();
      x.set(0);
      controls.set({ x: 0, rotate: 0, opacity: 1, scale: 1 });
    } else if (info.offset.x < -105) {
      await controls.start({
        x: -460,
        rotate: -20,
        opacity: 0,
        transition: { duration: 0.22, ease: "easeOut" },
      });
      onPass();
      x.set(0);
      controls.set({ x: 0, rotate: 0, opacity: 1, scale: 1 });
    }
  };

  const handleCardTap = (side, e) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      // Double tap detected!
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 900);
      triggerLike();
    } else {
      // Single tap -> photo navigation
      if (side === "left") {
        if (photos.length > 1) {
          setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
        }
      } else {
        if (photos.length > 1) {
          setPhotoIndex((prev) => (prev + 1) % photos.length);
        }
      }
    }
    lastTapRef.current = now;
  };

  // Keyboard navigation on Discover Deck
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName)) return;
      if (acting) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        triggerPass();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        triggerLike();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onSpark();
      } else if (e.key === "ArrowDown" || e.key === " " || e.key.toLowerCase() === "i") {
        e.preventDefault();
        setShowDetails((prev) => !prev);
      } else if (e.key.toLowerCase() === "z" || e.key === "Backspace") {
        e.preventDefault();
        onRewind();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [acting, onSpark, onRewind, triggerLike, triggerPass]);

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center">
      {/* Stack Container */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] select-none">
        {/* Next Card in Stack (Peeking Background) */}
        {nextProfile && (
          <div className="absolute inset-0 scale-[0.94] translate-y-3.5 rounded-3xl overflow-hidden border border-base-300 bg-base-200 pointer-events-none opacity-50 shadow-md">
            {nextUrl ? (
              <img src={nextUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Avatar name={nextProfile.name} size="2xl" />
              </div>
            )}
          </div>
        )}

        {/* Active Draggable Card */}
        <motion.div
          animate={controls}
          style={{ x, rotate }}
          drag={acting ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.65}
          onDragEnd={handleDragEnd}
          className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-rose-500/20 bg-base-100 cursor-grab active:cursor-grabbing"
        >
          {/* Double Tap Floating Heart Burst */}
          <AnimatePresence>
            {showDoubleTapHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.35, 1], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center"
              >
                <div className="rounded-full bg-rose-500/35 p-6 backdrop-blur-xs shadow-2xl border border-white/50 animate-pulse">
                  <Heart className="h-24 w-24 fill-rose-500 text-white drop-shadow-xl" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LIKE Stamp Overlay */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-6 z-30 pointer-events-none rounded-xl border-4 border-emerald-500 bg-emerald-500/25 px-4 py-1.5 -rotate-12 backdrop-blur-xs shadow-lg"
          >
            <span className="text-2xl font-black tracking-wider text-emerald-500 uppercase">LIKE</span>
          </motion.div>

          {/* NOPE Stamp Overlay */}
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 right-6 z-30 pointer-events-none rounded-xl border-4 border-rose-500 bg-rose-500/25 px-4 py-1.5 rotate-12 backdrop-blur-xs shadow-lg"
          >
            <span className="text-2xl font-black tracking-wider text-rose-500 uppercase">NOPE</span>
          </motion.div>

          {/* Photo */}
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={profile?.name || "Profile"}
              className="h-full w-full object-cover pointer-events-none"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 hl-muted-text">
              <Avatar name={profile?.name} size="2xl" />
              <span className="text-xs">No profile photos added</span>
            </div>
          )}

          {/* Instagram-style Photo Segment Bars */}
          {photos.length > 1 && (
            <div className="absolute top-3.5 inset-x-4 flex gap-1.5 z-20 pointer-events-none">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                    idx === photoIndex ? "bg-white shadow-sm" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Tap Zones for Next / Prev Photo and Double Tap */}
          <div
            className="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer"
            onClick={(e) => handleCardTap("left", e)}
            aria-label="Previous photo or double-tap to like"
          />
          <div
            className="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer"
            onClick={(e) => handleCardTap("right", e)}
            aria-label="Next photo or double-tap to like"
          />

          {/* Bottom Card Overlay */}
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent p-5 text-white pointer-events-none">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm truncate">
                    {profile?.name}
                    {profile?.age ? `, ${profile.age}` : ""}
                  </h2>
                  {profile?.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-xs shrink-0">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-rose-100/90 flex-wrap">
                  {profile?.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile.city}
                    </span>
                  )}
                  {profile?.distance && <span>{profile.distance}</span>}
                  {profile?.lookingFor && (
                    <span className="capitalize bg-white/15 px-2 py-0.5 rounded-md text-[11px] backdrop-blur-xs">
                      {profile.lookingFor}
                    </span>
                  )}
                </div>

                {profile?.bio && (
                  <p className="mt-2 text-xs text-slate-200 line-clamp-2 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>

              {profile?.compatibilityScore && (
                <div className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 px-3 py-1.5 text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wider text-rose-200 font-semibold">Match</p>
                  <p className="text-sm font-bold hl-tabular text-white">{profile.compatibilityScore}%</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Circular Action Controls */}
      <div className="flex items-center justify-center gap-3.5 sm:gap-4 py-5 w-full">
        {/* Rewind */}
        <button
          type="button"
          onClick={onRewind}
          disabled={acting}
          aria-label="Rewind last pass"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/30 bg-base-100 text-amber-500 shadow-md hover:scale-110 active:scale-90 hover:bg-amber-500/10 transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Pass (✕) */}
        <button
          type="button"
          onClick={triggerPass}
          disabled={acting}
          aria-label="Pass profile (Arrow Left)"
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-rose-500/25 bg-base-100 text-rose-500 shadow-xl hover:scale-110 active:scale-90 hover:bg-rose-500/10 transition-transform cursor-pointer disabled:opacity-40"
        >
          <X className="h-8 w-8 text-rose-500" strokeWidth={2.75} />
        </button>

        {/* Superlike / Spark (★) */}
        <button
          type="button"
          onClick={onSpark}
          disabled={acting}
          aria-label="Send Spark note (Arrow Up)"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-400/30 bg-base-100 text-sky-500 shadow-md hover:scale-110 active:scale-90 hover:bg-sky-500/10 transition-transform cursor-pointer disabled:opacity-40"
        >
          <Sparkles className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Like (♥) */}
        <button
          type="button"
          onClick={triggerLike}
          disabled={acting}
          aria-label="Like profile (Arrow Right or double-tap)"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 text-white shadow-2xl hover:scale-110 active:scale-90 shadow-rose-500/35 transition-transform cursor-pointer disabled:opacity-40"
        >
          <Heart className="h-8 w-8 fill-white text-white" strokeWidth={2} />
        </button>

        {/* Info Toggle */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          aria-label="Toggle profile details (Space)"
          className={`flex h-12 w-12 items-center justify-center rounded-full border border-base-300 bg-base-100 shadow-md hover:scale-110 active:scale-90 transition-transform cursor-pointer ${
            showDetails ? "text-primary border-primary/40 bg-primary/10" : "text-base-content/70 hover:text-base-content"
          }`}
        >
          <Info className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {/* Desktop Keyboard Hints Bar */}
      <div className="hidden sm:flex items-center justify-center gap-3.5 text-[11px] hl-muted-text pb-4 select-none">
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded-md border border-base-300 bg-base-200 font-mono text-[10px]">←</kbd> Pass
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded-md border border-base-300 bg-base-200 font-mono text-[10px]">↑</kbd> Spark
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded-md border border-base-300 bg-base-200 font-mono text-[10px]">→</kbd> Like
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded-md border border-base-300 bg-base-200 font-mono text-[10px]">Space</kbd> Details
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded-md border border-base-300 bg-base-200 font-mono text-[10px]">Z</kbd> Rewind
        </span>
      </div>

      {/* Expandable Hinge-style Profile Details */}
      {showDetails && (
        <div className="w-full space-y-4 pt-2">
          {/* Prompts Cards */}
          {profile.prompts?.length > 0 && (
            <div className="space-y-3">
              {profile.prompts.map((prompt, idx) => (
                <div key={idx} className="rounded-2xl border border-rose-500/15 bg-base-100 p-4 shadow-sm space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">{prompt.question}</p>
                  <p className="text-sm font-medium text-base-content leading-relaxed">{prompt.answer}</p>
                </div>
              ))}
            </div>
          )}

          {/* Interests Chips */}
          {profile.interests?.length > 0 && (
            <div className="rounded-2xl border hl-subtle-divider bg-base-100 p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider hl-muted-text">Passions &amp; Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((tag) => {
                  const isMutual = profile.mutualInterests?.includes(tag);
                  return (
                    <Badge key={tag} tone={isMutual ? "primary" : "neutral"} className="rounded-lg py-1 px-2.5 text-xs">
                      {isMutual && <Check className="h-3 w-3" />}
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lifestyle Grid */}
          {profile.lifestyle && Object.values(profile.lifestyle).some(Boolean) && (
            <div className="rounded-2xl border hl-subtle-divider bg-base-100 p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider hl-muted-text">Lifestyle</h3>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(profile.lifestyle)
                  .filter(([, val]) => Boolean(val))
                  .map(([key, val]) => (
                    <div key={key} className="rounded-xl border hl-subtle-divider bg-base-200/50 px-3 py-2">
                      <dt className="capitalize hl-muted-text">{key}</dt>
                      <dd className="font-semibold text-base-content mt-0.5">{val}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          )}

          {/* Safety Actions */}
          <div className="flex items-center justify-between pt-2 px-2 text-xs">
            <Link to={`/profile/${profile.id}`} className="font-semibold hl-accent-text hover:underline">
              View Full Profile →
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onReport(profile)}
                className="text-xs hl-muted-text hover:text-error transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Flag className="h-3.5 w-3.5" /> Report
              </button>
              <button
                type="button"
                onClick={onBlock}
                className="text-xs hl-muted-text hover:text-error transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Ban className="h-3.5 w-3.5" /> Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickFilterModal({ open, onClose, currentParams, onApply }) {
  const [distance, setDistance] = useState(Number(currentParams.get("distance")) || 50);
  const [minAge, setMinAge] = useState(Number(currentParams.get("minAge")) || 18);
  const [maxAge, setMaxAge] = useState(Number(currentParams.get("maxAge")) || 45);
  const [gender, setGender] = useState(currentParams.get("genderPreference") || "all");
  const [intent, setIntent] = useState(currentParams.get("lookingFor") || "all");

  useEffect(() => {
    if (open) {
      setDistance(Number(currentParams.get("distance")) || 50);
      setMinAge(Number(currentParams.get("minAge")) || 18);
      setMaxAge(Number(currentParams.get("maxAge")) || 45);
      setGender(currentParams.get("genderPreference") || "all");
      setIntent(currentParams.get("lookingFor") || "all");
    }
  }, [open, currentParams]);

  const handleSave = () => {
    onApply({
      distance: distance === 50 ? null : distance,
      minAge: minAge === 18 ? null : minAge,
      maxAge: maxAge === 45 ? null : maxAge,
      genderPreference: gender === "all" ? null : gender,
      lookingFor: intent === "all" ? null : intent,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Discovery Preferences 🎯"
      subtitle="Tune your feed to find matches that align with your lifestyle and goals."
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} leftIcon={<Check className="h-3.5 w-3.5" />}>
            Apply Preferences
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-1 text-xs">
        <div>
          <div className="flex justify-between font-semibold mb-1">
            <span>Maximum Distance</span>
            <span className="hl-accent-text font-bold">{distance} km</span>
          </div>
          <input
            type="range"
            min="5"
            max="150"
            step="5"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="range range-xs range-primary w-full"
          />
        </div>

        <div>
          <div className="flex justify-between font-semibold mb-1">
            <span>Age Range</span>
            <span className="hl-accent-text font-bold">{minAge} – {maxAge}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="18"
              max={maxAge}
              value={minAge}
              onChange={(e) => setMinAge(Math.max(18, Number(e.target.value)))}
              className="input input-bordered input-xs w-20 text-center"
            />
            <span className="hl-muted-text">to</span>
            <input
              type="number"
              min={minAge}
              max="75"
              value={maxAge}
              onChange={(e) => setMaxAge(Math.min(75, Number(e.target.value)))}
              className="input input-bordered input-xs w-20 text-center"
            />
            <span className="text-[11px] hl-muted-text">years old</span>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Interested in</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "all", label: "Everyone" },
              { id: "women", label: "Women" },
              { id: "men", label: "Men" },
              { id: "non-binary", label: "Non-binary" },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGender(g.id)}
                className={`py-1.5 px-2 rounded-lg text-center font-medium border text-[11px] transition-all cursor-pointer ${
                  gender === g.id
                    ? "border-primary bg-primary text-white shadow-xs"
                    : "border-base-300 bg-base-100 hover:border-primary/50 text-base-content"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Looking for</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "all", label: "Any" },
              { id: "relationship", label: "Long-term" },
              { id: "friendship", label: "Friends" },
              { id: "casual", label: "Casual" },
            ].map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setIntent(i.id)}
                className={`py-1.5 px-2 rounded-lg text-center font-medium border text-[11px] transition-all cursor-pointer ${
                  intent === i.id
                    ? "border-primary bg-primary text-white shadow-xs"
                    : "border-base-300 bg-base-100 hover:border-primary/50 text-base-content"
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function DiscoverPage() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const searchQuery = searchParams.get("search") || "";
  const lookingFor = searchParams.get("lookingFor") || "all";

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(searchParams.entries());
      const { data } = await api.get("/profiles", { params });
      setProfiles(data.profiles || []);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to load discovery profiles."));
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const currentProfile = profiles[0] || null;

  const advanceDeck = () => {
    setProfiles((prev) => prev.slice(1));
  };

  const handlePass = async () => {
    if (!currentProfile || acting) return;
    setActing(true);
    try {
      await api.post(`/likes/${currentProfile.id}/pass`);
      advanceDeck();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not pass profile."));
    } finally {
      setActing(false);
    }
  };

  const handleLike = async (type = "like", comment = "") => {
    if (!currentProfile || acting) return;
    setActing(true);
    try {
      const { data } = await api.post(`/likes/${currentProfile.id}`, {
        type,
        comment: comment.trim() || undefined,
      });
      setNoteOpen(false);
      setNoteText("");
      advanceDeck();
      refreshProfile?.();
      if (data.isMatch) {
        setMatchResult({ matchId: data.matchId, user: data.matchedUser || currentProfile });
      } else {
        toast.success(type === "superlike" ? `Spark sent to ${currentProfile.name}` : `Liked ${currentProfile.name}`);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not record like."));
    } finally {
      setActing(false);
    }
  };

  const handleRewind = async () => {
    if (acting) return;
    setActing(true);
    try {
      const { data } = await api.post("/profiles/rewind");
      toast.success(data.message || "Last pass rewound.");
      if (data.profile) {
        setProfiles((prev) => [data.profile, ...prev.filter((p) => p.id !== data.profile.id)]);
      } else {
        loadFeed();
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "No recent pass available to rewind."));
    } finally {
      setActing(false);
    }
  };

  const handleResetDeck = async () => {
    setActing(true);
    try {
      const { data } = await api.post("/profiles/reset");
      toast.success(data.message || "Discovery deck reset.");
      await loadFeed();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not reset discovery deck."));
    } finally {
      setActing(false);
    }
  };

  const handleBlock = async () => {
    if (!currentProfile) return;
    try {
      await api.post(`/blocks/${currentProfile.id}`);
      toast.success(`${currentProfile.name} blocked.`);
      advanceDeck();
      refreshProfile?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not block member."));
    }
  };

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const handleApplyPreferences = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined) next.delete(key);
      else next.set(key, String(val));
    });
    setSearchParams(next);
  };

  return (
    <AppShell
      title="Discover"
      subtitle="Find your spark. Like to connect, send a Spark note, or pass to see the next person."
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRewind}
            disabled={acting}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Rewind Pass
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(true)}
            leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          >
            Filters
          </Button>
        </>
      }
    >
      <PageTransition className="space-y-6">
        {/* Filter Bar */}
        <Card className="p-0" noPadding>
          <div className="p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={(e) => updateFilter("search", e.target.value)}
              onClear={() => updateFilter("search", "")}
              placeholder="Filter by name, city, bio, or interest..."
              label="Filter discovery profiles"
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <select
                aria-label="Relationship intent filter"
                value={lookingFor}
                onChange={(e) => updateFilter("lookingFor", e.target.value)}
                className="select select-bordered select-sm h-9 rounded-lg bg-base-100 border-base-300 text-xs"
              >
                <option value="all">All Intents</option>
                <option value="relationship">Relationship</option>
                <option value="friendship">Friendship</option>
                <option value="casual">Casual</option>
              </select>
              <span className="text-xs hl-muted-text hl-tabular whitespace-nowrap px-2">
                {profiles.length} remaining
              </span>
            </div>
          </div>
        </Card>

        {error && <ErrorNotice message={error} onRetry={loadFeed} />}

        {loading ? (
          <PageSpinner label="Curating compatible profiles..." />
        ) : !currentProfile ? (
          <Card>
            <EmptyState
              icon={Compass}
              title="You've reached the end of your current queue"
              description="Reset your previous passes or broaden your discovery preferences to see more members."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" onClick={handleResetDeck} loading={acting} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>
                    Reset Passes
                  </Button>
                  <Link to="/search">
                    <Button size="sm" variant="outline">Adjust Filters</Button>
                  </Link>
                </div>
              }
            />
          </Card>
        ) : (
          <SwipeableDatingCard
            profile={currentProfile}
            nextProfile={profiles[1] || null}
            onPass={handlePass}
            onLike={() => handleLike("like")}
            onSpark={() => setNoteOpen(true)}
            onRewind={handleRewind}
            acting={acting}
            onReport={(target) => setReportTarget(target)}
            onBlock={handleBlock}
          />
        )}
      </PageTransition>

      {/* Send Note / Spark Modal */}
      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title={`Send a Spark to ${currentProfile?.name || ""}`}
        subtitle="Include an optional opening note (up to 280 characters)."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={acting}
              onClick={() => handleLike("superlike", noteText)}
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            >
              Send Spark
            </Button>
          </>
        }
      >
        <TextArea
          id="spark-note"
          label="Opening note"
          maxLength={280}
          rows={3}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Mention something you both share..."
        />
      </Modal>

      {/* Mutual Match Celebration Modal */}
      <Modal
        open={Boolean(matchResult)}
        onClose={() => setMatchResult(null)}
        title="It's a Match! 💕"
        subtitle="Something beautiful might start here."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setMatchResult(null)}>
              Keep Discovering
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const mId = matchResult?.matchId;
                setMatchResult(null);
                navigate(`/messages/${mId}`);
              }}
              leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
            >
              Send Message
            </Button>
          </>
        }
      >
        {matchResult && (
          <div className="relative flex flex-col items-center text-center space-y-3.5 py-2 overflow-hidden">
            {/* Confetti Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(18)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: Math.sin(i * 0.7) * 130,
                    y: -100 + ((i % 5) * 50),
                    scale: [0, 1.2, 0.8],
                    rotate: i * 45,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`absolute top-1/2 left-1/2 h-2.5 w-2.5 rounded-full ${
                    ["bg-rose-500", "bg-pink-400", "bg-sky-400", "bg-amber-400", "bg-emerald-400", "bg-purple-500"][i % 6]
                  }`}
                />
              ))}
            </div>

            {/* Overlapping Avatars with Center Heart */}
            <div className="relative flex items-center justify-center pt-2">
              <div className="relative -mr-3 z-10 transition-transform hover:scale-105">
                <Avatar
                  src={user?.photos?.[0] || user?.profilePhoto}
                  name={user?.name || "You"}
                  size="2xl"
                  className="ring-4 ring-rose-500/40 shadow-xl"
                />
              </div>
              <div className="relative z-20 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg ring-4 ring-base-100 animate-pulse">
                <Heart className="h-5 w-5 fill-white" />
              </div>
              <div className="relative -ml-3 z-10 transition-transform hover:scale-105">
                <Avatar
                  src={matchResult.user?.photos?.[0] || matchResult.user?.profilePhoto}
                  name={matchResult.user?.name}
                  size="2xl"
                  verified={matchResult.user?.isVerified}
                  className="ring-4 ring-pink-500/40 shadow-xl"
                />
              </div>
            </div>

            <div>
              <p className="text-xl font-bold text-base-content">
                You and {matchResult.user?.name} liked each other!
              </p>
              <p className="text-xs hl-muted-text mt-1 max-w-xs mx-auto">
                The spark is mutual. Start the conversation with a fun opener below.
              </p>
            </div>

            {/* Icebreaker Suggestions */}
            <div className="w-full space-y-1.5 text-left pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider hl-muted-text text-center">
                Suggested Icebreakers
              </p>
              {[
                "Hey! Loved your profile, how's your week going? ✨",
                "We matched! What's your favorite spot in town? ☕",
                `Hi! Looks like we both love ${matchResult.user?.interests?.[0] || "great music"} 🙌`,
              ].map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const mId = matchResult?.matchId;
                    setMatchResult(null);
                    navigate(`/messages/${mId}?opener=${encodeURIComponent(promptText)}`);
                  }}
                  className="w-full text-xs rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 p-2.5 text-base-content transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <span className="line-clamp-1">{promptText}</span>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold ml-2 shrink-0">
                    Send →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <QuickFilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        currentParams={searchParams}
        onApply={handleApplyPreferences}
      />

      <ReportDialog
        open={Boolean(reportTarget)}
        user={reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </AppShell>
  );
}

function ProfilePhotoGallery({ profile }) {
  const photos = (
    Array.isArray(profile?.photos) && profile.photos.length > 0
      ? profile.photos
      : [profile?.profilePhoto]
  ).filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [profile?.id, profile?._id]);

  const currentUrl = photos[index] ? resolvePhotoUrl(photos[index]) : "";

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-md">
      {currentUrl ? (
        <img
          src={currentUrl}
          alt={profile?.name || "Member profile"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-2 hl-muted-text">
          <Avatar name={profile?.name} size="2xl" />
          <span className="text-xs">No profile photos added yet</span>
        </div>
      )}

      {photos.length > 1 && (
        <>
          <div className="absolute top-3 inset-x-3 flex gap-1.5 z-10">
            {photos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`View photo ${idx + 1}`}
                onClick={() => setIndex(idx)}
                className={`h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
                  idx === index ? "bg-white shadow-sm" : "bg-white/40 hover:bg-white/65"
                }`}
              />
            ))}
          </div>
          <div className="absolute inset-y-0 left-2 flex items-center">
            <IconButton
              label="Previous photo"
              size="sm"
              variant="dark"
              className="bg-slate-950/60 border-white/20 text-white hover:bg-slate-950/85"
              onClick={() => setIndex((prev) => (prev - 1 + photos.length) % photos.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
          </div>
          <div className="absolute inset-y-0 right-2 flex items-center">
            <IconButton
              label="Next photo"
              size="sm"
              variant="dark"
              className="bg-slate-950/60 border-white/20 text-white hover:bg-slate-950/85"
              onClick={() => setIndex((prev) => (prev + 1) % photos.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-5 text-white">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight">
                {profile?.name}
                {profile?.age ? `, ${profile.age}` : ""}
              </h2>
              {profile?.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-rose-100/90 flex-wrap">
              {profile?.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.city}
                </span>
              )}
              {profile?.distance && <span>{profile.distance}</span>}
            </div>
          </div>
          {profile?.compatibilityScore && (
            <div className="rounded-xl bg-white/20 backdrop-blur-md border border-white/25 px-3 py-1.5 text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-rose-200 font-medium">Chemistry</p>
              <p className="text-sm font-bold hl-tabular text-white">{profile.compatibilityScore}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/profiles/${profileId}`)
      .then(({ data }) => {
        if (active) {
          setProfile(data.user || data.profile || data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, "Profile unavailable."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profileId]);

  const handleLike = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/likes/${profileId}`, { type: "like" });
      refreshProfile?.();
      if (data.isMatch && data.matchId) {
        toast.success(`Matched with ${profile?.name}!`);
        navigate(`/messages/${data.matchId}`);
      } else {
        toast.success(`Liked ${profile?.name}`);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to like profile."));
    } finally {
      setBusy(false);
    }
  };

  const handleBlock = async () => {
    setBusy(true);
    try {
      await api.post(`/blocks/${profileId}`);
      toast.success("Member blocked.");
      refreshProfile?.();
      navigate("/discover");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not block member."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title={profile ? `${profile.name}${profile.age ? `, ${profile.age}` : ""}` : "Member Profile"}
      subtitle={profile?.city || "Profile details and compatibility"}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} leftIcon={<ChevronLeft className="h-4 w-4" />}>
          Back
        </Button>
      }
    >
      <PageTransition>
        {loading ? (
          <PageSpinner label="Loading member profile..." />
        ) : error ? (
          <ErrorNotice message={error} />
        ) : profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-4">
              <ProfilePhotoGallery profile={profile} />
              <Card noPadding className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportOpen(true)}
                    leftIcon={<Flag className="h-3.5 w-3.5" />}
                  >
                    Report
                  </Button>
                  <Button
                    variant="soft-danger"
                    size="sm"
                    disabled={busy}
                    onClick={handleBlock}
                    leftIcon={<Ban className="h-3.5 w-3.5" />}
                  >
                    Block
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={busy}
                    onClick={handleLike}
                    leftIcon={<Heart className="h-3.5 w-3.5" />}
                  >
                    Like
                  </Button>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-7 space-y-4">
              <Card>
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {profile.lookingFor && (
                      <Badge tone="primary" className="capitalize">
                        Looking for {profile.lookingFor}
                      </Badge>
                    )}
                    {profile.gender && <Badge tone="neutral" className="capitalize">{profile.gender}</Badge>}
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider hl-muted-text mb-1.5">
                      Bio
                    </h2>
                    <p className="text-sm text-base-content leading-relaxed">
                      {profile.bio || "No bio added yet."}
                    </p>
                  </div>
                  {profile.interests?.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-wider hl-muted-text mb-2">
                        Interests
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.prompts?.length > 0 && (
                    <div className="space-y-2.5">
                      <h2 className="text-xs font-semibold uppercase tracking-wider hl-muted-text">
                        Prompts
                      </h2>
                      {profile.prompts.map((p, idx) => (
                        <div key={idx} className="rounded-lg border hl-subtle-divider bg-base-200/50 p-3.5">
                          <p className="text-xs font-medium hl-accent-text">{p.question}</p>
                          <p className="text-sm text-base-content mt-1">{p.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </PageTransition>
      <ReportDialog open={reportOpen} user={profile} onClose={() => setReportOpen(false)} />
    </AppShell>
  );
}

export function LikesPage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadLikes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [recRes, sentRes] = await Promise.all([
        api.get("/likes/received"),
        api.get("/likes/sent"),
      ]);
      setReceived(recRes.data.likes || []);
      setSent(sentRes.data.likes || []);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to load likes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLikes();
    const sync = () => loadLikes();
    window.addEventListener("heartlink:likes_changed", sync);
    return () => window.removeEventListener("heartlink:likes_changed", sync);
  }, [loadLikes]);

  const likeBack = async (person) => {
    setBusyId(person.id);
    try {
      const { data } = await api.post(`/likes/${person.id}`, { type: "like" });
      refreshProfile?.();
      if (data.isMatch && data.matchId) {
        toast.success(`You matched with ${person.name}!`);
        navigate(`/messages/${data.matchId}`);
      } else {
        loadLikes();
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not connect."));
    } finally {
      setBusyId("");
    }
  };

  const passIncoming = async (person) => {
    setBusyId(person.id);
    try {
      await api.post(`/likes/${person.id}/pass`);
      setReceived((prev) => prev.filter((item) => item.id !== person.id));
      refreshProfile?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not pass profile."));
    } finally {
      setBusyId("");
    }
  };

  const withdrawSent = async (person) => {
    setBusyId(person.id);
    try {
      await api.delete(`/likes/${person.id}`);
      setSent((prev) => prev.filter((item) => item.id !== person.id));
      refreshProfile?.();
      toast.success("Like withdrawn");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not withdraw like."));
    } finally {
      setBusyId("");
    }
  };

  const items = tab === "received" ? received : sent;

  return (
    <AppShell
      title="Likes & Admirers"
      subtitle="See who liked your profile and match instantly, or check profiles you've swiped right on."
    >
      <PageTransition className="space-y-6">
        <div role="tablist" aria-label="Likes category" className="inline-flex rounded-xl border border-base-300 bg-base-100 p-1 shadow-xs">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "received"}
            onClick={() => setTab("received")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              tab === "received" ? "bg-primary text-primary-content shadow-xs" : "hl-muted-text hover:text-base-content"
            }`}
          >
            Liked You ({received.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "sent"}
            onClick={() => setTab("sent")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              tab === "sent" ? "bg-primary text-primary-content shadow-xs" : "hl-muted-text hover:text-base-content"
            }`}
          >
            Your Likes ({sent.length})
          </button>
        </div>

        {error && <ErrorNotice message={error} onRetry={loadLikes} />}

        {loading ? (
          <PageSpinner label="Loading likes..." />
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              icon={Heart}
              title={tab === "received" ? "No incoming likes yet" : "No pending sent likes"}
              description={
                tab === "received"
                  ? "Browse Discovery or refine your profile details to appear in more feeds."
                  : "Profiles you like in Discovery appear here until a match occurs."
              }
              action={
                <Link to="/discover">
                  <Button size="sm">Open Discovery</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((person) => (
              <Card key={person.id} variant="interactive" noPadding className="flex flex-col">
                <div className="relative aspect-[4/3] w-full bg-base-200 overflow-hidden">
                  {person.profilePhoto ? (
                    <img
                      src={resolvePhotoUrl(person.profilePhoto)}
                      alt={person.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Avatar name={person.name} size="xl" />
                    </div>
                  )}
                  {person.type === "superlike" && (
                    <div className="absolute top-3 left-3">
                      <Badge tone="purple">Spark</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Link to={`/profile/${person.id}`} className="text-sm font-semibold text-base-content hover:underline truncate">
                        {person.name}
                        {person.age ? `, ${person.age}` : ""}
                      </Link>
                      {person.isVerified && <ShieldCheck className="h-4 w-4 text-rose-500 shrink-0" />}
                    </div>
                    <p className="text-xs hl-muted-text mt-0.5 truncate">{person.city || "Nearby"}</p>
                    {person.bio && <p className="text-xs hl-muted-text mt-2 line-clamp-2">{person.bio}</p>}
                  </div>
                  {tab === "received" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === person.id}
                        onClick={() => passIncoming(person)}
                      >
                        Pass
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        loading={busyId === person.id}
                        onClick={() => likeBack(person)}
                        leftIcon={<Heart className="h-3.5 w-3.5 fill-white text-white" />}
                      >
                        Match
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${person.id}`} className="flex-1">
                        <Button size="sm" variant="outline" fullWidth>View Profile</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={busyId === person.id}
                        onClick={() => withdrawSent(person)}
                      >
                        Withdraw
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageTransition>
    </AppShell>
  );
}

export function MatchesPage() {
  const { refreshProfile } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unmatchTarget, setUnmatchTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/matches");
      setMatches(data.matches || []);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to load your matches."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
    const sync = () => loadMatches();
    window.addEventListener("heartlink:matches_changed", sync);
    window.addEventListener("heartlink:presence_update", sync);
    return () => {
      window.removeEventListener("heartlink:matches_changed", sync);
      window.removeEventListener("heartlink:presence_update", sync);
    };
  }, [loadMatches]);

  const confirmUnmatch = async () => {
    if (!unmatchTarget) return;
    setBusy(true);
    try {
      await api.delete(`/matches/${unmatchTarget.matchId}`);
      setMatches((prev) => prev.filter((item) => item.matchId !== unmatchTarget.matchId));
      refreshProfile?.();
      toast.success("Unmatched successfully.");
      setUnmatchTarget(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not unmatch."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title="Matches"
      subtitle="Your mutual connections. Start a chat, send a voice note, or plan your first date."
    >
      <PageTransition className="space-y-6">
        {error && <ErrorNotice message={error} onRetry={loadMatches} />}

        {loading ? (
          <PageSpinner label="Loading active matches..." />
        ) : matches.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title="No active matches yet"
              description="When you and another member both like each other, they appear here."
              action={
                <Link to="/discover">
                  <Button size="sm">Explore Discovery</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map((match) => {
              const user = match.matchedUser;
              if (!user) return null;
              return (
                <Card key={match.matchId} variant="interactive" className="flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={user.profilePhoto || user.photos?.[0]}
                        name={user.name}
                        size="lg"
                        online={user.online}
                        verified={user.isVerified}
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/profile/${user.id}`}
                          className="text-sm font-semibold text-base-content hover:underline truncate block"
                        >
                          {user.name}
                          {user.age ? `, ${user.age}` : ""}
                        </Link>
                        <p className="text-xs hl-muted-text truncate">
                          {user.online ? "Online now" : user.city || "Matched"}
                        </p>
                      </div>
                    </div>
                    {match.unreadCount > 0 && <Badge tone="primary">{match.unreadCount} unread</Badge>}
                  </div>

                  <p className="text-xs hl-muted-text rounded-lg border hl-subtle-divider bg-base-200/50 p-3 line-clamp-2">
                    {match.lastMessage?.text || "No messages yet — send an opening note."}
                  </p>

                  <div className="flex items-center gap-2">
                    <Link to={`/messages/${match.matchId}`} className="flex-1">
                      <Button size="sm" fullWidth leftIcon={<MessageSquare className="h-3.5 w-3.5" />}>
                        Open Chat
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUnmatchTarget(match)}
                    >
                      Unmatch
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageTransition>

      <ConfirmDialog
        open={Boolean(unmatchTarget)}
        title={`Unmatch ${unmatchTarget?.matchedUser?.name || "member"}?`}
        message="This will close your shared conversation channel and remove the match from both accounts."
        confirmLabel="Confirm Unmatch"
        loading={busy}
        onCancel={() => setUnmatchTarget(null)}
        onConfirm={confirmUnmatch}
      />
    </AppShell>
  );
}
