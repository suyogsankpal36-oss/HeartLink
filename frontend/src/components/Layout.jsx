import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Compass,
  Crown,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  UserCheck,
  Users,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api, apiErrorMessage } from "../services/api";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  IconButton,
  Logo,
  PageSpinner,
  RoleBadge,
  SearchBar,
  ThemeToggle,
} from "./ui";

const SIDEBAR_STORAGE_KEY = "hl_member_sidebar_collapsed";

const QUICK_JUMP_ITEMS = [
  { label: "My Matches & Home", to: "/dashboard", keywords: "home overview stats matches dashboard" },
  { label: "Discover People", to: "/discover", keywords: "discover swipe feed people date" },
  { label: "Likes & Admirers", to: "/likes", keywords: "likes admirers superlike heart" },
  { label: "Mutual Matches", to: "/matches", keywords: "matches connections couples" },
  { label: "Messages & Chats", to: "/messages", keywords: "chat messages inbox conversation" },
  { label: "Dating Preferences & Filters", to: "/search", keywords: "filters preferences distance age gender" },
  { label: "Edit Dating Profile & Photos", to: "/profile/edit", keywords: "profile bio photos prompts gallery" },
  { label: "Account & Safety Settings", to: "/settings", keywords: "settings privacy security password danger" },
  { label: "Notifications", to: "/notifications", keywords: "alerts notifications likes matches" },
  { label: "HeartLink Premium", to: "/premium", keywords: "premium subscription plans membership boost" },
];

