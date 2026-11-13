import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  Database,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  Dropdown,
  IconButton,
  Logo,
  PageSpinner,
  RoleBadge,
  SearchBar,
  ThemeToggle,
} from "../../components/ui";

const ADMIN_SIDEBAR_KEY = "hl_admin_sidebar_collapsed";

const ROLE_LEVELS = {
  member: 0,
  moderator: 1,
  admin: 2,
  superadmin: 3,
};

function hasMinRole(userRole, minRole) {
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[minRole] || 0);
}

const ADMIN_NAV_GROUPS = [
  {
    section: "Overview",
    minRole: "admin",
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, minRole: "admin" },
      { label: "Analytics", to: "/admin/analytics", icon: BarChart3, minRole: "admin" },
    ],
  },
  {
    section: "Moderation & Support",
    minRole: "moderator",
    items: [
      { label: "Moderation Overview", to: "/admin/moderation", icon: LayoutDashboard, minRole: "moderator" },
      { label: "Report Queue", to: "/admin/reports", icon: ShieldAlert, minRole: "moderator" },
      { label: "Support Tickets", to: "/admin/support", icon: LifeBuoy, minRole: "moderator" },
    ],
  },
  {
    section: "Users & Governance",
    minRole: "admin",
    items: [
      { label: "Users", to: "/admin/users", icon: Users, minRole: "admin" },
      { label: "Roles & Access", to: "/admin/roles", icon: Shield, minRole: "superadmin" },
    ],
  },
  {
    section: "Security & Audit",
    minRole: "admin",
    items: [
      { label: "Activity Logs", to: "/admin/activity", icon: Activity, minRole: "admin" },
      { label: "Security Center", to: "/admin/security", icon: Lock, minRole: "admin" },
      { label: "Admin Audit Logs", to: "/admin/audit-logs", icon: FileText, minRole: "admin" },
    ],
  },
  {
    section: "Infrastructure",
    minRole: "admin",
    items: [
      { label: "Database Monitor", to: "/admin/database", icon: Database, minRole: "superadmin" },
      { label: "System Health", to: "/admin/system", icon: Server, minRole: "admin" },
    ],
  },
  {
    section: "Preferences",
    minRole: "moderator",
    items: [
      { label: "Admin Alerts", to: "/admin/notifications", icon: Bell, minRole: "moderator" },
      { label: "Console Settings", to: "/admin/settings", icon: Settings, minRole: "moderator" },
    ],
  },
];

export function RequireAdmin({ children, minRole = "moderator" }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-base-200">
        <PageSpinner label="Verifying console permissions..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!hasMinRole(user.role, minRole)) {
    const fallback = user.role === "moderator" ? "/admin/moderation" : "/dashboard";
    if (user.role === "member") {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-base-200 p-4">
          <Card className="max-w-md text-center space-y-4">
            <Badge tone="danger">Restricted Area</Badge>
            <h1 className="text-lg font-semibold text-base-content">Staff Privileges Required</h1>
            <p className="text-xs hl-muted-text">
              Your account has the Member role and cannot access administrative routes.
            </p>
            <Link to="/dashboard" className="block">
              <Button fullWidth>Return to Member Workspace</Button>
            </Link>
          </Card>
        </div>
      );
    }
    return <Navigate to={fallback} replace />;
  }

  return children || <Outlet />;
}

export function AdminLogin() {
  const location = useLocation();
  return <Navigate to="/login" replace state={{ from: location.state?.from || "/admin/dashboard" }} />;
}

