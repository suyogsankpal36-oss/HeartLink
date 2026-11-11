import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { api, apiErrorMessage, resolvePhotoUrl } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useRemote } from "../hooks/useRemote.js";
import { Avatar, Button, ConfirmDialog, EmptyState, ErrorNotice, Field, Icon, PageHeading, PageSpinner } from "../components/ui.jsx";
import interestsCatalog from "../../../shared/interests.json";

const defaultPreferences = { genderPreference: "all", minAge: 18, maxAge: 50, distance: 50, hideProfile: false };
const defaultNotifications = { newMatches: true, messages: true, likes: true, sounds: true };
const defaultPrivacy = { showOnlineStatus: true, readReceipts: true, shareApproximateLocation: true };

export function FiltersPage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useRemote(async () => {
    const { data: result } = await api.get("/settings");
    return result;
  }, "filter-settings");
  useEffect(() => {
    if (data?.discoveryPreferences) setPreferences({ ...defaultPreferences, ...data.discoveryPreferences });
  }, [data]);
  function set(key, value) { setPreferences((current) => ({ ...current, [key]: value })); }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.patch("/settings", { discoveryPreferences: { ...preferences, minAge: Number(preferences.minAge), maxAge: Number(preferences.maxAge), distance: Number(preferences.distance) } });
      toast.success("Your discovery preferences are saved");
      const params = new URLSearchParams();
      if (preferences.genderPreference !== "all") params.set("gender", preferences.genderPreference);
      navigate(`/discover${params.size ? `?${params}` : ""}`);
    } catch (requestError) { toast.error(apiErrorMessage(requestError, "We could not save those preferences.")); }
    finally { setBusy(false); }
  }
  if (loading && !data) return <div className="page-content"><PageSpinner label="Loading your preferences" /></div>;
  return <div className="page-content filters-page"><PageHeading eyebrow="MAKE DISCOVERY YOURS" title="Search filters" description="Set a few preferences. You can update them whenever you like." action={<Button to="/discover" variant="quiet"><Icon name="arrowLeft" size={15} /> Back to discover</Button>} />{error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}<form className="filters-layout" onSubmit={save}><section className="filters-panel"><div className="filters-section-heading"><span className="filter-icon"><Icon name="users" /></span><div><h2>Who you’d like to meet</h2><p>These preferences guide your discovery feed.</p></div></div><label className="field"><span>Gender preference</span><select value={preferences.genderPreference} onChange={(event) => set("genderPreference", event.target.value)}><option value="all">Everyone</option><option value="female">Women</option><option value="male">Men</option><option value="non-binary">Non-binary people</option><option value="other">Other</option></select></label><div className="form-row"><label className="field"><span>Minimum age</span><select value={preferences.minAge} onChange={(event) => set("minAge", Number(event.target.value))}>{Array.from({ length: 103 }, (_, index) => index + 18).map((age) => <option key={age} value={age}>{age}</option>)}</select></label><label className="field"><span>Maximum age</span><select value={preferences.maxAge} onChange={(event) => set("maxAge", Number(event.target.value))}>{Array.from({ length: 103 }, (_, index) => index + 18).map((age) => <option key={age} value={age}>{age}</option>)}</select></label></div><div className="range-control"><label htmlFor="distance-range"><span>Distance</span><strong>{preferences.distance} km</strong></label><input id="distance-range" type="range" min="1" max="500" value={preferences.distance} onChange={(event) => set("distance", Number(event.target.value))} /><div className="range-labels"><span>Nearby</span><span>500 km</span></div></div><label className="switch-row"><span className="switch-copy"><strong>Hide my profile</strong><small>Pause discovery while you take a break.</small></span><input type="checkbox" role="switch" checked={Boolean(preferences.hideProfile)} onChange={(event) => set("hideProfile", event.target.checked)} /><i /></label></section><aside className="filters-summary"><span className="summary-glow"><Icon name="sliders" size={24} /></span><h2>Your pace, your preferences.</h2><p>HeartLink uses these settings to shape discovery. They don’t change who can see a profile you’ve already matched with.</p><div className="summary-detail"><Icon name="lock" size={15} /> You can change these choices at any time.</div><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save preferences"} <Icon name="arrowRight" size={16} /></Button></aside></form></div>;
}

