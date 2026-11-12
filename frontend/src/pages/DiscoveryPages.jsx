import { useCallback, useEffect, useState } from "react";
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
  MapPin,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
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

export function DiscoverPage() {
  const { refreshProfile } = useAuth();
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
          <Link to="/search">
            <Button variant="outline" size="sm" leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
              Filters
            </Button>
          </Link>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Card + Primary Controls */}
            <div className="lg:col-span-5 space-y-4">
              <ProfilePhotoGallery profile={currentProfile} />
              <Card noPadding className="p-3.5 shadow-md border-rose-500/15">
                <div className="grid grid-cols-3 gap-2.5">
                  <Button
                    variant="outline"
                    size="md"
                    disabled={acting}
                    onClick={handlePass}
                    className="hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 font-semibold"
                    leftIcon={<X className="h-4 w-4 text-rose-500" strokeWidth={2.5} />}
                  >
                    Pass
                  </Button>
                  <Button
                    variant="soft-primary"
                    size="md"
                    disabled={acting}
                    onClick={() => setNoteOpen(true)}
                    className="font-semibold"
                    leftIcon={<Sparkles className="h-4 w-4 text-amber-500" />}
                  >
                    Spark
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    loading={acting}
                    onClick={() => handleLike("like")}
                    className="font-bold shadow-md"
                    leftIcon={<Heart className="h-4 w-4 fill-white text-white" />}
                  >
                    Like
                  </Button>
                </div>
              </Card>
            </div>

            {/* Profile Detail Card */}
            <div className="lg:col-span-7 space-y-4">
              <Card
                header={
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone="primary" className="capitalize">
                        Looking for {currentProfile.lookingFor || "relationship"}
                      </Badge>
                      {currentProfile.mutualInterests?.length > 0 && (
                        <Badge tone="success">
                          {currentProfile.mutualInterests.length} shared interest
                          {currentProfile.mutualInterests.length === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link to={`/profile/${currentProfile.id}`}>
                        <Button size="xs" variant="ghost">Full Profile</Button>
                      </Link>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setReportTarget(currentProfile)}
                        leftIcon={<Flag className="h-3.5 w-3.5" />}
                      >
                        Report
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={handleBlock}
                        leftIcon={<Ban className="h-3.5 w-3.5" />}
                      >
                        Block
                      </Button>
                    </div>
                  </>
                }
              >
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider hl-muted-text mb-1.5">
                      About {currentProfile.name}
                    </h3>
                    <p className="text-sm text-base-content leading-relaxed">
                      {currentProfile.bio || "No bio shared yet."}
                    </p>
                  </div>

                  {currentProfile.interests?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider hl-muted-text mb-2">
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.interests.map((tag) => {
                          const isMutual = currentProfile.mutualInterests?.includes(tag);
                          return (
                            <Badge key={tag} tone={isMutual ? "primary" : "neutral"}>
                              {isMutual && <Check className="h-3 w-3" />}
                              {tag}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {currentProfile.prompts?.length > 0 && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider hl-muted-text">
                        Prompts
                      </h3>
                      {currentProfile.prompts.map((prompt, idx) => (
                        <div key={idx} className="rounded-lg border hl-subtle-divider bg-base-200/50 p-3.5">
                          <p className="text-xs font-medium hl-accent-text">{prompt.question}</p>
                          <p className="text-sm text-base-content mt-1">{prompt.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentProfile.lifestyle &&
                    Object.values(currentProfile.lifestyle).some(Boolean) && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider hl-muted-text mb-2">
                          Lifestyle
                        </h3>
                        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                          {Object.entries(currentProfile.lifestyle)
                            .filter(([, val]) => Boolean(val))
                            .map(([key, val]) => (
                              <div key={key} className="rounded-lg border hl-subtle-divider bg-base-200/40 px-3 py-2">
                                <dt className="capitalize hl-muted-text">{key}</dt>
                                <dd className="font-medium text-base-content mt-0.5">{val}</dd>
                              </div>
                            ))}
                        </dl>
                      </div>
                    )}
                </div>
              </Card>
            </div>
          </div>
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

      {/* Mutual Match Modal */}
      <Modal
        open={Boolean(matchResult)}
        onClose={() => setMatchResult(null)}
        title="It's a Mutual Match! 💕"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setMatchResult(null)}>
              Keep Swiping
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
          <div className="flex flex-col items-center text-center space-y-3 py-3">
            <div className="relative">
              <Avatar
                src={matchResult.user?.profilePhoto || matchResult.user?.photos?.[0]}
                name={matchResult.user?.name}
                size="2xl"
                verified={matchResult.user?.isVerified}
                className="ring-4 ring-rose-500/30"
              />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-md">
                <Heart className="h-4 w-4 fill-white" />
              </span>
            </div>
            <div>
              <p className="text-lg font-bold text-base-content">
                You and {matchResult.user?.name} liked each other!
              </p>
              <p className="text-xs hl-muted-text mt-1 max-w-xs mx-auto">
                The spark is mutual. Break the ice with a thoughtful message or fun question.
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ReportDialog
        open={Boolean(reportTarget)}
        user={reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </AppShell>
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