export function AdminLayout({ children = null }) {
  const { user, logout, backendAvailable } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_SIDEBAR_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadAdminAlerts, setUnreadAdminAlerts] = useState(0);
  const [jumpQuery, setJumpQuery] = useState("");

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    api
      .get("/admin/notifications?limit=1")
      .then(({ data }) => {
        if (active) setUnreadAdminAlerts(Number(data.unreadCount || 0));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const role = user?.role || "member";
  const visibleGroups = ADMIN_NAV_GROUPS.filter((g) => hasMinRole(role, g.minRole))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasMinRole(role, item.minRole)),
    }))
    .filter((group) => group.items.length > 0);

  const allAllowedItems = visibleGroups.flatMap((g) => g.items);
  const matchedItems = jumpQuery.trim()
    ? allAllowedItems.filter((item) =>
        `${item.label} ${item.to}`.toLowerCase().includes(jumpQuery.trim().toLowerCase()),
      )
    : [];

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(ADMIN_SIDEBAR_KEY, String(next));
    } catch {
      // ignore
    }
  };

  const renderSidebarContent = (isCompact = false, onSelect = null) => (
    <div className="space-y-4">
      {visibleGroups.map((group) => (
        <div key={group.section} className="space-y-1">
          {!isCompact && (
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest hl-muted-text">
              {group.section}
            </p>
          )}
          {group.items.map((item) => {
            const IconComp = item.icon;
            const showBadge = item.to === "/admin/notifications" && unreadAdminAlerts > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onSelect || undefined}
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
                {!isCompact && showBadge && (
                  <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hl-tabular">
                    {unreadAdminAlerts}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-dvh flex bg-base-200 text-base-content">
      {/* Desktop Sidebar */}
      <aside
        aria-label="Admin sidebar"
        className={`hidden md:flex flex-col shrink-0 border-r hl-subtle-divider bg-base-100 sticky top-0 h-dvh transition-all duration-200 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className={`h-16 flex items-center border-b hl-subtle-divider px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
          <Logo
            to={hasMinRole(role, "admin") ? "/admin/dashboard" : "/admin/moderation"}
            compact={collapsed}
            badge={role === "superadmin" ? "Root" : role === "moderator" ? "Mod" : "Admin"}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {renderSidebarContent(collapsed)}
        </div>

        <div className="border-t hl-subtle-divider p-3">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium hl-muted-text hover:text-base-content hover:bg-base-200 transition-colors ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Back to Member App</span>}
          </Link>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {!backendAvailable && (
          <div role="alert" className="bg-warning/15 border-b border-warning/30 px-4 py-2 text-xs font-medium">
            Warning: API connectivity interrupted.
          </div>
        )}

        <header className="sticky top-0 z-30 h-16 border-b hl-subtle-divider bg-base-100/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <IconButton
              label="Open console menu"
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </IconButton>

            <IconButton
              label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
              onClick={toggleCollapsed}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </IconButton>

            <div className="relative hidden sm:block w-full max-w-xs lg:max-w-sm">
              <SearchBar
                value={jumpQuery}
                onChange={(e) => setJumpQuery(e.target.value)}
                onClear={() => setJumpQuery("")}
                placeholder="Jump to admin module..."
                label="Jump to admin module"
              />
              {matchedItems.length > 0 && (
                <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl">
                  {matchedItems.map((item) => (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        setJumpQuery("");
                        navigate(item.to);
                      }}
                      className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-base-content hover:bg-base-200 flex items-center justify-between cursor-pointer"
                    >
                      <span>{item.label}</span>
                      <span className="hl-muted-text text-[11px]">{item.to}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Link to="/admin/notifications">
              <IconButton label="Admin notifications" variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadAdminAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white flex items-center justify-center hl-tabular">
                    {unreadAdminAlerts}
                  </span>
                )}
              </IconButton>
            </Link>

            <Dropdown
              align="right"
              widthClass="w-60"
              trigger={({ toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Operator profile menu"
                  className="inline-flex items-center gap-2 rounded-lg border border-base-300/80 bg-base-100 px-2 py-1 hover:bg-base-200 transition-colors cursor-pointer"
                >
                  <Avatar src={user?.profilePhoto} name={user?.name} size="xs" />
                  <div className="hidden lg:flex flex-col items-start text-left">
                    <span className="text-xs font-semibold text-base-content max-w-28 truncate">
                      {user?.name}
                    </span>
                  </div>
                  <RoleBadge role={role} className="hidden sm:inline-flex" />
                </button>
              )}
            >
              {({ close }) => (
                <div className="flex flex-col text-xs">
                  <div className="px-3 py-2.5 border-b hl-subtle-divider space-y-1">
                    <p className="font-semibold text-base-content truncate">{user?.name}</p>
                    <p className="hl-muted-text truncate">{user?.email}</p>
                    <RoleBadge role={role} />
                  </div>
                  <div className="py-1">
                    <Link
                      to="/admin/settings"
                      onClick={close}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-base-200 text-base-content"
                    >
                      <Settings className="h-3.5 w-3.5" /> Console Settings
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={close}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-base-200 text-base-content"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Member Workspace
                    </Link>
                  </div>
                  <div className="border-t hl-subtle-divider pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        logout();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-error hover:bg-error/10 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </Dropdown>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Console Navigation"
        subtitle={`${user?.name || "Operator"} (${role})`}
        side="left"
        widthClass="max-w-xs"
      >
        <div className="space-y-4">
          {renderSidebarContent(false, () => setMobileOpen(false))}
          <div className="border-t hl-subtle-divider pt-3 flex items-center justify-between px-2">
            <span className="text-xs font-medium hl-muted-text">Theme</span>
            <ThemeToggle showSystem />
          </div>
          <Button
            variant="soft-danger"
            fullWidth
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={() => {
              setMobileOpen(false);
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