export function EditProfilePage() {
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: "", bio: "", city: "", lookingFor: "relationship", interests: [] });
  const [photos, setPhotos] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { data, loading, error, reload } = useRemote(async () => {
    const { data: result } = await api.get("/profiles/me");
    return result.user;
  }, "profile-edit");
  useEffect(() => {
    if (!data) return;
    setForm({ name: data.name || "", bio: data.bio || "", city: data.city || "", lookingFor: data.lookingFor || "relationship", interests: data.interests || [] });
    setPhotos(data.photos || (data.profilePhoto ? [data.profilePhoto] : []));
    setProfilePhoto(data.profilePhoto || data.photos?.[0] || "");
  }, [data]);
  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  function toggleInterest(interest) { setForm((current) => ({ ...current, interests: current.interests.includes(interest) ? current.interests.filter((item) => item !== interest) : current.interests.length >= 12 ? current.interests : [...current.interests, interest] })); }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data: result } = await api.patch("/profiles/me", { ...form, interests: form.interests, profilePhoto });
      setUser(result.user);
      toast.success("Your profile is updated");
    } catch (requestError) { toast.error(apiErrorMessage(requestError, "We could not save your profile.")); }
    finally { setBusy(false); }
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > 8 * 1024 * 1024) return toast.error("Choose an image smaller than 8 MB.");
    if (photos.length >= 6) return toast.error("Your profile can have up to 6 photos.");
    setUploading(true);
    try {
      const body = new FormData(); body.append("photo", file);
      const { data: result } = await api.post("/profiles/me/photos", body);
      setUser(result.user); setPhotos(result.user.photos || []); setProfilePhoto(result.user.profilePhoto || "");
      toast.success("Photo added to your profile");
    } catch (requestError) { toast.error(apiErrorMessage(requestError, "We could not upload that photo.")); }
    finally { setUploading(false); }
  }
  async function removePhoto(photo) {
    const photoPath = new URL(photo, window.location.origin).pathname;
    const photoId = photoPath.split("/").filter(Boolean).at(-1);
    setBusy(true);
    try {
      const { data: result } = await api.delete(`/profiles/me/photos/${encodeURIComponent(photoId)}`);
      setUser(result.user); setPhotos(result.user.photos || []); setProfilePhoto(result.user.profilePhoto || "");
      toast.success("Photo removed");
    } catch (requestError) { toast.error(apiErrorMessage(requestError, "We could not remove that photo.")); }
    finally { setBusy(false); }
  }
  async function movePhoto(index, direction) {
    const next = [...photos];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      const { data: result } = await api.patch("/profiles/me", { photos: next });
      setUser(result.user); setPhotos(result.user.photos || []); setProfilePhoto(result.user.profilePhoto || "");
    } catch (requestError) { toast.error(apiErrorMessage(requestError, "We could not reorder your photos.")); }
  }
  if (loading && !data) return <div className="page-content"><PageSpinner label="Loading your profile" /></div>;
  return <div className="page-content edit-profile-page"><PageHeading eyebrow="YOUR PROFILE, YOUR STORY" title="Make it feel like you" description="A few honest details give someone a better way to start a conversation." action={<Link className="text-link" to="/discover">Preview discovery <Icon name="arrowRight" size={15} /></Link>} />{error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}<form className="edit-profile-layout" onSubmit={save}><section className="edit-main-panel"><div className="settings-section-head"><span className="section-icon"><Icon name="user" /></span><div><h2>About you</h2><p>Share the things you’re comfortable making public.</p></div></div><div className="form-row"><Field id="profile-name" name="name" label="Name" required minLength={2} maxLength={60} value={form.name} onChange={update} /><label className="field"><span>Looking for</span><select name="lookingFor" value={form.lookingFor} onChange={update}><option value="relationship">A relationship</option><option value="friendship">Friendship</option><option value="casual">Something casual</option></select></label></div><label className="field"><span>City</span><input name="city" maxLength={100} value={form.city} onChange={update} placeholder="Where you call home" /></label><label className="field"><span>Your introduction <small>{form.bio.length}/500</small></span><textarea name="bio" rows={5} maxLength={500} value={form.bio} onChange={update} placeholder="A few things you enjoy, care about, or would love to talk about…" /></label><div className="interests-editor"><div className="editor-heading"><div><h3>Interests</h3><p>Choose up to 12 things you enjoy.</p></div><span>{form.interests.length}/12</span></div><div className="interest-selector">{interestsCatalog.map((interest) => <button type="button" key={interest} className={form.interests.includes(interest) ? "selected" : ""} aria-pressed={form.interests.includes(interest)} onClick={() => toggleInterest(interest)}>{form.interests.includes(interest) && <Icon name="check" size={13} />}{interest}</button>)}</div></div><div className="edit-submit-row"><Button type="submit" disabled={busy}>{busy ? "Saving profile…" : "Save profile"} <Icon name="arrowRight" size={16} /></Button><span><Icon name="lock" size={14} /> Your email and birth date stay private.</span></div></section><aside className="photos-panel"><div className="settings-section-head"><span className="section-icon"><Icon name="image" /></span><div><h2>Your photos</h2><p>Add up to 6 photos. Put your favorite first.</p></div></div><div className="photo-manager-grid">{photos.map((photo, index) => <article className={`managed-photo ${profilePhoto === photo ? "is-cover" : ""}`} key={`${photo}-${index}`}><img src={resolvePhotoUrl(photo)} alt={`Your photo ${index + 1}`} /><span className="photo-index">{profilePhoto === photo ? "Profile photo" : `Photo ${index + 1}`}</span><div className="photo-manager-actions"><button type="button" aria-label="Move photo earlier" disabled={index === 0 || busy} onClick={() => movePhoto(index, -1)}><Icon name="chevronLeft" size={15} /></button><button type="button" aria-label="Move photo later" disabled={index === photos.length - 1 || busy} onClick={() => movePhoto(index, 1)}><Icon name="chevronRight" size={15} /></button><button type="button" aria-label="Remove photo" disabled={busy} onClick={() => removePhoto(photo)}><Icon name="trash" size={15} /></button></div></article>)}{photos.length < 6 && <label className={`add-photo-tile ${uploading ? "uploading" : ""}`}><input type="file" accept="image/*" onChange={upload} disabled={uploading} /><Icon name={uploading ? "clock" : "plus"} size={22} /><strong>{uploading ? "Uploading…" : "Add a photo"}</strong><small>JPG, PNG or WEBP · up to 8 MB</small></label>}</div><div className="photo-guidance"><Icon name="info" size={15} /><span>Clear, recent photos help people recognize you. Only upload images you have permission to share.</span></div></aside></form></div>;
}