export function PublicHeader() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isStaff = user && ["moderator", "admin", "superadmin"].includes(user.role);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Discover", to: "/discover" },
    { label: "How It Works", to: "/#how-it-works" },
    { label: "Safety", to: "/help" },
    { label: "About Us", to: "/about" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b hl-subtle-divider bg-base-100/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo className="shrink-0" />

        <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 hl-accent-text"
                    : "hl-muted-text hover:text-base-content hover:bg-base-300/50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <ThemeToggle compact />
          {user ? (
            <>
              {isStaff && (
                <Link to={user.role === "moderator" ? "/admin/reports" : "/admin/dashboard"}>
                  <Button variant="outline" size="sm" leftIcon={<Shield className="h-3.5 w-3.5" />}>
                    {user.role === "moderator" ? "Moderation" : "Admin Console"}
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button size="sm">Go to App</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Join Heartlink</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle compact />
          <IconButton label="Open menu" variant="outline" size="sm" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" strokeWidth={1.75} />
          </IconButton>
        </div>
      </div>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Navigation"
        side="right"
        widthClass="max-w-xs"
      >
        <div className="flex flex-col gap-2">
          {navLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-base-content hover:bg-base-200"
            >
              {item.label}
            </Link>
          ))}
          <div className="my-2 border-t hl-subtle-divider" />
          <div className="px-2 py-2 flex items-center justify-between">
            <span className="text-xs font-medium hl-muted-text">Appearance</span>
            <ThemeToggle showSystem />
          </div>
          <div className="my-2 border-t hl-subtle-divider" />
          {user ? (
            <div className="flex flex-col gap-2">
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button fullWidth>Go to App</Button>
              </Link>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/signup" onClick={() => setMobileOpen(false)}>
                <Button fullWidth>Join Heartlink</Button>
              </Link>
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" fullWidth>
                  Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Drawer>
    </header>
  );
}

export function PublicFooter() {
  const { backendAvailable } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t hl-subtle-divider bg-base-100 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo />
            <p className="text-xs hl-muted-text leading-relaxed max-w-xs">
              Where authentic connections begin. Find meaningful relationships built on shared values, mutual chemistry, and verified safety.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border hl-subtle-divider bg-base-200/70 px-2.5 py-1 text-[11px] font-medium">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendAvailable ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="hl-muted-text">
                {backendAvailable ? "Live & Ready to Connect" : "Reconnecting to Network..."}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content mb-3">
              Explore
            </h3>
            <ul className="space-y-2 text-xs hl-muted-text">
              <li>
                <Link to="/signup" className="hover:text-base-content transition-colors">
                  Join Free
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-base-content transition-colors">
                  Log In
                </Link>
              </li>
              <li>
                <Link to="/premium" className="hover:text-base-content transition-colors">
                  HeartLink Premium
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-base-content transition-colors">
                  Safety &amp; Help
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content mb-3">
              About
            </h3>
            <ul className="space-y-2 text-xs hl-muted-text">
              <li>
                <Link to="/about" className="hover:text-base-content transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-base-content transition-colors">
                  Dating FAQ
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-base-content transition-colors">
                  Dating Safety Tips
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content mb-3">
              Safety &amp; Legal
            </h3>
            <ul className="space-y-2 text-xs hl-muted-text">
              <li>
                <Link to="/privacy" className="hover:text-base-content transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-base-content transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t hl-subtle-divider pt-6 text-xs hl-muted-text">
          <p>&copy; {year} HeartLink Dating. Certified Adults 18+ Only.</p>
          <ThemeToggle showSystem />
        </div>
      </div>
    </footer>
  );
}

export function PublicPage({ children }) {
  return (
    <div className="min-h-dvh flex flex-col bg-base-200 text-base-content">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

function NotificationPopover() {
  const { stats, refreshProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadRecent = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/notifications");
      setItems((data.notifications || []).slice(0, 6));
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to fetch alerts."));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = async (e) => {
    e.stopPropagation();
    try {
      await api.patch("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshProfile?.();
    } catch {
      // silent fallback
    }
  };

  const unread = Number(stats?.unreadNotificationsCount || 0);

  return (
    <Dropdown
      align="right"
      widthClass="w-80 sm:w-96"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={() => {
            toggle();
            loadRecent();
          }}
          aria-label="Notifications"
          className="relative btn btn-ghost btn-sm h-9 w-9 p-0 rounded-lg border border-base-300/80 bg-base-100/80 hover:bg-base-300/60"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white hl-tabular">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}
    >
      {({ close }) => (
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b hl-subtle-divider">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content">
              Notifications
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 text-[11px] font-medium hl-accent-text hover:underline cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-base-300/50">
            {loading ? (
              <div className="p-4 text-center text-xs hl-muted-text">Loading notifications...</div>
            ) : error ? (
              <div className="p-4 text-center text-xs text-error">{error}</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-xs hl-muted-text">
                No notifications yet.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id || n._id}
                  type="button"
                  onClick={() => {
                    close();
                    navigate(n.matchId ? `/messages/${n.matchId}` : "/notifications");
                  }}
                  className={`w-full text-left px-3 py-2.5 hover:bg-base-200/70 transition-colors flex items-start gap-2.5 cursor-pointer ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <Avatar src={n.sender?.profilePhoto} name={n.sender?.name || "H"} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-base-content truncate">{n.title || "Activity update"}</p>
                    <p className="text-[11px] hl-muted-text line-clamp-2">{n.message}</p>
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-rose-500 mt-1 shrink-0" />}
                </button>
              ))
            )}
          </div>
          <Link
            to="/notifications"
            onClick={close}
            className="border-t hl-subtle-divider px-3 py-2 text-center text-xs font-medium hl-accent-text hover:bg-base-200/50 rounded-b-lg"
          >
            View all notifications
          </Link>
        </div>
      )}
    </Dropdown>
  );
}

export function AppShell({ title = "", subtitle = "", actions = null, fullHeight = false, children }) {
  const { user, stats, logout, backendAvailable, checkConnection } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // ignore storage errors
    }
  };

  const role = user?.role || "member";
  const isStaff = ["moderator", "admin", "superadmin"].includes(role);
  const isAdmin = ["admin", "superadmin"].includes(role);

  const primaryNav = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Discover", to: "/discover", icon: Compass },
    {
      label: "Likes",
      to: "/likes",
      icon: Heart,
      badge: stats?.likesReceivedCount > 0 ? stats.likesReceivedCount : null,
    },
    {
      label: "Matches",
      to: "/matches",
      icon: Users,
      badge: stats?.matchesCount > 0 ? stats.matchesCount : null,
    },
    { label: "Messages", to: "/messages", icon: MessageSquare },
  ];

  const accountNav = [
    { label: "Discovery Filters", to: "/search", icon: SlidersHorizontal },
    { label: "Edit Profile", to: "/profile/edit", icon: UserCheck },
    {
      label: "Notifications",
      to: "/notifications",
      icon: Bell,
      badge: stats?.unreadNotificationsCount > 0 ? stats.unreadNotificationsCount : null,
    },
    { label: "Membership", to: "/premium", icon: Crown },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  const staffNav = isStaff
    ? [
        { label: "Report Queue", to: "/admin/reports", icon: ShieldAlert },
        { label: "Support Queue", to: "/admin/support", icon: LifeBuoy },
        ...(isAdmin ? [{ label: "Admin Console", to: "/admin/dashboard", icon: Shield }] : []),
      ]
    : [];

  const filteredQuickJump = quickQuery.trim()
    ? QUICK_JUMP_ITEMS.filter((item) =>
        `${item.label} ${item.keywords}`.toLowerCase().includes(quickQuery.trim().toLowerCase()),
      )
    : [];

  const renderNavSection = (label, items, isCompact = false, onNavigate = null) => (
    <div className="space-y-1">
      {!isCompact && (
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest hl-muted-text">
          {label}
        </p>
      )}
      {items.map((item) => {
        const IconComp = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate || undefined}
            title={isCompact ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isCompact ? "justify-center px-2" : ""
              } ${
                isActive
                  ? "bg-primary/12 hl-accent-text border border-primary/20"
                  : "hl-muted-text hover:text-base-content hover:bg-base-300/50 border border-transparent"
              }`
            }
          >
            <IconComp className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {!isCompact && <span className="truncate flex-1">{item.label}</span>}
            {!isCompact && item.badge && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold hl-accent-text hl-tabular">
                {item.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  const unreadAlerts = Number(stats?.unreadNotificationsCount || 0);
  const unreadMessages = Number(stats?.unreadMessagesCount || 0);

  return (
    <div className="min-h-dvh flex flex-col bg-[#FFF5F4] dark:bg-[#151219] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      {/* Network offline banner */}
      {!backendAvailable && (
        <div
          role="alert"
          className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs flex items-center justify-between gap-2 text-amber-900 dark:text-amber-200"
        >
          <span className="font-medium">
            API connection interrupted. Some updates may pause until connection restores.
          </span>
          <Button size="xs" variant="outline" onClick={checkConnection}>
            Retry
          </Button>
        </div>
      )}

      {/* Clean Top Navigation Bar matching reference designs (06-discover.png, 09-matches.png) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#1B1720]/95 backdrop-blur-md border-b border-rose-100/70 dark:border-rose-950/40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo on Left */}
          <div className="flex items-center gap-3">
            <IconButton
              label="Open navigation drawer"
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-700 dark:text-gray-200"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </IconButton>
            <Logo to="/discover" />
          </div>

          {/* Centered Navigation Pills (Desktop) */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 p-1 rounded-full border border-rose-100/70 dark:border-gray-700 shadow-xs">
            <NavLink
              to="/discover"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#E61E50] text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-rose-50/50 dark:hover:bg-gray-700/50"
                }`
              }
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Discover</span>
            </NavLink>

            <NavLink
              to="/matches"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#E61E50] text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-rose-50/50 dark:hover:bg-gray-700/50"
                }`
              }
            >
              <Heart className="h-3.5 w-3.5" />
              <span>Matches</span>
              {stats?.matchesCount > 0 && (
                <span className="ml-1 rounded-full bg-[#E61E50] text-white text-[10px] px-1.5 py-0.5 leading-none">
                  {stats.matchesCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/messages"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#E61E50] text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-rose-50/50 dark:hover:bg-gray-700/50"
                }`
              }
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Messages</span>
              {unreadMessages > 0 && (
                <span className="ml-1 rounded-full bg-[#E61E50] text-white text-[10px] px-1.5 py-0.5 leading-none">
                  {unreadMessages}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#E61E50] text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-rose-50/50 dark:hover:bg-gray-700/50"
                }`
              }
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Alerts</span>
              {unreadAlerts > 0 && (
                <span className="ml-1 rounded-full bg-[#E61E50] text-white text-[10px] px-1.5 py-0.5 leading-none">
                  {unreadAlerts}
                </span>
              )}
            </NavLink>
          </nav>

          {/* Right Controls: Dark Mode Toggle + Profile Avatar Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle compact />

            <Dropdown
              align="right"
              widthClass="w-64"
              trigger={({ toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="User account menu"
                  className="flex items-center gap-2 rounded-full border border-rose-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 hover:ring-2 hover:ring-[#E61E50]/20 transition-all cursor-pointer"
                >
                  <Avatar
                    src={user?.profilePhoto || user?.photos?.[0]}
                    name={user?.name}
                    size="xs"
                    online={isConnected}
                  />
                  <span className="hidden sm:inline text-xs font-semibold text-gray-800 dark:text-gray-200 pr-2 max-w-28 truncate">
                    {user?.name}
                  </span>
                </button>
              )}
            >
              {({ close }) => (
                <div className="flex flex-col text-xs p-1.5">
                  <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 space-y-1">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] truncate">{user?.email}</p>
                    <RoleBadge role={role} />
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile/edit"
                      onClick={close}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-rose-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
                    >
                      <UserCheck className="h-4 w-4 text-[#E61E50]" />
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={close}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-rose-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                      Settings
                    </Link>
                    <Link
                      to="/likes"
                      onClick={close}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-rose-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
                    >
                      <Heart className="h-4 w-4 text-[#E61E50]" />
                      Liked You ({stats?.likesReceivedCount || 0})
                    </Link>
                    <Link
                      to="/premium"
                      onClick={close}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-rose-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
                    >
                      <Crown className="h-4 w-4 text-amber-500" />
                      HeartLink Premium
                    </Link>
                    {isStaff && (
                      <Link
                        to={isAdmin ? "/admin/dashboard" : "/admin/reports"}
                        onClick={close}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-rose-50 dark:hover:bg-gray-800 text-[#E61E50] font-semibold"
                      >
                        <Shield className="h-4 w-4" />
                        {isAdmin ? "Admin Console" : "Moderation Queue"}
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Main Content Area centered on Warm Blush Canvas */}
      <main
        className={
          fullHeight
            ? "flex-1 flex flex-col min-h-0 pb-16 md:pb-6"
            : "flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-6xl w-full mx-auto pb-24 md:pb-12"
        }
      >
        {children}
      </main>

      {/* Mobile Bottom Floating Navigation Bar */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden fixed bottom-3 inset-x-4 z-40 rounded-full border border-rose-200/80 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3 py-2 flex items-center justify-around shadow-xl"
      >
        {[
          { label: "Discover", to: "/discover", icon: Compass },
          { label: "Matches", to: "/matches", icon: Heart, badge: stats?.matchesCount },
          { label: "Chat", to: "/messages", icon: MessageSquare, badge: unreadMessages },
          { label: "Alerts", to: "/notifications", icon: Bell, badge: unreadAlerts },
          { label: "Profile", to: "/profile/edit", icon: UserCheck },
        ].map((item) => {
          const IconComp = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                  isActive ? "text-[#E61E50]" : "text-gray-500 dark:text-gray-400 hover:text-gray-900"
                }`
              }
            >
              <IconComp className="h-4 w-4" strokeWidth={2} />
              <span>{item.label}</span>
              {Boolean(item.badge && item.badge > 0) && (
                <span className="absolute top-0 right-1 h-2 w-2 rounded-full bg-[#E61E50] ring-2 ring-white dark:ring-gray-900" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Mobile Drawer */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="HeartLink"
        subtitle={user?.email}
        side="left"
        widthClass="max-w-xs"
      >
        <div className="space-y-4 pt-2">
          {renderNavSection("Dating & Matches", primaryNav, false, () => setMobileMenuOpen(false))}
          {renderNavSection("My Profile & Settings", accountNav, false, () => setMobileMenuOpen(false))}
          {staffNav.length > 0 && renderNavSection("Safety & Moderation", staffNav, false, () => setMobileMenuOpen(false))}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between px-2">
            <span className="text-xs font-medium text-gray-500">Theme</span>
            <ThemeToggle showSystem />
          </div>
          <Button
            variant="soft-danger"
            fullWidth
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
          >
            Sign out
          </Button>
        </div>
      </Drawer>
    </div>
  );
}

export function RequireMember({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-base-200">
        <PageSpinner label="Verifying your session..." />
      </div>
    );
  }

  if (!user) {
    return <LinkRedirectToLogin from={location.pathname} />;
  }

  return children;
}

function LinkRedirectToLogin({ from }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/login", { replace: true, state: { from } });
  }, [navigate, from]);
  return null;
}
