import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Compass,
  Heart,
  MapPin,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, apiErrorMessage, resolvePhotoUrl } from "../services/api";
import { AppShell } from "../components/Layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNotice,
  PageTransition,
  RoleBadge,
  ScalePress,
  SkeletonCard,
  StaggerItem,
  StaggerList,
  StatCard,
} from "../components/ui";

function computeProfileChecklist(user) {
  if (!user) return { percent: 0, items: [] };
  const items = [
    { key: "photo", label: "Upload at least one profile photo", done: Boolean(user.profilePhoto || user.photos?.length) },
    { key: "bio", label: "Write a bio (15+ characters)", done: (user.bio || "").trim().length >= 15 },
    { key: "city", label: "Add your city or location", done: Boolean((user.city || "").trim()) },
    { key: "interests", label: "Choose 3+ interests", done: (user.interests || []).length >= 3 },
    { key: "prompts", label: "Answer a profile prompt", done: (user.prompts || []).length >= 1 },
    { key: "intent", label: "Set relationship intent", done: Boolean(user.lookingFor) },
  ];
  const completed = items.filter((item) => item.done).length;
  return {
    percent: Math.round((completed / items.length) * 100),
    items,
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function MemberDashboardPage() {
  const { user, stats, refreshProfile } = useAuth();
  const [matches, setMatches] = useState([]);
  const [incomingLikes, setIncomingLikes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [suggestedProfiles, setSuggestedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkspaceOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const [matchesRes, likesRes, notifRes, profilesRes] = await Promise.allSettled([
        api.get("/matches"),
        api.get("/likes/received"),
        api.get("/notifications"),
        api.get("/profiles?limit=3"),
      ]);

      if (matchesRes.status === "fulfilled") {
        setMatches((matchesRes.value.data?.matches || []).slice(0, 4));
      }
      if (likesRes.status === "fulfilled") {
        setIncomingLikes((likesRes.value.data?.likes || []).slice(0, 4));
      }
      if (notifRes.status === "fulfilled") {
        setNotifications((notifRes.value.data?.notifications || []).slice(0, 4));
      }
      if (profilesRes.status === "fulfilled") {
        setSuggestedProfiles((profilesRes.value.data?.profiles || []).slice(0, 3));
      }
      refreshProfile?.();
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to load your dashboard summary."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceOverview();
  }, []);

  useEffect(() => {
    const sync = () => loadWorkspaceOverview();
    window.addEventListener("heartlink:matches_changed", sync);
    window.addEventListener("heartlink:likes_changed", sync);
    window.addEventListener("heartlink:notifications_changed", sync);
    return () => {
      window.removeEventListener("heartlink:matches_changed", sync);
      window.removeEventListener("heartlink:likes_changed", sync);
      window.removeEventListener("heartlink:notifications_changed", sync);
    };
  }, []);

  const profileChecklist = computeProfileChecklist(user);
  const prefs = user?.discoveryPreferences || {};

  return (
    <AppShell
      title={`${getGreeting()}, ${user?.name?.split(" ")[0] || "there"} ✨`}
      subtitle="Your personal dating hub. See new admirers, chat with matches, and discover singles nearby."
      actions={
        <>
          <Link to="/profile/edit">
            <Button variant="outline" size="sm" leftIcon={<UserCheck className="h-4 w-4" />}>
              Edit Profile
            </Button>
          </Link>
          <Link to="/discover">
            <Button size="sm" leftIcon={<Compass className="h-4 w-4" />} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Discover People
            </Button>
          </Link>
        </>
      }
    >
      <PageTransition className="space-y-6">
        {error && <ErrorNotice message={error} onRetry={loadWorkspaceOverview} />}

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem>
              <StatCard
                label="Mutual Matches"
                value={stats?.matchesCount ?? matches.length}
                subtitle="Connections ready to chat"
                icon={Users}
                tone="primary"
                to="/matches"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Liked You"
                value={stats?.likesReceivedCount ?? incomingLikes.length}
                subtitle="Singles who want to match"
                icon={Heart}
                tone="primary"
                to="/likes"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Your Likes"
                value={stats?.likesSentCount ?? 0}
                subtitle="Profiles you've swiped right on"
                icon={Sparkles}
                tone="info"
                to="/likes"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Unread Alerts"
                value={stats?.unreadNotificationsCount ?? 0}
                subtitle="Matches, sparks &amp; messages"
                icon={Bell}
                tone={stats?.unreadNotificationsCount > 0 ? "warning" : "success"}
                to="/notifications"
              />
            </StaggerItem>
          </StaggerList>
        )}

        {/* Quick Action Hub */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/discover" className="no-underline">
            <ScalePress className="hl-surface-interactive p-4 rounded-xl flex items-center gap-3 bg-gradient-to-br from-rose-500/10 via-base-100 to-base-100 border border-rose-500/20 shadow-sm cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Heart className="h-5 w-5 fill-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-base-content">Discovery Deck</p>
                <p className="text-[11px] hl-muted-text truncate">Swipe singles</p>
              </div>
            </ScalePress>
          </Link>

          <Link to="/matches" className="no-underline">
            <ScalePress className="hl-surface-interactive p-4 rounded-xl flex items-center gap-3 bg-gradient-to-br from-indigo-500/10 via-base-100 to-base-100 border border-indigo-500/20 shadow-sm cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-base-content">Mutual Matches</p>
                <p className="text-[11px] hl-muted-text truncate">{matches.length} active</p>
              </div>
            </ScalePress>
          </Link>

          <Link to="/messages" className="no-underline">
            <ScalePress className="hl-surface-interactive p-4 rounded-xl flex items-center gap-3 bg-gradient-to-br from-sky-500/10 via-base-100 to-base-100 border border-sky-500/20 shadow-sm cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-base-content">Messages</p>
                <p className="text-[11px] hl-muted-text truncate">Live chats</p>
              </div>
            </ScalePress>
          </Link>

          <Link to="/profile/edit" className="no-underline">
            <ScalePress className="hl-surface-interactive p-4 rounded-xl flex items-center gap-3 bg-gradient-to-br from-purple-500/10 via-base-100 to-base-100 border border-purple-500/20 shadow-sm cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-base-content">My Profile</p>
                <p className="text-[11px] hl-muted-text truncate">{profileChecklist.percent}% ready</p>
              </div>
            </ScalePress>
          </Link>
        </div>

        {/* Suggested Singles Highlight */}
        {suggestedProfiles.length > 0 && (
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-rose-500 animate-pulse" />
                  <div>
                    <h2 className="text-sm font-semibold text-base-content">Suggested Compatible Singles</h2>
                    <p className="text-xs hl-muted-text">Curated matches based on your intent &amp; lifestyle</p>
                  </div>
                </div>
                <Link to="/discover">
                  <Button size="xs" variant="outline" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    Swipe Deck
                  </Button>
                </Link>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {suggestedProfiles.map((p) => {
                const photo = p.profilePhoto || p.photos?.[0];
                return (
                  <Link
                    key={p.id || p._id}
                    to={`/profile/${p.id || p._id}`}
                    className="group relative rounded-2xl overflow-hidden border border-rose-500/15 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg no-underline block"
                  >
                    <div className="aspect-[4/5] w-full bg-base-300 relative overflow-hidden">
                      {photo ? (
                        <img
                          src={resolvePhotoUrl(photo)}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-base-300 text-base-content/40">
                          <Heart className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-3.5 text-white">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-white drop-shadow-sm">
                            {p.name}{p.age ? `, ${p.age}` : ""}
                          </span>
                          {p.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                        </div>
                        {p.city && (
                          <p className="text-[11px] text-white/80 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{p.city}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        )}

        {/* Main Asymmetric Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns */}
          <div className="lg:col-span-7 space-y-6">
            {/* Profile Readiness Card */}
            <Card
              header={
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={user?.profilePhoto || user?.photos?.[0]} name={user?.name} size="md" verified={user?.isVerified} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-semibold text-base-content truncate">{user?.name}</h2>
                        <RoleBadge role={user?.role} />
                      </div>
                      <p className="text-xs hl-muted-text truncate">
                        {user?.city || "Location unset"} · {user?.lookingFor || "Relationship"}
                      </p>
                    </div>
                  </div>
                  <Badge tone={profileChecklist.percent === 100 ? "success" : "primary"}>
                    {profileChecklist.percent}% complete
                  </Badge>
                </>
              }
            >
              <div className="space-y-4">
                <div className="w-full h-2 rounded-full bg-base-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 transition-all duration-300"
                    style={{ width: `${profileChecklist.percent}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {profileChecklist.items.map((item) => (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                        item.done
                          ? "border-emerald-500/25 bg-emerald-500/5 text-base-content"
                          : "border-base-300 bg-base-200/40 hl-muted-text"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 shrink-0 ${
                          item.done ? "text-emerald-500" : "opacity-35"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                  ))}
                </div>

                {profileChecklist.percent < 100 && (
                  <div className="pt-1">
                    <Link to="/profile/edit">
                      <Button size="sm" variant="soft-primary" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                        Complete your profile
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Matches */}
            <Card
              header={
                <>
                  <div>
                    <h2 className="text-sm font-semibold text-base-content">Recent Matches</h2>
                    <p className="text-xs hl-muted-text">Jump directly into real-time conversations</p>
                  </div>
                  <Link to="/matches" className="text-xs font-medium hl-accent-text hover:underline">
                    View all →
                  </Link>
                </>
              }
              noPadding
            >
              {matches.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No active matches yet"
                  description="Explore curated profiles in Discovery to spark mutual connections."
                  action={
                    <Link to="/discover">
                      <Button size="sm">Open Discover</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="divide-y divide-base-300/60">
                  {matches.map((item) => {
                    const other = item.matchedUser;
                    if (!other) return null;
                    return (
                      <div
                        key={item.matchId}
                        className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-base-200/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={other.profilePhoto || other.photos?.[0]}
                            name={other.name}
                            size="md"
                            online={other.online}
                            verified={other.isVerified}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/profile/${other.id}`}
                                className="text-sm font-semibold text-base-content hover:underline truncate"
                              >
                                {other.name}
                                {other.age ? `, ${other.age}` : ""}
                              </Link>
                              {item.unreadCount > 0 && (
                                <Badge tone="primary">{item.unreadCount} new</Badge>
                              )}
                            </div>
                            <p className="text-xs hl-muted-text truncate">
                              {item.lastMessage?.text || other.city || "Say hello to start chatting"}
                            </p>
                          </div>
                        </div>
                        <Link to={`/messages/${item.matchId}`}>
                          <Button size="xs" variant="outline" leftIcon={<MessageSquare className="h-3.5 w-3.5" />}>
                            Chat
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right 5 Columns */}
          <div className="lg:col-span-5 space-y-6">
            {/* Incoming Likes Preview */}
            <Card
              header={
                <>
                  <div>
                    <h2 className="text-sm font-semibold text-base-content">People Who Liked You</h2>
                    <p className="text-xs hl-muted-text">Respond in one click</p>
                  </div>
                  <Link to="/likes" className="text-xs font-medium hl-accent-text hover:underline">
                    See all →
                  </Link>
                </>
              }
              noPadding
            >
              {incomingLikes.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="No pending incoming likes"
                  description="Keep your profile active and preferences updated so people nearby can find you."
                />
              ) : (
                <div className="divide-y divide-base-300/60">
                  {incomingLikes.map((person) => (
                    <div key={person.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={person.profilePhoto} name={person.name} size="sm" verified={person.isVerified} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-base-content truncate">
                            {person.name}
                            {person.age ? `, ${person.age}` : ""}
                          </p>
                          <p className="text-xs hl-muted-text truncate">
                            {person.type === "superlike" ? "Sent a Spark" : "Liked your profile"}
                            {person.city ? ` · ${person.city}` : ""}
                          </p>
                        </div>
                      </div>
                      <Link to={`/profile/${person.id}`}>
                        <Button size="xs" variant="ghost">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Discovery Preferences & Privacy Snapshot */}
            <Card
              header={
                <>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 hl-accent-text" />
                    <h2 className="text-sm font-semibold text-base-content">Discovery Preferences</h2>
                  </div>
                  <Link to="/search" className="text-xs font-medium hl-accent-text hover:underline">
                    Edit
                  </Link>
                </>
              }
            >
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border hl-subtle-divider bg-base-200/50 p-3">
                  <dt className="hl-muted-text">Showing</dt>
                  <dd className="font-semibold text-base-content capitalize mt-0.5">
                    {prefs.genderPreference || "all"}
                  </dd>
                </div>
                <div className="rounded-lg border hl-subtle-divider bg-base-200/50 p-3">
                  <dt className="hl-muted-text">Age Range</dt>
                  <dd className="font-semibold text-base-content hl-tabular mt-0.5">
                    {prefs.minAge || 18} – {prefs.maxAge || 50}
                  </dd>
                </div>
                <div className="rounded-lg border hl-subtle-divider bg-base-200/50 p-3">
                  <dt className="hl-muted-text">Radius</dt>
                  <dd className="font-semibold text-base-content hl-tabular mt-0.5">
                    {prefs.distance || 50} km
                  </dd>
                </div>
                <div className="rounded-lg border hl-subtle-divider bg-base-200/50 p-3">
                  <dt className="hl-muted-text">Profile Visibility</dt>
                  <dd className="font-semibold text-base-content mt-0.5">
                    {prefs.hideProfile ? "Hidden" : "Visible"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 pt-3 border-t hl-subtle-divider flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 hl-muted-text">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Privacy controls active
                </span>
                <Link to="/settings" className="font-medium hl-accent-text hover:underline">
                  Manage privacy →
                </Link>
              </div>
            </Card>

            {/* Recent Alerts */}
            <Card
              header={
                <>
                  <h2 className="text-sm font-semibold text-base-content">Recent Alerts</h2>
                  <Link to="/notifications" className="text-xs font-medium hl-accent-text hover:underline">
                    All alerts
                  </Link>
                </>
              }
              noPadding
            >
              {notifications.length === 0 ? (
                <div className="p-5 text-xs hl-muted-text text-center">No recent notifications.</div>
              ) : (
                <div className="divide-y divide-base-300/60">
                  {notifications.map((n) => (
                    <div key={n.id || n._id} className="px-5 py-3 flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-base-content truncate">{n.title}</p>
                        <p className="hl-muted-text truncate">{n.message}</p>
                      </div>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-indigo-500 mt-1 shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