function ToggleSetting({ title, description, checked, onChange, disabled = false }) {
  return <label className={`setting-toggle-row ${disabled ? "disabled" : ""}`}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" role="switch" checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><i /></label>;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [settings, setSettings] = useState({ discoveryPreferences: defaultPreferences, notificationSettings: defaultNotifications, privacySettings: defaultPrivacy });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const { data, loading, error, reload } = useRemote(async () => {
    const [{ data: settingsData }, { data: blocksData }] = await Promise.all([api.get("/settings"), api.get("/blocks")]);
    return { settings: settingsData, blocks: blocksData.blockedUsers || [] };
  }, "account-settings");
  useEffect(() => { if (data?.settings) setSettings((current) => ({ discoveryPreferences: { ...defaultPreferences, ...current.discoveryPreferences, ...data.settings.discoveryPreferences }, notificationSettings: { ...defaultNotifications, ...data.settings.notificationSettings }, privacySettings: { ...defaultPrivacy, ...data.settings.privacySettings } })); }, [data]);
  async function updateGroup(group, key, value) {
    const next = { ...settings[group], [key]: value };
    setSettings((current) => ({ ...current, [group]: next }));
    try { const { data: saved } = await api.patch("/settings", { [group]: { [key]: value } }); setSettings((current) => ({ ...current, [group]: { ...current[group], ...saved[group] } })); toast.success("Preference saved"); }
    catch (requestError) { setSettings((current) => ({ ...current, [group]: { ...current[group], [key]: !value } })); toast.error(apiErrorMessage(requestError, "Could not save that preference.")); }
  }
  async function changePassword(event) {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error("Your new passwords do not match.");
    if (passwordForm.newPassword.length < 8 || passwordForm.newPassword.length > 72) return toast.error("Use a password between 8 and 72 characters.");
    setPasswordBusy(true);
    try { const { data: result } = await api.post("/auth/change-password", { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }); toast.success(result.message || "Password changed"); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
    catch (requestError) { toast.error(apiErrorMessage(requestError, "We could not change your password.")); }
    finally { setPasswordBusy(false); }
  }
  async function unblock(person) {
    try { await api.delete(`/blocks/${encodeURIComponent(person.id)}`); toast.success(`${person.name} unblocked`); await reload(); }
    catch (requestError) { toast.error(apiErrorMessage(requestError, "Could not unblock this member.")); }
  }
  async function deleteAccount() {
    setDeleteBusy(true);
    try { const { data: result } = await api.delete("/auth/delete-account"); toast.success(result.message || "Your account has been deleted."); await logout(); navigate("/", { replace: true }); }
    catch (requestError) { toast.error(apiErrorMessage(requestError, "Your account could not be deleted.")); }
    finally { setDeleteBusy(false); setConfirmDelete(false); }
  }
  if (loading && !data) return <div className="page-content"><PageSpinner label="Loading your settings" /></div>;
  return <div className="page-content settings-page"><PageHeading eyebrow="YOUR SPACE, YOUR CHOICES" title="Settings" description="Choose how HeartLink works for you." />{error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}<div className="settings-layout"><nav className="settings-index" aria-label="Settings sections"><a href="#privacy"><Icon name="shield" /> Privacy</a><a href="#notifications"><Icon name="bell" /> Notifications</a><a href="#blocked"><Icon name="x" /> Blocked members</a><a href="#password"><Icon name="lock" /> Password</a><a href="#account"><Icon name="alert" /> Account</a></nav><div className="settings-sections"><section id="privacy" className="settings-card"><div className="settings-section-head"><span className="section-icon"><Icon name="shield" /></span><div><h2>Privacy and discovery</h2><p>Fine-tune the details other members can see.</p></div></div><ToggleSetting title="Show online status" description="Let your matches know when you’re around." checked={settings.privacySettings.showOnlineStatus} onChange={(value) => updateGroup("privacySettings", "showOnlineStatus", value)} /><ToggleSetting title="Read receipts" description="Let matches know when you’ve read a message." checked={settings.privacySettings.readReceipts} onChange={(value) => updateGroup("privacySettings", "readReceipts", value)} /><ToggleSetting title="Share approximate location" description="Use approximate distance to help show nearby profiles." checked={settings.privacySettings.shareApproximateLocation} onChange={(value) => updateGroup("privacySettings", "shareApproximateLocation", value)} /><ToggleSetting title="Hide profile from discovery" description="Take a break without deleting your account." checked={settings.discoveryPreferences.hideProfile} onChange={(value) => updateGroup("discoveryPreferences", "hideProfile", value)} /></section><section id="notifications" className="settings-card"><div className="settings-section-head"><span className="section-icon"><Icon name="bell" /></span><div><h2>Notifications</h2><p>Choose which updates you’d like to receive.</p></div></div><ToggleSetting title="New matches" description="A note when you make a mutual connection." checked={settings.notificationSettings.newMatches} onChange={(value) => updateGroup("notificationSettings", "newMatches", value)} /><ToggleSetting title="Messages" description="A note when a match sends you a message." checked={settings.notificationSettings.messages} onChange={(value) => updateGroup("notificationSettings", "messages", value)} /><ToggleSetting title="Likes" description="A note when someone likes your profile." checked={settings.notificationSettings.likes} onChange={(value) => updateGroup("notificationSettings", "likes", value)} /><ToggleSetting title="Sounds" description="Play a sound for new in-app notifications." checked={settings.notificationSettings.sounds} onChange={(value) => updateGroup("notificationSettings", "sounds", value)} /></section><section id="blocked" className="settings-card"><div className="settings-section-head"><span className="section-icon"><Icon name="x" /></span><div><h2>Blocked members</h2><p>People you block won’t appear in discovery or be able to contact you.</p></div></div>{data?.blocks?.length ? <div className="blocked-list">{data.blocks.map((person) => <div className="blocked-row" key={person.id}><Avatar person={person} size="sm" /><span><strong>{person.name}</strong><small>{person.city || "HeartLink member"}</small></span><Button variant="soft" onClick={() => unblock(person)}>Unblock</Button></div>)}</div> : <p className="settings-empty">You haven’t blocked anyone.</p>}</section><section id="password" className="settings-card"><div className="settings-section-head"><span className="section-icon"><Icon name="lock" /></span><div><h2>Change password</h2><p>Use a unique password you don’t share with other sites.</p></div></div><form className="password-settings-form" onSubmit={changePassword}><Field id="current-password" label="Current password" type="password" autoComplete="current-password" required maxLength={72} value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, currentPassword: event.target.value }))} /><Field id="new-password" label="New password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={passwordForm.newPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, newPassword: event.target.value }))} /><Field id="confirm-new-password" label="Confirm new password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, confirmPassword: event.target.value }))} /><Button type="submit" variant="soft" disabled={passwordBusy}>{passwordBusy ? "Updating…" : "Update password"}</Button></form></section><section id="account" className="settings-card danger-zone"><div className="settings-section-head"><span className="section-icon danger"><Icon name="alert" /></span><div><h2>Delete account</h2><p>Delete your profile and associated HeartLink data. This action cannot be undone.</p></div></div><Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete my account</Button></section></div></div><ConfirmDialog open={confirmDelete} title="Delete your HeartLink account?" description="Your profile, matches, messages, likes, and settings will be permanently removed. This can’t be undone." confirmLabel="Delete account" destructive busy={deleteBusy} onConfirm={deleteAccount} onCancel={() => setConfirmDelete(false)} /></div>;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { data: notifications, loading, error, reload, setData } = useRemote(async () => {
    const { data } = await api.get("/notifications");
    return data.notifications || [];
  }, "notifications");

  useEffect(() => {
    const handleNotificationsChanged = () => reload({ silent: true });
    window.addEventListener("heartlink:notifications_changed", handleNotificationsChanged);
    return () => window.removeEventListener("heartlink:notifications_changed", handleNotificationsChanged);
  }, [reload]);
  async function markAll() {
    try { await api.patch("/notifications/read-all"); setData((current) => (current || []).map((item) => ({ ...item, read: true }))); toast.success("All caught up"); }
    catch (requestError) { toast.error(apiErrorMessage(requestError, "Could not update notifications.")); }
  }
  async function open(item) {
    if (!item.read) {
      try { await api.patch(`/notifications/${encodeURIComponent(item.id)}/read`); setData((current) => (current || []).map((entry) => entry.id === item.id ? { ...entry, read: true } : entry)); }
      catch { /* Keep the notification navigable if read-state update is unavailable. */ }
    }
    if (item.matchId) navigate(`/messages/${item.matchId}`);
    else if (item.sender?.id) navigate(`/profile/${item.sender.id}`);
    else if (item.type === "like") navigate("/likes");
  }
  const unread = notifications?.filter((item) => !item.read).length || 0;
  return <div className="page-content notifications-page"><PageHeading eyebrow="YOUR HEARTLINK UPDATES" title="Notifications" description="A quiet place for the things worth seeing." action={Boolean(unread) && <Button variant="soft" onClick={markAll}><Icon name="check" size={15} /> Mark all read</Button>} />{error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}{loading && !notifications ? <PageSpinner label="Checking notifications" /> : notifications?.length ? <div className="notifications-card">{notifications.map((item) => <button type="button" key={item.id} className={`notification-row ${item.read ? "read" : "unread"}`} onClick={() => open(item)}><span className={`notification-icon notification-${item.type || "default"}`}><Icon name={item.type === "message" ? "message" : item.type === "match" ? "users" : item.type === "like" ? "heart" : "bell"} size={18} /></span>{item.sender ? <Avatar person={item.sender} size="sm" /> : null}<span className="notification-copy"><strong>{item.title || "A HeartLink update"}</strong><small>{item.message || "Open to see the latest update."}</small></span><time>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</time>{!item.read && <i className="unread-dot" />}</button>)}</div> : !error && <EmptyState icon="bell" title="You’re all caught up" text="When someone likes your profile or sends a message, you’ll find it here." action={<Button to="/discover" variant="soft">Explore people</Button>} />}</div>;
}

