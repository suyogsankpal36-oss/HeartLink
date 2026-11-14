import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Ban,
  Bell,
  Check,
  CheckCheck,
  Crown,
  EyeOff,
  Heart,
  ImagePlus,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Sun,
  Trash2,
  UserCheck,
} from "lucide-react";
import interestsCatalog from "../../../shared/interests.json";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
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
  Field,
  PageSpinner,
  PageTransition,
  Select,
  TextArea,
  ThemeToggle,
  ToggleSwitch,
} from "../components/ui";

const PROMPT_SUGGESTIONS = [
  "A Sunday morning with me usually looks like",
  "Two truths and a gentle exaggeration",
  "Something I value most in a conversation is",
  "A place I always love returning to",
  "The small habit that keeps my week balanced",
];

export function FiltersPage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    genderPreference: "all",
    minAge: 18,
    maxAge: 50,
    distance: 50,
    hideProfile: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/settings")
      .then(({ data }) => {
        if (!active) return;
        const prefs = data.discoveryPreferences || {};
        setForm({
          genderPreference: prefs.genderPreference || "all",
          minAge: Number(prefs.minAge || 18),
          maxAge: Number(prefs.maxAge || 50),
          distance: Number(prefs.distance || 50),
          hideProfile: Boolean(prefs.hideProfile),
        });
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, "Could not load discovery preferences."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async (goToDiscover = false) => {
    const minAge = Number(form.minAge);
    const maxAge = Number(form.maxAge);
    const distance = Number(form.distance);
    if (minAge < 18 || maxAge > 120 || minAge > maxAge) {
      toast.error("Age range must stay between 18 and 120 with minimum <= maximum.");
      return;
    }
    if (distance < 1 || distance > 500) {
      toast.error("Distance must be between 1 and 500 km.");
      return;
    }
    setSaving(true);
    try {
      await api.patch("/settings", {
        discoveryPreferences: {
          genderPreference: form.genderPreference,
          minAge,
          maxAge,
          distance,
          hideProfile: Boolean(form.hideProfile),
        },
      });
      await refreshProfile?.();
      toast.success("Discovery preferences saved");
      if (goToDiscover) navigate("/discover");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to update discovery filters."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Discovery Filters"
      subtitle="Fine-tune who appears in your feed and who can discover your profile."
    >
      <PageTransition>
        {error && <ErrorNotice message={error} className="mb-6" />}
        {loading ? (
          <PageSpinner label="Loading discovery filters..." />
        ) : (
          <div className="max-w-2xl space-y-6">
            <Card
              header={
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 hl-accent-text" />
                  <span className="text-sm font-semibold text-base-content">Audience &amp; Range</span>
                </div>
              }
            >
              <div className="space-y-5">
                <Select
                  id="filter-gender"
                  label="Show me"
                  value={form.genderPreference}
                  onChange={(e) => setForm((p) => ({ ...p, genderPreference: e.target.value }))}
                  options={[
                    { value: "all", label: "Everyone" },
                    { value: "female", label: "Women" },
                    { value: "male", label: "Men" },
                    { value: "non-binary", label: "Non-binary" },
                    { value: "other", label: "Other" },
                  ]}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    id="filter-min-age"
                    label="Minimum age"
                    type="number"
                    min={18}
                    max={120}
                    value={form.minAge}
                    onChange={(e) => setForm((p) => ({ ...p, minAge: e.target.value }))}
                  />
                  <Field
                    id="filter-max-age"
                    label="Maximum age"
                    type="number"
                    min={18}
                    max={120}
                    value={form.maxAge}
                    onChange={(e) => setForm((p) => ({ ...p, maxAge: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="filter-distance" className="font-medium text-base-content/90">
                      Maximum distance radius
                    </label>
                    <span className="font-semibold hl-accent-text hl-tabular">{form.distance} km</span>
                  </div>
                  <input
                    id="filter-distance"
                    type="range"
                    min={1}
                    max={500}
                    value={form.distance}
                    onChange={(e) => setForm((p) => ({ ...p, distance: Number(e.target.value) }))}
                    className="range range-primary range-sm w-full"
                  />
                  <div className="flex justify-between text-[11px] hl-muted-text hl-tabular">
                    <span>1 km</span>
                    <span>250 km</span>
                    <span>500 km</span>
                  </div>
                </div>

                <div className="border-t hl-subtle-divider pt-2">
                  <ToggleSwitch
                    id="filter-hide-profile"
                    label="Pause profile in discovery"
                    description="Hide your card from new people while keeping existing matches and chats active."
                    checked={form.hideProfile}
                    onChange={(checked) => setForm((p) => ({ ...p, hideProfile: checked }))}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <Button variant="outline" loading={saving} onClick={() => save(false)}>
                    Save Preferences
                  </Button>
                  <Button loading={saving} onClick={() => save(true)}>
                    Save &amp; Open Discover
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </PageTransition>
    </AppShell>
  );
}

export function EditProfilePage() {
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    city: "",
    bio: "",
    lookingFor: "relationship",
    interests: [],
    prompts: [],
    lifestyle: {
      zodiac: "",
      drinking: "",
      smoking: "",
      workout: "",
      pets: "",
      education: "",
      height: "",
    },
    photos: [],
    profilePhoto: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");

  const loadMe = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/profiles/me");
      const u = data.user || {};
      setForm({
        name: u.name || "",
        city: u.city || "",
        bio: u.bio || "",
        lookingFor: u.lookingFor || "relationship",
        interests: Array.isArray(u.interests) ? u.interests : [],
        prompts: Array.isArray(u.prompts) ? u.prompts : [],
        lifestyle: {
          zodiac: u.lifestyle?.zodiac || "",
          drinking: u.lifestyle?.drinking || "",
          smoking: u.lifestyle?.smoking || "",
          workout: u.lifestyle?.workout || "",
          pets: u.lifestyle?.pets || "",
          education: u.lifestyle?.education || "",
          height: u.lifestyle?.height || "",
        },
        photos: Array.isArray(u.photos) ? u.photos : [],
        profilePhoto: u.profilePhoto || "",
      });
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to load profile editor."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const cleanPrompts = form.prompts.filter((p) => p.question?.trim() && p.answer?.trim()).slice(0, 3);
      const { data } = await api.patch("/profiles/me", {
        name: form.name.trim(),
        city: form.city.trim(),
        bio: form.bio.trim(),
        lookingFor: form.lookingFor,
        interests: form.interests,
        prompts: cleanPrompts,
        lifestyle: form.lifestyle,
      });
      if (data.user) {
        setForm((prev) => ({
          ...prev,
          photos: data.user.photos || prev.photos,
          profilePhoto: data.user.profilePhoto || prev.profilePhoto,
        }));
      }
      await refreshProfile?.();
      toast.success("Profile changes saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update profile."));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be 5 MB or smaller.");
      return;
    }
    if (form.photos.length >= 6) {
      toast.error("Maximum 6 photos allowed.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const { data } = await api.post("/profiles/me/photos", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({
        ...prev,
        photos: data.user?.photos || prev.photos,
        profilePhoto: data.user?.profilePhoto || prev.profilePhoto,
      }));
      await refreshProfile?.();
      toast.success("Photo added to your profile gallery");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Photo upload failed."));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const setAsPrimaryPhoto = async (photoUrl) => {
    const reordered = [photoUrl, ...form.photos.filter((p) => p !== photoUrl)];
    try {
      const { data } = await api.patch("/profiles/me", {
        photos: reordered,
        profilePhoto: photoUrl,
      });
      setForm((prev) => ({
        ...prev,
        photos: data.user?.photos || reordered,
        profilePhoto: data.user?.profilePhoto || photoUrl,
      }));
      await refreshProfile?.();
      toast.success("Primary cover photo updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not reorder gallery."));
    }
  };

  const deletePhoto = async (photoUrl) => {
    try {
      const filename = photoUrl.split("/").pop() || photoUrl;
      const { data } = await api.delete(`/profiles/me/photos/${encodeURIComponent(filename)}`);
      setForm((prev) => ({
        ...prev,
        photos: data.user?.photos || prev.photos.filter((p) => p !== photoUrl),
        profilePhoto: data.user?.profilePhoto || "",
      }));
      await refreshProfile?.();
      toast.success("Photo deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete photo."));
    }
  };

  const toggleInterest = (tag) => {
    setForm((prev) => {
      const exists = prev.interests.includes(tag);
      if (exists) return { ...prev, interests: prev.interests.filter((t) => t !== tag) };
      if (prev.interests.length >= 12) {
        toast.error("Select up to 12 interests.");
        return prev;
      }
      return { ...prev, interests: [...prev.interests, tag] };
    });
  };

  const addPrompt = () => {
    if (form.prompts.length >= 3) return;
    const unused =
      PROMPT_SUGGESTIONS.find((q) => !form.prompts.some((p) => p.question === q)) ||
      PROMPT_SUGGESTIONS[0];
    setForm((prev) => ({
      ...prev,
      prompts: [...prev.prompts, { question: unused, answer: "" }],
    }));
  };

  const primaryPhoto = form.profilePhoto || form.photos[0];

  return (
    <AppShell>
      <PageTransition className="space-y-8 max-w-6xl mx-auto w-full">
        {error && <ErrorNotice message={error} onRetry={loadMe} className="mb-6" />}
        {loading ? (
          <PageSpinner label="Loading profile editor..." />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left Column: Discover Preview Card matching 13-profile.png */}
            <div className="w-full lg:w-[320px] shrink-0 space-y-3">
              <div className="rounded-[32px] overflow-hidden shadow-xl border border-rose-100 dark:border-gray-800 bg-white dark:bg-gray-800 aspect-[4/5] relative">
                {primaryPhoto ? (
                  <img
                    src={resolvePhotoUrl(primaryPhoto)}
                    alt={form.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-rose-50 dark:bg-gray-900">
                    <Avatar name={form.name || "You"} size="2xl" />
                  </div>
                )}
                {/* Bottom gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 text-white z-10">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-xl sm:text-2xl drop-shadow-sm truncate">
                      {form.name || "Aarav Sharma"}, {user?.age || "28"}
                    </h3>
                    <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
                  </div>
                  <p className="text-xs text-gray-200 mt-1 flex items-center gap-1.5 truncate">
                    <span>💼</span>
                    <span>{form.lifestyle?.education || "Product Designer"}</span>
                  </p>
                  <p className="text-xs text-gray-200 mt-0.5 flex items-center gap-1.5 truncate">
                    <span>📍</span>
                    <span>{form.city || "Nagpur"}</span>
                  </p>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                This is how others see you in Discover.
              </p>
            </div>

            {/* Right Column: Photos & About Me Forms matching 13-profile.png */}
            <form onSubmit={handleSaveProfile} className="flex-1 w-full space-y-6">
              {/* Card 1: My photos */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-rose-100/70 dark:border-gray-700/80 p-6 sm:p-8 shadow-xs space-y-5">
                <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">My photos</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {form.photos.map((url, idx) => {
                    const isPrimary = idx === 0 || url === form.profilePhoto;
                    return (
                      <div
                        key={url}
                        className="group relative aspect-[4/5] rounded-3xl overflow-hidden border border-rose-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shadow-xs"
                      >
                        <img
                          src={resolvePhotoUrl(url)}
                          alt={`Gallery photo ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {isPrimary && (
                          <span className="absolute top-3 left-3 rounded-full bg-[#E61E50] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                            ★ Main
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/75 p-2 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => setAsPrimaryPhoto(url)}
                              className="text-[10px] font-semibold text-white bg-white/20 hover:bg-white/30 rounded-full px-2 py-1 cursor-pointer"
                            >
                              Set Main
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label="Remove photo"
                            onClick={() => deletePhoto(url)}
                            className="p-1 rounded-full text-rose-300 hover:text-white hover:bg-rose-600/40 cursor-pointer ml-auto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {form.photos.length < 6 && (
                    <label
                      htmlFor="profile-photo-upload"
                      className="aspect-[4/5] rounded-3xl border-2 border-dashed border-rose-300 dark:border-rose-800/60 bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/70 flex flex-col items-center justify-center gap-2 text-center p-4 cursor-pointer transition-colors"
                    >
                      <Plus className="h-6 w-6 text-[#E61E50]" />
                      <span className="text-xs font-semibold text-[#E61E50]">
                        {uploadingPhoto ? "Uploading..." : "Add photo"}
                      </span>
                      <input
                        id="profile-photo-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingPhoto}
                        onChange={handlePhotoUpload}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-1 flex items-center gap-1.5">
                  <span>📷</span>
                  <span>JPG, PNG or WebP, up to 5 MB each. Add at least one clear photo of yourself.</span>
                </p>
              </div>

              {/* Card 2: About me */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-rose-100/70 dark:border-gray-700/80 p-6 sm:p-8 shadow-xs space-y-6">
                <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">About me</h2>

                <div className="space-y-4">
                  {/* Name & Date of birth */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">First name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E61E50]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Date of birth</label>
                      <input
                        type="text"
                        disabled
                        value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "01/03/1998"}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Job title & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Job title</label>
                      <input
                        type="text"
                        placeholder="Product Designer"
                        value={form.lifestyle?.education || ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            lifestyle: { ...p.lifestyle, education: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E61E50]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">City</label>
                      <input
                        type="text"
                        placeholder="Nagpur"
                        value={form.city}
                        onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E61E50]"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Bio</label>
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={form.bio}
                      onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Coffee snob, weekend trekker and part-time chef. Looking for someone to explore new cafes with."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E61E50] resize-none"
                    />
                    <div className="flex justify-end">
                      <span className="text-[10px] text-gray-400">{form.bio.length}/500</span>
                    </div>
                  </div>

                  {/* I am a segmented pills */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">I am a</label>
                    <div className="flex items-center gap-2">
                      {[
                        { value: "male", label: "Man" },
                        { value: "female", label: "Woman" },
                        { value: "other", label: "Other" },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, gender: item.value }))}
                          className={`px-6 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            (user?.gender === item.value || form.gender === item.value)
                              ? "bg-[#E61E50] text-white shadow-sm"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show me segmented pills */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Show me</label>
                    <div className="flex items-center gap-2">
                      {[
                        { value: "men", label: "Men" },
                        { value: "women", label: "Women" },
                        { value: "everyone", label: "Everyone else" },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, showMe: item.value }))}
                          className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            (form.showMe === item.value || (!form.showMe && item.value === "women"))
                              ? "bg-[#E61E50] text-white shadow-sm"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interests tags with checkmarks */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Interests</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Travel", "Coffee", "Music", "Movies", "Books", "Hiking",
                        "Cooking", "Photography", "Fitness", "Yoga", "Dancing", "Art",
                        "Gaming", "Cricket", "Football", "Food", "Wine", "Dogs",
                        "Cats", "Tech", "Startups", "Podcasts", "Writing", "Nature",
                        "Running", "Fashion", "Anime", "Chai", "Board games", "Road trips"
                      ].map((tag) => {
                        const active = form.interests.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleInterest(tag)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                              active
                                ? "bg-[#E61E50] text-white shadow-sm"
                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-rose-300"
                            }`}
                          >
                            {active && <Check className="h-3 w-3" />}
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Location status row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-rose-100 dark:border-gray-700 bg-rose-50/40 dark:bg-gray-850 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-[#E61E50] shrink-0">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Location is set</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Optional. Used only to show people nearby. Others only see a rounded distance, never your position.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toast.success("Location refreshed.")}
                      className="px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Save button bottom right */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#E61E50] hover:bg-[#D01845] active:bg-[#B9143C] text-white text-sm font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </PageTransition>
    </AppShell>
  );
}

export function SettingsPage() {
  const { user, logout, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("privacy");
  const [settings, setSettings] = useState({
    notificationSettings: { newMatches: true, messages: true, likes: true, sounds: true },
    privacySettings: { showOnlineStatus: true, readReceipts: true, shareApproximateLocation: true },
    hasApproximateLocation: false,
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, blocksRes] = await Promise.all([api.get("/settings"), api.get("/blocks")]);
      setSettings({
        notificationSettings: settingsRes.data.notificationSettings || {},
        privacySettings: settingsRes.data.privacySettings || {},
        hasApproximateLocation: Boolean(settingsRes.data.hasApproximateLocation),
      });
      setBlockedUsers(blocksRes.data.blockedUsers || []);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to load account settings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettingGroup = async (group, key, value) => {
    setSavingKey(`${group}.${key}`);
    const previous = settings[group];
    setSettings((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
    try {
      const { data } = await api.patch("/settings", { [group]: { [key]: value } });
      setSettings((prev) => ({
        ...prev,
        notificationSettings: data.notificationSettings || prev.notificationSettings,
        privacySettings: data.privacySettings || prev.privacySettings,
        hasApproximateLocation: Boolean(data.hasApproximateLocation),
      }));
      toast.success("Preference updated");
    } catch (err) {
      setSettings((prev) => ({ ...prev, [group]: previous }));
      toast.error(apiErrorMessage(err, "Could not update preference."));
    } finally {
      setSavingKey("");
    }
  };

  const syncApproximateLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Browser geolocation is unavailable.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.patch("/profiles/me", {
            location: { coordinates: [pos.coords.longitude, pos.coords.latitude] },
          });
          setSettings((prev) => ({ ...prev, hasApproximateLocation: true }));
          toast.success("Approximate coordinates updated");
        } catch (err) {
          toast.error(apiErrorMessage(err, "Could not update location."));
        }
      },
      () => toast.error("Location permission was denied."),
    );
  };

  const handleUnblock = async (targetId) => {
    try {
      await api.delete(`/blocks/${targetId}`);
      setBlockedUsers((prev) => prev.filter((item) => (item.id || item._id) !== targetId));
      refreshProfile?.();
      toast.success("Member unblocked");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not unblock member."));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    try {
      const { data } = await api.post("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success(data.message || "Password updated. Other active sessions were revoked.");
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not change password."));
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/auth/delete-account");
      toast.success("Account permanently deleted.");
      await logout();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to delete account."));
      setDeleting(false);
    }
  };

  const [savingPreferences, setSavingPreferences] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSaveDiscoveryPreferences = async () => {
    setSavingPreferences(true);
    try {
      await api.patch("/profiles/me", {
        discoveryPreferences: {
          minAge: 21,
          maxAge: 40,
          distance: 50,
        },
      });
      await refreshProfile?.();
      toast.success("Discovery preferences saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save preferences."));
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <AppShell>
      <PageTransition className="space-y-8 max-w-3xl mx-auto w-full">
        {/* Header matching 14-settings.png */}
        <div className="pb-2">
          <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>

        {loading ? (
          <PageSpinner label="Loading settings..." />
        ) : (
          <div className="space-y-6">
            {/* Card 1: Discovery preferences matching 14-settings.png */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-rose-100/70 dark:border-gray-700/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">Discovery preferences</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Who you see in Discover by default.</p>
              </div>

              <div className="space-y-5">
                {/* Min Age Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700 dark:text-gray-300">Minimum age</span>
                    <span className="text-[#E61E50]">21</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="80"
                    defaultValue="21"
                    className="w-full accent-[#E61E50] h-2 bg-rose-100 dark:bg-gray-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Max Age Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700 dark:text-gray-300">Maximum age</span>
                    <span className="text-[#E61E50]">40</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="80"
                    defaultValue="40"
                    className="w-full accent-[#E61E50] h-2 bg-rose-100 dark:bg-gray-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Max Distance Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700 dark:text-gray-300">Maximum distance</span>
                    <span className="text-[#E61E50]">50 km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    defaultValue="50"
                    className="w-full accent-[#E61E50] h-2 bg-rose-100 dark:bg-gray-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Location row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-rose-100 dark:border-gray-700 bg-rose-50/40 dark:bg-gray-850">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-[#E61E50] shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Location is set</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Optional. Used only to show people nearby. Others only see a rounded distance, never your position.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={syncApproximateLocation}
                    className="px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveDiscoveryPreferences}
                  disabled={savingPreferences}
                  className="px-6 py-2.5 rounded-full bg-[#E61E50] hover:bg-[#D01845] text-white text-xs font-semibold shadow-md shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingPreferences ? "Saving..." : "Save preferences"}
                </button>
              </div>
            </div>

            {/* Card 2: Appearance & visibility matching 14-settings.png */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-rose-100/70 dark:border-gray-700/80 p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">Appearance &amp; visibility</h2>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {/* Dark mode toggle */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 dark:text-gray-500">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">Dark mode</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Easier on the eyes at night</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={theme === "dark"}
                      onChange={toggleTheme}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E61E50]"></div>
                  </label>
                </div>

                {/* Pause profile toggle */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 dark:text-gray-500">
                      <EyeOff className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">Pause my profile</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        Hide yourself from Discover. Existing matches stay.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.privacySettings.paused)}
                      disabled={savingKey === "privacySettings.paused"}
                      onChange={(e) => updateSettingGroup("privacySettings", "paused", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E61E50]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Card 3: Blocked members matching 14-settings.png */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-rose-100/70 dark:border-gray-700/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">Blocked members</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Blocked members cannot see or contact you.</p>
              </div>

              {blockedUsers.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 py-2 flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  <span>You have not blocked anyone.</span>
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {blockedUsers.map((entry) => {
                    const blocked = entry.blockedUser || entry;
                    const id = blocked.id || blocked._id;
                    return (
                      <div key={id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={blocked.profilePhoto} name={blocked.name} size="xs" />
                          <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {blocked.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnblock(id)}
                          className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 cursor-pointer"
                        >
                          Unblock
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 4: Account matching 14-settings.png */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-rose-100/70 dark:border-gray-700/80 p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">Account</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Signed in as <span className="font-semibold text-gray-800 dark:text-gray-200">{user?.email}</span> via e-mail.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log out</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Change password</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-300 dark:border-rose-800 bg-white dark:bg-gray-800 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-xs cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  <span>Delete account</span>
                </button>
              </div>

              {/* Collapsible Change Password Box */}
              {showPasswordChange && (
                <form onSubmit={handleChangePassword} className="mt-4 p-4 rounded-2xl bg-rose-50/50 dark:bg-gray-850 border border-rose-100 dark:border-gray-700 space-y-3">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Change Account Password</p>
                  <input
                    type="password"
                    placeholder="Current password"
                    required
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="password"
                      placeholder="New password (8+ chars)"
                      required
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      required
                      value={passwords.confirm}
                      onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(false)}
                      className="px-3 py-1.5 rounded-full text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={passwordBusy}
                      className="px-4 py-1.5 rounded-full bg-[#E61E50] text-white text-xs font-semibold hover:bg-[#D01845] cursor-pointer"
                    >
                      {passwordBusy ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </PageTransition>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Permanently delete your account?"
        message="This action cannot be undone. All messages, matches, profile data, and uploaded photos will be permanently deleted."
        confirmLabel="Yes, Delete Forever"
        loading={deleting}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </AppShell>
  );
}

export function NotificationsPage() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to load notifications."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const sync = () => loadNotifications();
    window.addEventListener("heartlink:notifications_changed", sync);
    return () => window.removeEventListener("heartlink:notifications_changed", sync);
  }, [loadNotifications]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      refreshProfile?.();
    } catch {
      // ignore transient error
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshProfile?.();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not mark all read."));
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "just now";
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getNotificationIcon = (item) => {
    const type = item.type || "";
    const title = item.title || "";
    if (type.includes("like") || type.includes("match") || title.toLowerCase().includes("liked") || title.toLowerCase().includes("match")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#E61E50]">
          <Heart className="h-5 w-5" />
        </div>
      );
    }
    if (type.includes("message") || type.includes("chat") || title.toLowerCase().includes("message") || item.matchId) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-500">
          <MessageSquare className="h-5 w-5" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500">
        <ShieldCheck className="h-5 w-5" />
      </div>
    );
  };

  return (
    <AppShell>
      <PageTransition className="space-y-6 max-w-2xl mx-auto w-full">
        {/* Header matching 12-notifications.png */}
        <div className="flex items-center justify-between pb-2">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Matches, messages and safety updates</p>
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-xs cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {error && <ErrorNotice message={error} onRetry={loadNotifications} />}

        {loading ? (
          <PageSpinner label="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={Bell}
              title="No notifications yet"
              description="You will be notified here when you get new likes, matches, or messages."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.read) markRead(item.id);
                  if (item.matchId) navigate(`/messages/${item.matchId}`);
                }}
                className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
                  !item.read
                    ? "bg-white dark:bg-gray-800 border-rose-200/80 dark:border-rose-900/40"
                    : "bg-white/70 dark:bg-gray-800/60 border-rose-100/50 dark:border-gray-700/60 opacity-90"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {getNotificationIcon(item)}
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {item.title || item.message}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </div>

                {!item.read && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E61E50] shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </PageTransition>
    </AppShell>
  );
}

export function PremiumPage() {
  const [plansData, setPlansData] = useState({ currency: "INR", plans: [], paymentEnabled: false });
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/subscriptions/plans"), api.get("/subscriptions/me")])
      .then(([plansRes, subRes]) => {
        setPlansData(plansRes.data || { currency: "INR", plans: [], paymentEnabled: false });
        setSubscription(subRes.data?.subscription || null);
      })
      .catch((err) => setError(apiErrorMessage(err, "Unable to fetch membership catalog.")))
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (amountMinor, currency) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "INR",
        maximumFractionDigits: 0,
      }).format((amountMinor || 0) / 100);
    } catch {
      return `${currency} ${((amountMinor || 0) / 100).toFixed(0)}`;
    }
  };

  return (
    <AppShell
      title="HeartLink Premium"
      subtitle="Elevate your dating experience. See who likes you, send unlimited sparks, and rewind any pass."
    >
      <PageTransition className="space-y-6 max-w-4xl">
        {error && <ErrorNotice message={error} />}
        {loading ? (
          <PageSpinner label="Loading membership details..." />
        ) : (
          <>
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 hl-accent-text border border-primary/20">
                    <Crown className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-base-content">
                      Current Status:{" "}
                      <span className="capitalize">
                        {subscription ? `${subscription.plan} (${subscription.status})` : "Standard Free Member"}
                      </span>
                    </h2>
                    <p className="text-xs hl-muted-text mt-0.5">
                      {plansData.paymentEnabled
                        ? "Online plan upgrades are enabled."
                        : "Core discovery, matching, and real-time messaging are open. Paid checkout is disabled in this environment."}
                    </p>
                  </div>
                </div>
                <Badge tone={plansData.paymentEnabled ? "success" : "neutral"}>
                  {plansData.paymentEnabled ? "Checkout Ready" : "Preview Catalog"}
                </Badge>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(plansData.plans || []).map((plan) => (
                <Card key={plan.id} variant={plan.id === "annual" ? "elevated" : "default"} className="flex flex-col justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider hl-accent-text">
                        {plan.label}
                      </span>
                      {plan.id === "annual" && <Badge tone="purple">Best Value</Badge>}
                    </div>
                    <p className="text-2xl font-semibold text-base-content hl-tabular">
                      {formatMoney(plan.amountMinor, plansData.currency)}
                    </p>
                    <p className="text-xs hl-muted-text">{plan.note}</p>
                  </div>
                  <Button
                    variant={plan.id === "annual" ? "primary" : "outline"}
                    size="sm"
                    disabled={!plansData.paymentEnabled}
                  >
                    {plansData.paymentEnabled ? "Select Plan" : "Checkout Unavailable"}
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}
      </PageTransition>
    </AppShell>
  );
}
