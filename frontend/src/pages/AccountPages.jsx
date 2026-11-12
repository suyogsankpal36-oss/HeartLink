import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Ban,
  Bell,
  Check,
  CheckCheck,
  Crown,
  ImagePlus,
  KeyRound,
  Lock,
  MapPin,
  Plus,
  Shield,
  SlidersHorizontal,
  Star,
  Trash2,
  UserCheck,
} from "lucide-react";
import interestsCatalog from "../../../shared/interests.json";
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

  return (
    <AppShell
      title="Edit Profile"
      subtitle="Manage your gallery photos, bio, shared interests, prompts, and lifestyle details."
    >
      <PageTransition>
        {error && <ErrorNotice message={error} onRetry={loadMe} className="mb-6" />}
        {loading ? (
          <PageSpinner label="Loading profile editor..." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Gallery Column */}
            <div className="lg:col-span-5 space-y-5">
              <Card
                header={
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-base-content">
                      Photo Gallery ({form.photos.length}/6)
                    </span>
                    <Badge tone="neutral">GridFS Secured</Badge>
                  </div>
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                  {form.photos.map((url, idx) => {
                    const isPrimary = idx === 0 || url === form.profilePhoto;
                    return (
                      <div key={url} className="group relative aspect-square rounded-xl overflow-hidden border border-base-300 bg-base-200">
                        <img
                          src={resolvePhotoUrl(url)}
                          alt={`Gallery item ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {isPrimary && (
                          <span className="absolute top-2 left-2 rounded-md bg-indigo-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Primary
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/75 p-1.5 flex items-center justify-between gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {!isPrimary ? (
                            <button
                              type="button"
                              onClick={() => setAsPrimaryPhoto(url)}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-white bg-white/15 hover:bg-white/25 cursor-pointer"
                            >
                              <Star className="h-3 w-3" /> Cover
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300 px-1">Cover photo</span>
                          )}
                          <button
                            type="button"
                            aria-label="Remove photo"
                            onClick={() => deletePhoto(url)}
                            className="rounded p-1 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
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
                      className="aspect-square rounded-xl border-2 border-dashed border-base-300 hover:border-primary bg-base-200/50 flex flex-col items-center justify-center gap-2 text-center p-3 cursor-pointer transition-colors"
                    >
                      <ImagePlus className="h-5 w-5 hl-accent-text" />
                      <span className="text-xs font-medium text-base-content">
                        {uploadingPhoto ? "Uploading..." : "Add photo"}
                      </span>
                      <span className="text-[10px] hl-muted-text">JPG, PNG, WebP · max 5 MB</span>
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
              </Card>
            </div>

            {/* Profile Form Column */}
            <form onSubmit={handleSaveProfile} className="lg:col-span-7 space-y-6">
              <Card
                header={
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 hl-accent-text" />
                    <span className="text-sm font-semibold text-base-content">Identity &amp; Story</span>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      id="edit-name"
                      label="Display name"
                      required
                      maxLength={60}
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />
                    <Field
                      id="edit-city"
                      label="City"
                      maxLength={80}
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="e.g., Bengaluru, Mumbai, Austin"
                    />
                  </div>
                  <Select
                    id="edit-looking-for"
                    label="Looking for"
                    value={form.lookingFor}
                    onChange={(e) => setForm((p) => ({ ...p, lookingFor: e.target.value }))}
                    options={[
                      { value: "relationship", label: "Long-term relationship" },
                      { value: "friendship", label: "Meaningful friendship" },
                      { value: "casual", label: "Casual connection" },
                    ]}
                  />
                  <TextArea
                    id="edit-bio"
                    label="Bio"
                    rows={4}
                    maxLength={500}
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Share what matters to you, your work, or weekend pace..."
                  />
                </div>
              </Card>

              <Card
                header={
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-base-content">
                      Interests ({form.interests.length}/12)
                    </span>
                    <span className="text-xs hl-muted-text">Powers compatibility scoring</span>
                  </div>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {interestsCatalog.map((tag) => {
                    const active = form.interests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleInterest(tag)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? "border-primary bg-primary text-primary-content"
                            : "border-base-300 bg-base-200/60 text-base-content hover:border-primary/50"
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card
                header={
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-base-content">
                      Profile Prompts ({form.prompts.length}/3)
                    </span>
                    {form.prompts.length < 3 && (
                      <Button type="button" size="xs" variant="outline" onClick={addPrompt} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                        Add Prompt
                      </Button>
                    )}
                  </div>
                }
              >
                {form.prompts.length === 0 ? (
                  <p className="text-xs hl-muted-text">
                    Add up to 3 conversation starter prompts to help matches break the ice.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {form.prompts.map((prompt, idx) => (
                      <div key={idx} className="rounded-lg border hl-subtle-divider bg-base-200/40 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <select
                            aria-label={`Prompt ${idx + 1} question`}
                            value={prompt.question}
                            onChange={(e) =>
                              setForm((prev) => {
                                const next = [...prev.prompts];
                                next[idx] = { ...next[idx], question: e.target.value };
                                return { ...prev, prompts: next };
                              })
                            }
                            className="select select-bordered select-sm flex-1 bg-base-100 text-xs rounded-lg"
                          >
                            {PROMPT_SUGGESTIONS.map((q) => (
                              <option key={q} value={q}>
                                {q}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                prompts: prev.prompts.filter((_, pIdx) => pIdx !== idx),
                              }))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                        <TextArea
                          rows={2}
                          maxLength={400}
                          value={prompt.answer}
                          onChange={(e) =>
                            setForm((prev) => {
                              const next = [...prev.prompts];
                              next[idx] = { ...next[idx], answer: e.target.value };
                              return { ...prev, prompts: next };
                            })
                          }
                          placeholder="Write your answer..."
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card
                header={<span className="text-sm font-semibold text-base-content">Lifestyle Details</span>}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "education", label: "Education / Field", placeholder: "e.g., Product Design" },
                    { key: "workout", label: "Fitness cadence", placeholder: "e.g., Often, Active, Sometimes" },
                    { key: "pets", label: "Pets", placeholder: "e.g., Dog lover, Cat person" },
                    { key: "drinking", label: "Drinking", placeholder: "e.g., Socially, Never" },
                    { key: "smoking", label: "Smoking", placeholder: "e.g., Non-smoker" },
                    { key: "height", label: "Height", placeholder: "e.g., 5'9\" or 175 cm" },
                  ].map((field) => (
                    <Field
                      key={field.key}
                      label={field.label}
                      maxLength={60}
                      value={form.lifestyle[field.key] || ""}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          lifestyle: { ...prev.lifestyle, [field.key]: e.target.value },
                        }))
                      }
                    />
                  ))}
                </div>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" size="lg" loading={saving}>
                  Save Profile Changes
                </Button>
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

  const tabs = [
    { id: "privacy", label: "Privacy & Appearance", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Password & Sessions", icon: KeyRound },
    { id: "blocked", label: `Blocked (${blockedUsers.length})`, icon: Ban },
  ];

  return (
    <AppShell
      title="Settings"
      subtitle="Control privacy, notifications, blocked members, theme, and account security."
    >
      <PageTransition className="space-y-6">
        <div role="tablist" aria-label="Settings sections" className="flex flex-wrap gap-2 border-b hl-subtle-divider pb-3">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-primary-content"
                    : "border border-base-300 bg-base-100 hl-muted-text hover:text-base-content"
                }`}
              >
                <IconComp className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <PageSpinner label="Loading settings..." />
        ) : (
          <div className="max-w-3xl space-y-6">
            {activeTab === "privacy" && (
              <>
                <Card header={<span className="text-sm font-semibold">Theme &amp; Interface</span>}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-base-content">Color Theme</p>
                      <p className="text-xs hl-muted-text mt-0.5">
                        Switch between Clean Light, Obsidian Dark, or follow your OS preference.
                      </p>
                    </div>
                    <ThemeToggle showSystem />
                  </div>
                </Card>

                <Card header={<span className="text-sm font-semibold">Privacy Controls</span>}>
                  <div className="divide-y divide-base-300/60">
                    <ToggleSwitch
                      label="Show online presence"
                      description="Allow matched members to see when you are actively connected."
                      checked={settings.privacySettings.showOnlineStatus}
                      disabled={savingKey === "privacySettings.showOnlineStatus"}
                      onChange={(val) => updateSettingGroup("privacySettings", "showOnlineStatus", val)}
                    />
                    <ToggleSwitch
                      label="Send read receipts"
                      description="Let conversation participants see when messages have been read."
                      checked={settings.privacySettings.readReceipts}
                      disabled={savingKey === "privacySettings.readReceipts"}
                      onChange={(val) => updateSettingGroup("privacySettings", "readReceipts", val)}
                    />
                    <ToggleSwitch
                      label="Share approximate distance"
                      description="Use coarse distance brackets (Within X km) during discovery. Exact coordinates are never displayed."
                      checked={settings.privacySettings.shareApproximateLocation}
                      disabled={savingKey === "privacySettings.shareApproximateLocation"}
                      onChange={(val) =>
                        updateSettingGroup("privacySettings", "shareApproximateLocation", val)
                      }
                    />
                  </div>
                  {settings.privacySettings.shareApproximateLocation && (
                    <div className="mt-4 pt-3 border-t hl-subtle-divider flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs hl-muted-text">
                        {settings.hasApproximateLocation
                          ? "Approximate coordinates saved for distance filtering."
                          : "No coordinates set yet — city matching remains active."}
                      </span>
                      <Button size="xs" variant="outline" onClick={syncApproximateLocation} leftIcon={<MapPin className="h-3.5 w-3.5" />}>
                        Update Approximate Location
                      </Button>
                    </div>
                  )}
                </Card>

                <Card header={<span className="text-sm font-semibold text-error">Danger Zone</span>}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-base-content">Delete Account Permanently</p>
                      <p className="text-xs hl-muted-text mt-0.5">
                        Removes your profile, photos, likes, matches, messages, and active sessions irreversibly.
                      </p>
                    </div>
                    <Button variant="soft-danger" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
                      Delete Account
                    </Button>
                  </div>
                </Card>
              </>
            )}

            {activeTab === "notifications" && (
              <Card header={<span className="text-sm font-semibold">Alert Preferences</span>}>
                <div className="divide-y divide-base-300/60">
                  <ToggleSwitch
                    label="New mutual matches"
                    description="Receive an alert when a mutual match unlocks."
                    checked={settings.notificationSettings.newMatches}
                    disabled={savingKey === "notificationSettings.newMatches"}
                    onChange={(val) => updateSettingGroup("notificationSettings", "newMatches", val)}
                  />
                  <ToggleSwitch
                    label="Direct messages"
                    description="Notify on incoming messages when away from chat."
                    checked={settings.notificationSettings.messages}
                    disabled={savingKey === "notificationSettings.messages"}
                    onChange={(val) => updateSettingGroup("notificationSettings", "messages", val)}
                  />
                  <ToggleSwitch
                    label="Incoming likes & sparks"
                    description="Be notified when a member likes your profile."
                    checked={settings.notificationSettings.likes}
                    disabled={savingKey === "notificationSettings.likes"}
                    onChange={(val) => updateSettingGroup("notificationSettings", "likes", val)}
                  />
                  <ToggleSwitch
                    label="In-app notification sounds"
                    description="Play subtle feedback sounds for live alerts."
                    checked={settings.notificationSettings.sounds}
                    disabled={savingKey === "notificationSettings.sounds"}
                    onChange={(val) => updateSettingGroup("notificationSettings", "sounds", val)}
                  />
                </div>
              </Card>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <Card header={<span className="text-sm font-semibold">Session Overview</span>}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-base-content">Current Authenticated Session</span>
                      </div>
                      <p className="hl-muted-text">
                        Signed in as <span className="font-medium text-base-content">{user?.email}</span> · Provider:{" "}
                        <span className="uppercase">{user?.authProvider || "local"}</span>
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={logout}>
                      Sign out of this device
                    </Button>
                  </div>
                </Card>

                <Card header={<span className="text-sm font-semibold">Change Password</span>}>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Field
                      id="current-pw"
                      label="Current password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        id="new-pw"
                        label="New password"
                        type="password"
                        autoComplete="new-password"
                        required
                        hint="8–72 characters. Changing password revokes other refresh sessions."
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                      />
                      <Field
                        id="confirm-pw"
                        label="Confirm new password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={passwords.confirm}
                        onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" loading={passwordBusy}>
                        Update Password
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            )}

            {activeTab === "blocked" && (
              <Card
                header={<span className="text-sm font-semibold">Blocked Members</span>}
                noPadding
              >
                {blockedUsers.length === 0 ? (
                  <EmptyState
                    icon={Ban}
                    title="No blocked members"
                    description="Members you block will never see your profile, appear in discovery, or message you."
                  />
                ) : (
                  <div className="divide-y divide-base-300/60">
                    {blockedUsers.map((entry) => {
                      const blocked = entry.blockedUser || entry;
                      const id = blocked.id || blocked._id;
                      return (
                        <div key={id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar src={blocked.profilePhoto} name={blocked.name} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-base-content truncate">{blocked.name}</p>
                              <p className="text-xs hl-muted-text">Blocked profile</p>
                            </div>
                          </div>
                          <Button size="xs" variant="outline" onClick={() => handleUnblock(id)}>
                            Unblock
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}
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
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
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

  const visible =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <AppShell
      title="Notifications"
      subtitle="Real-time updates on mutual matches, incoming likes, and system alerts."
      actions={
        notifications.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllRead} leftIcon={<CheckCheck className="h-4 w-4" />}>
            Mark all read
          </Button>
        )
      }
    >
      <PageTransition className="space-y-5 max-w-3xl">
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant={filter === "all" ? "primary" : "outline"}
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </Button>
          <Button
            size="xs"
            variant={filter === "unread" ? "primary" : "outline"}
            onClick={() => setFilter("unread")}
          >
            Unread ({notifications.filter((n) => !n.read).length})
          </Button>
        </div>

        {error && <ErrorNotice message={error} onRetry={loadNotifications} />}

        {loading ? (
          <PageSpinner label="Loading notifications..." />
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState
              icon={Bell}
              title="All caught up"
              description="No notifications match this filter."
            />
          </Card>
        ) : (
          <Card noPadding>
            <div className="divide-y divide-base-300/60">
              {visible.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex items-start justify-between gap-4 ${
                    !item.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar src={item.sender?.profilePhoto} name={item.sender?.name || "HeartLink"} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-base-content">{item.title}</p>
                        {!item.read && <Badge tone="primary">New</Badge>}
                      </div>
                      <p className="text-xs hl-muted-text mt-0.5">{item.message}</p>
                      <time className="text-[11px] hl-muted-text mt-1 block">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                      </time>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.matchId && (
                      <Link to={`/messages/${item.matchId}`}>
                        <Button size="xs" variant="outline">Open Chat</Button>
                      </Link>
                    )}
                    {!item.read && (
                      <Button size="xs" variant="ghost" onClick={() => markRead(item.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