export function PremiumPage() {
  const [planData, setPlanData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([api.get("/subscriptions/plans"), api.get("/subscriptions/me")]).then(([plans, current]) => {
      if (active) { setPlanData(plans.data); setSubscription(current.data.subscription); }
    }).catch((requestError) => { if (active) setError(apiErrorMessage(requestError, "We could not load membership plans.")); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  if (loading) return <div className="page-content"><PageSpinner label="Loading membership plans" /></div>;
  const money = (minor) => new Intl.NumberFormat(undefined, { style: "currency", currency: planData?.currency || "INR", maximumFractionDigits: 0 }).format(Number(minor || 0) / 100);
  return <div className="page-content premium-page"><section className="premium-hero"><div><span className="eyebrow">A LITTLE MORE ROOM TO EXPLORE</span><h1>More discovery.<br /><em>Your own pace.</em></h1><p>See what HeartLink membership offers. You choose if it fits.</p><div className="premium-points"><span><Icon name="heart" /> More ways to show interest</span><span><Icon name="sliders" /> More discovery controls</span><span><Icon name="shield" /> Keep your privacy choices</span></div></div><div className="premium-art"><span className="premium-orbit" /><img src="/heartlink-couple.jpg" alt="HeartLink couple illustration" /></div></section>{error && <ErrorNotice>{error}</ErrorNotice>}{subscription && <div className="active-plan-banner"><Icon name="checkCircle" /><span><strong>Your membership: {subscription.plan}</strong><small>Status: {subscription.status}</small></span></div>}<div className="premium-disclosure"><Icon name="info" size={16} /><span>Checkout is not enabled in this version. No payment will be taken.</span></div><div className="plan-grid">{(planData?.plans || []).map((plan, index) => <article className={`plan-card ${index === 1 ? "recommended" : ""}`} key={plan.id}><span className="plan-note">{plan.note}</span><h2>{plan.label}</h2><p className="plan-price">{money(plan.amountMinor)}<small> / {plan.durationMonths} {plan.durationMonths === 1 ? "month" : "months"}</small></p><p className="plan-description">A membership option for the time you choose.</p><ul><li><Icon name="check" /> More ways to express interest</li><li><Icon name="check" /> Additional discovery options</li><li><Icon name="check" /> Cancel or review in Settings</li></ul><Button variant="soft" disabled={!planData?.paymentEnabled}>Checkout unavailable</Button></article>)}</div></div>;
}

export function SupportQueuePage() {
  const [status, setStatus] = useState("open");
  const [pending, setPending] = useState("");
  const fetchTickets = async () => { const { data } = await api.get("/admin/support", { params: { status, limit: 50 } }); return data.tickets || []; };
  const { data: tickets, loading, error, reload } = useRemote(fetchTickets, status);
  async function update(ticket, nextStatus) {
    setPending(String(ticket._id));
    try { await api.patch(`/admin/support/${encodeURIComponent(ticket._id)}`, { status: nextStatus }); toast.success("Support ticket updated"); await reload(); }
    catch (requestError) { toast.error(apiErrorMessage(requestError, "Could not update the ticket.")); }
    finally { setPending(""); }
  }
  return <div className="page-content staff-page"><PageHeading eyebrow="STAFF WORKSPACE" title="Support queue" description="Review requests and keep the queue moving." /><div className="tabs-row">{["open", "in_progress", "resolved"].map((value) => <button key={value} type="button" className={status === value ? "active" : ""} onClick={() => setStatus(value)}>{value.replace("_", " ")}</button>)}</div>{error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}{loading && !tickets ? <PageSpinner /> : tickets?.length ? <div className="staff-list">{tickets.map((ticket) => <article className="staff-card" key={ticket._id}><div className="staff-card-top"><span className={`status-pill status-${ticket.status}`}>{ticket.status?.replace("_", " ")}</span><time>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ""}</time></div><h2>{ticket.subject}</h2><p>{ticket.message}</p><div className="staff-meta"><span>{ticket.email}</span><span>{ticket.category}</span></div><div className="staff-actions">{ticket.status !== "in_progress" && <Button variant="soft" disabled={pending === String(ticket._id)} onClick={() => update(ticket, "in_progress")}>Mark in progress</Button>}{ticket.status !== "resolved" && <Button disabled={pending === String(ticket._id)} onClick={() => update(ticket, "resolved")}>Resolve</Button>}</div></article>)}</div> : !error && <EmptyState icon="checkCircle" title="No tickets in this view" text="New support requests will appear here." />}</div>;
}

export function ReportQueuePage() {
  const [status, setStatus] = useState("open");
  const [pending, setPending] = useState("");
  const fetchReports = async () => { const { data } = await api.get("/admin/reports", { params: { status, limit: 50 } }); return data.reports || []; };
  const { data: reports, loading, error, reload } = useRemote(fetchReports, status);
  async function review(report, nextStatus, actionOnUser) {
    setPending(String(report._id));
    try { await api.patch(`/admin/reports/${encodeURIComponent(report._id)}`, { status: nextStatus, ...(actionOnUser ? { actionOnUser } : {}) }); toast.success("Report updated"); await reload(); }
    catch (requestError) { toast.error(apiErrorMessage(requestError, "Could not update the report.")); }
    finally { setPending(""); }
  }
  return <div className="page-content staff-page"><PageHeading eyebrow="STAFF WORKSPACE" title="Safety reports" description="Review member reports and apply the appropriate action." /><div className="tabs-row">{["open", "under_review", "reviewed", "resolved", "dismissed"].map((value) => <button key={value} type="button" className={status === value ? "active" : ""} onClick={() => setStatus(value)}>{value.replaceAll("_", " ")}</button>)}</div>{error && <ErrorNotice onRetry={reload}>{error}</ErrorNotice>}{loading && !reports ? <PageSpinner /> : reports?.length ? <div className="staff-list">{reports.map((report) => <article className="staff-card" key={report._id}><div className="staff-card-top"><span className={`status-pill status-${report.status}`}>{report.status?.replaceAll("_", " ")}</span><time>{report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}</time></div><h2>{report.reportedUser?.name || "Unavailable member"}</h2><p><strong>Reason:</strong> {report.reason?.replaceAll("_", " ")}</p>{report.details && <p>{report.details}</p>}<div className="staff-meta"><span>Reported by {report.reporter?.name || "Member"}</span><span>{report.reporter?.email || ""}</span></div><div className="staff-actions"><Button variant="soft" disabled={pending === String(report._id)} onClick={() => review(report, "under_review")}>Review</Button><Button disabled={pending === String(report._id)} onClick={() => review(report, "resolved")}>Resolve report</Button>{report.reportedUser?.isActive !== false && <Button variant="danger" disabled={pending === String(report._id)} onClick={() => review(report, "resolved", "suspend")}>Suspend account</Button>}</div></article>)}</div> : !error && <EmptyState icon="shield" title="No reports in this view" text="New safety reports will appear here." />}</div>;
}
