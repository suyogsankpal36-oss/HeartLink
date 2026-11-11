/**
 * AdminPages.jsx
 * All admin panel pages and shared components for HeartLink admin panel.
 */
import { useState, useEffect, useCallback } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

function renderUserRef(ref) {
  if (!ref) return "—";
  if (typeof ref === "string") return ref;
  return ref.name || ref.email || ref._id || ref.id || "—";
}

function formatMeta(val) {
  if (!val) return "—";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const entries = Object.entries(val).filter(([, v]) => v !== undefined && v !== null && v !== "");
    if (!entries.length) return "—";
    return entries.slice(0, 4).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" · ");
  }
  return String(val);
}

function fmtBytes(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  if (typeof bytes !== "number") return String(bytes);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─────────────────────────────────────────────
// CSS variable helpers
// ─────────────────────────────────────────────
const s = {
  bg: "var(--admin-bg)",
  surface: "var(--admin-surface)",
  border: "var(--admin-border)",
  text: "var(--admin-text)",
  muted: "var(--admin-text-muted)",
  primary: "var(--admin-primary)",
  danger: "var(--admin-danger)",
  success: "var(--admin-success)",
  warning: "var(--admin-warning)",
};

// ─────────────────────────────────────────────
// SHARED UTILITIES
// ─────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

function fmtDateShort(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="admin-loading-skeleton" style={{ padding: "40px", textAlign: "center" }}>
      <div style={{ display: "inline-block", width: 32, height: 32, borderRadius: "50%", border: `3px solid ${s.border}`, borderTopColor: s.primary, animation: "spin .8s linear infinite", marginBottom: 12 }} />
      <div style={{ color: s.muted, fontSize: 13 }}>{label}</div>
    </div>
  );
}

export function EmptyState({ title = "Nothing here", desc = "", icon = "📭" }) {
  return (
    <div className="admin-empty-state" style={{ padding: "60px 20px", textAlign: "center", color: s.muted }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: s.text, marginBottom: 6 }}>{title}</div>
      {desc && <div style={{ fontSize: 13 }}>{desc}</div>}
    </div>
  );
}

export function ConfirmationModal({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <h3 style={{ margin: "0 0 10px", color: s.text }}>{title}</h3>
        <p style={{ margin: "0 0 20px", color: s.muted, fontSize: 14 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="admin-btn" onClick={onCancel}>Cancel</button>
          <button className={danger ? "admin-btn admin-btn-danger" : "admin-btn admin-btn-primary"} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="admin-btn" title="Toggle theme" style={{ padding: "6px 12px", fontSize: 16, lineHeight: 1 }}>
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

export function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="admin-stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: s.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: color || s.primary }}>{value ?? "—"}</div>
          {sub && <div style={{ fontSize: 11, color: s.muted, marginTop: 4 }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: 24 }}>{icon}</div>}
      </div>
    </div>
  );
}

export function PermissionGuard({ role, children }) {
  const { user } = useAuth();
  const hierarchy = ["member", "moderator", "admin", "superadmin"];
  const userLevel = hierarchy.indexOf(user?.role);
  const requiredLevel = hierarchy.indexOf(role);
  if (userLevel < requiredLevel) return null;
  return children;
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <button className="admin-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span style={{ fontSize: 13, color: s.muted }}>Page {page} of {totalPages}</span>
      <button className="admin-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ padding: "14px 16px", border: `1px solid ${s.danger}`, borderRadius: 10, background: "rgba(220,53,69,0.08)", color: s.danger, fontSize: 13, margin: "16px 0", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ flex: 1 }}>⚠️ {message}</span>
      {onRetry && <button className="admin-btn" onClick={onRetry} style={{ flex: "none" }}>Retry</button>}
    </div>
  );
}

function Badge({ type = "info", children }) {
  return <span className={`admin-badge admin-badge-${type}`}>{children}</span>;
}

// ─────────────────────────────────────────────
// PROTECTED ROUTE GUARD
// ─────────────────────────────────────────────
export function ProtectedAdminRoute({ allowedRoles = ["admin", "moderator", "superadmin"] } = {}) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <LoadingState label="Checking admin access…" />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/discover" replace />;
  return <Outlet />;
}

export function RequireAdminRoles({ roles = ["admin", "superadmin"], children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <LoadingState label="Checking permissions…" />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!roles.includes(user?.role)) {
    return <Navigate to={user?.role === "moderator" ? "/admin/notifications" : "/admin/dashboard"} replace />;
  }
  return children;
}

export function AdminIndexRedirect() {
  const { user, authLoading } = useAuth();
  if (authLoading) return <LoadingState label="Opening admin panel…" />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role === "moderator") return <Navigate to="/admin/notifications" replace />;
  if (["admin", "superadmin"].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/discover" replace />;
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
export function AdminSidebar({ isOpen = false, onClose = () => {} }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const role = user?.role || "member";
  const adminHome = role === "moderator" ? "/admin/notifications" : "/admin/dashboard";

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: "🏠", roles: ["admin", "superadmin"] },
    { to: "/admin/users", label: "Users", icon: "👥", roles: ["admin", "superadmin"] },
    { to: "/admin/roles", label: "Roles", icon: "🛡️", roles: ["superadmin"] },
    { to: "/admin/activity", label: "Activity", icon: "📋", roles: ["admin", "superadmin"] },
    { to: "/admin/analytics", label: "Analytics", icon: "📊", roles: ["admin", "superadmin"] },
    { to: "/admin/security", label: "Security", icon: "🔒", roles: ["admin", "superadmin"] },
    { to: "/admin/audit-logs", label: "Audit Logs", icon: "📜", roles: ["admin", "superadmin"] },
    { to: "/admin/database", label: "Database", icon: "🗄️", roles: ["superadmin"] },
    { to: "/admin/system", label: "System Health", icon: "💻", roles: ["admin", "superadmin"] },
    { to: "/admin/notifications", label: "Notifications", icon: "🔔", roles: ["moderator", "admin", "superadmin"] },
    { to: "/admin/reports", label: "Reports Queue", icon: "⚠️", roles: ["moderator", "admin", "superadmin"] },
    { to: "/admin/support", label: "Support Queue", icon: "🎫", roles: ["moderator", "admin", "superadmin"] },
    { to: "/admin/settings", label: "Settings", icon: "⚙️", roles: ["admin", "superadmin"] },
  ].filter((item) => item.roles.includes(role));

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      <div style={{ padding: "0 8px 20px", borderBottom: `1px solid ${s.border}`, marginBottom: 16 }}>
        <Link to={adminHome} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: s.primary, display: "grid", placeItems: "center", color: "#fff", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>❤</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: s.text }}>HeartLink <span style={{ color: s.muted, fontWeight: 400 }}>Admin</span></span>
        </Link>
      </div>
      <nav style={{ display: "grid", gap: 2 }}>
        {navItems.map((l) => {
          const active = pathname === l.to || (l.to !== "/admin/dashboard" && pathname.startsWith(l.to));
          return (
            <Link key={l.to} to={l.to} onClick={onClose} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10,
              background: active ? `${s.primary}18` : "transparent",
              color: active ? s.primary : s.muted,
              fontWeight: active ? 700 : 500,
              fontSize: 13, textDecoration: "none", transition: "all .15s",
            }}>
              <span>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", padding: "16px 12px", borderTop: `1px solid ${s.border}` }}>
        <div style={{ fontSize: 11, color: s.muted, marginBottom: 4 }}>Signed in as</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{user?.name}</div>
        <Badge type={user?.role === "superadmin" ? "danger" : user?.role === "admin" ? "warning" : "info"}>{user?.role}</Badge>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────
export function AdminNavbar({ onToggleSidebar = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <header className="admin-navbar">
      <button type="button" className="admin-btn admin-menu-toggle" onClick={onToggleSidebar} aria-label="Toggle admin menu" style={{ fontSize: 16, padding: "4px 10px" }}>☰</button>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link to="/discover" className="admin-btn" style={{ fontSize: 12, padding: "5px 10px" }}>App</Link>
        <ThemeToggle />
        <Link to="/admin/notifications" style={{ color: s.muted, fontSize: 20, textDecoration: "none" }} aria-label="Admin notifications">🔔</Link>
        <span style={{ fontSize: 13, color: s.text, fontWeight: 600 }}>{user?.name}</span>
        <button className="admin-btn admin-btn-danger" onClick={handleLogout} style={{ fontSize: 12, padding: "6px 14px" }}>Logout</button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────
export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: s.bg, color: s.text }}>
      <div className={`admin-sidebar-backdrop ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AdminNavbar onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main className="admin-main-content" style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN LOGIN
// ─────────────────────────────────────────────
export function AdminLogin() {
  const { user, authLoading, authenticate, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user && ["admin", "moderator", "superadmin"].includes(user.role)) {
      navigate(user.role === "moderator" ? "/admin/notifications" : "/admin/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await authenticate("login", { email, password });
      const role = data?.user?.role;
      if (!["admin", "moderator", "superadmin"].includes(role)) {
        await logout();
        setError("Access denied. Staff, Admin, or Super Admin privileges are required.");
        return;
      }
      navigate(role === "moderator" ? "/admin/notifications" : "/admin/dashboard", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Login failed. Check credentials."));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <LoadingState label="Checking session…" />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: s.bg }}>
      <div className="admin-card" style={{ width: "100%", maxWidth: 420, padding: 36 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>❤️</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: s.text }}>HeartLink Admin</h1>
          <p style={{ margin: "6px 0 0", color: s.muted, fontSize: 13 }}>Sign in to access the admin panel</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <ErrorBanner message={error} />}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: s.text, marginBottom: 6 }}>Email</label>
            <input className="admin-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@heartlink.app" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: s.text, marginBottom: 6 }}>Password</label>
            <input className="admin-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button className="admin-btn admin-btn-primary" type="submit" disabled={loading} style={{ width: "100%", padding: "11px 0", fontSize: 14 }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link to="/" style={{ color: s.muted, fontSize: 12 }}>← Back to HeartLink</Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────
export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/dashboard");
      setData(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load dashboard data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: s.text }}>Dashboard</h1>
      <p style={{ margin: "0 0 24px", color: s.muted, fontSize: 13 }}>Overview of your HeartLink platform</p>

      {loading && <LoadingState label="Loading dashboard…" />}
      {error && <ErrorBanner message={error} onRetry={load} />}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
            <StatCard label="Total Users" value={data.stats?.totalUsers ?? data.totalUsers ?? "—"} icon="👥" />
            <StatCard label="Active Users" value={data.stats?.activeUsers ?? data.activeUsers ?? "—"} icon="✅" color={s.success} />
            <StatCard label="New Today" value={data.stats?.newToday ?? data.newToday ?? "—"} icon="🆕" color={s.warning} />
            <StatCard label="Total Matches" value={data.stats?.totalMatches ?? data.totalMatches ?? "—"} icon="💞" color={s.primary} />
            <StatCard label="Messages Sent" value={data.stats?.messagesSent ?? data.messagesSent ?? "—"} icon="💬" />
            <StatCard label="Reports" value={data.stats?.openReports ?? data.openReports ?? "—"} icon="⚠️" color={s.danger} />
          </div>

          {data.recentUsers && data.recentUsers.length > 0 && (
            <div className="admin-card" style={{ marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: s.text }}>Recent Users</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentUsers.map((u) => (
                      <tr key={u._id || u.id}>
                        <td><Link to={`/admin/users/${u._id || u.id}`} style={{ color: s.primary, textDecoration: "none", fontWeight: 600 }}>{u.name}</Link></td>
                        <td style={{ color: s.muted }}>{u.email}</td>
                        <td><Badge type={u.role === "superadmin" ? "danger" : u.role === "admin" ? "warning" : "info"}>{u.role}</Badge></td>
                        <td><Badge type={u.isActive === false ? "danger" : "success"}>{u.isActive === false ? "Suspended" : "Active"}</Badge></td>
                        <td style={{ color: s.muted, fontSize: 12 }}>{fmtDateShort(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(data.recentActivities || data.recentActivity)?.length > 0 && (
            <div className="admin-card">
              <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: s.text }}>Recent Activity</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Action</th><th>User</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {(data.recentActivities || data.recentActivity).map((a, i) => (
                      <tr key={a._id || i}>
                        <td>{a.action || a.type}</td>
                        <td style={{ color: s.muted }}>{renderUserRef(a.user || a.userId)}</td>
                        <td style={{ color: s.muted, fontSize: 12 }}>{fmtDate(a.createdAt || a.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────
export function UserManagement({ roleFilter } = {}) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(roleFilter || "");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (role) params.role = role;
      if (status) params.status = status;
      const res = await api.get("/admin/users", { params });
      const d = res.data;
      setUsers(d.users || d.data || []);
      setTotalPages(d.totalPages || d.pages || 1);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const handleStatusChange = async (userId, nextIsActive) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: nextIsActive });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Action failed."));
    }
    setConfirm(null);
  };

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: s.text }}>{roleFilter ? "Role Management" : "User Management"}</h1>
      <p style={{ margin: "0 0 20px", color: s.muted, fontSize: 13 }}>Manage and monitor platform users</p>

      <div className="admin-card" style={{ marginBottom: 16, padding: "14px 16px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: s.muted, display: "block", marginBottom: 4 }}>Search</label>
            <input className="admin-input" placeholder="Name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {!roleFilter && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: s.muted, display: "block", marginBottom: 4 }}>Role</label>
              <select className="admin-select" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
                <option value="">All Roles</option>
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: s.muted, display: "block", marginBottom: 4 }}>Status</label>
            <select className="admin-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
            </select>
          </div>
          <button className="admin-btn admin-btn-primary" type="submit">Search</button>
        </form>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? <LoadingState /> : (
        users.length === 0 ? <EmptyState title="No users found" icon="👤" /> : (
          <div className="admin-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Active</th><th>Joined</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const uid = u._id || u.id;
                    const isSuspended = u.isActive === false;
                    const isSelf = String(uid) === String(currentUser?._id || currentUser?.id);
                    const protectedTarget = ["superadmin", "admin"].includes(u.role) && currentUser?.role !== "superadmin";
                    return (
                      <tr key={uid}>
                        <td>
                          <Link to={`/admin/users/${uid}`} style={{ color: s.primary, textDecoration: "none", fontWeight: 600 }}>
                            {u.name || "—"}
                          </Link>
                        </td>
                        <td style={{ color: s.muted, fontSize: 12 }}>{u.email}</td>
                        <td><Badge type={u.role === "superadmin" ? "danger" : u.role === "admin" ? "warning" : "info"}>{u.role}</Badge></td>
                        <td><Badge type={isSuspended ? "danger" : "success"}>{isSuspended ? "Suspended" : "Active"}</Badge></td>
                        <td style={{ color: s.muted, fontSize: 12 }}>{fmtDateShort(u.lastActive)}</td>
                        <td style={{ color: s.muted, fontSize: 12 }}>{fmtDateShort(u.createdAt)}</td>
                        <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Link to={`/admin/users/${uid}`} className="admin-btn" style={{ fontSize: 11, padding: "4px 10px" }}>View</Link>
                          <button
                            disabled={isSelf || protectedTarget}
                            className={isSuspended ? "admin-btn admin-btn-primary" : "admin-btn admin-btn-danger"}
                            style={{ fontSize: 11, padding: "4px 10px" }}
                            onClick={() => setConfirm({ userId: uid, nextActive: isSuspended, name: u.name })}
                          >
                            {isSuspended ? "Activate" : "Suspend"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )
      )}

      {confirm && (
        <ConfirmationModal
          title={confirm.nextActive ? "Activate User" : "Suspend User"}
          message={`Are you sure you want to ${confirm.nextActive ? "activate" : "suspend"} ${confirm.name}?`}
          danger={!confirm.nextActive}
          onConfirm={() => handleStatusChange(confirm.userId, confirm.nextActive)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// USER DETAILS
// ─────────────────────────────────────────────
export function UserDetails() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const canManageAdmin = ["admin", "superadmin"].includes(currentUser?.role);
  const isSuperAdmin = currentUser?.role === "superadmin";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const requests = [api.get(`/admin/users/${id}`)];
      if (canManageAdmin) {
        requests.push(api.get(`/admin/users/${id}/activities`, { params: { limit: 15 } }).catch(() => ({ data: { activities: [] } })));
      }
      const [userRes, actRes] = await Promise.all(requests);
      setUser(userRes.data.user || userRes.data);
      setActivities(actRes?.data?.activities || []);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load user."));
    } finally {
      setLoading(false);
    }
  }, [id, canManageAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (newRole) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const handleToggleStatus = async () => {
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive: user.isActive === false });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!user) return <EmptyState title="User not found" icon="👤" />;

  const isSelf = String(user._id || user.id) === String(currentUser?._id || currentUser?.id);
  const canChangeStatus = canManageAdmin && !isSelf && (!["admin", "superadmin"].includes(user.role) || isSuperAdmin);

  const rows = [
    ["Email", user.email],
    ["Role", isSuperAdmin && !isSelf ? (
      <select className="admin-select" value={user.role} onChange={e => handleRoleChange(e.target.value)} style={{ fontSize: 12 }}>
        <option value="member">Member</option>
        <option value="moderator">Moderator</option>
        <option value="admin">Admin</option>
        <option value="superadmin">Superadmin</option>
      </select>
    ) : <Badge type={user.role === "superadmin" ? "danger" : user.role === "admin" ? "warning" : "info"}>{user.role}</Badge>],
    ["Status", <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Badge type={user.isActive === false ? "danger" : "success"}>{user.isActive === false ? "Suspended" : "Active"}</Badge>
      {canChangeStatus && (
        <button className={user.isActive === false ? "admin-btn admin-btn-primary" : "admin-btn admin-btn-danger"} style={{ fontSize: 11, padding: "4px 10px" }} onClick={handleToggleStatus}>
          {user.isActive === false ? "Activate" : "Suspend"}
        </button>
      )}
    </div>],
    ["Joined", fmtDate(user.createdAt)],
    ["Last Active", fmtDate(user.lastActive || user.lastLogin)],
    ["Location", user.city || user.location?.city || "—"],
    ["Age", user.age || (user.dateOfBirth ? Math.floor((Date.now() - new Date(user.dateOfBirth)) / 31536000000) : "—")],
    ["Email Verified", user.isEmailVerified ? "✅ Yes" : "No"],
    ["Profile Verified", user.isVerified ? "✅ Yes" : "No"],
  ];

  return (
    <div>
      <button onClick={() => navigate(-1)} className="admin-btn" style={{ marginBottom: 16 }}>← Back</button>
      <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, color: s.text }}>{user.name}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <div className="admin-card">
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: s.text }}>Profile Info</h2>
          <table className="admin-table">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td style={{ fontWeight: 600, color: s.muted, width: "40%" }}>{k}</td>
                  <td style={{ color: s.text }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          {user.bio && (
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: s.text }}>Bio</h2>
              <p style={{ margin: 0, color: s.muted, fontSize: 13, lineHeight: 1.7 }}>{user.bio}</p>
            </div>
          )}
          {user.interests && user.interests.length > 0 && (
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: s.text }}>Interests</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {user.interests.map((i) => (
                  <Badge key={i} type="info">{i}</Badge>
                ))}
              </div>
            </div>
          )}
          {canManageAdmin && (
            <div className="admin-card">
              <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: s.text }}>Recent User Activity</h2>
              {activities.length === 0 ? (
                <div style={{ color: s.muted, fontSize: 12 }}>No recorded activity yet.</div>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Action</th><th>Category</th><th>Time</th></tr></thead>
                  <tbody>
                    {activities.map((a, idx) => (
                      <tr key={a._id || idx}>
                        <td style={{ fontSize: 12 }}>{a.action}</td>
                        <td><Badge type="info">{a.category || "system"}</Badge></td>
                        <td style={{ color: s.muted, fontSize: 11 }}>{fmtDate(a.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ACTIVITY MONITORING
// ─────────────────────────────────────────────
export function ActivityMonitoring() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 25 };
      if (category) params.category = category;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/admin/activities", { params });
      const d = res.data;
      setLogs(d.activities || d.logs || d.data || []);
      setTotalPages(d.totalPages || d.pages || 1);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load activity logs."));
    } finally {
      setLoading(false);
    }
  }, [page, category, search]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const header = ["Action", "Category", "User", "Description", "IP", "Timestamp"];
    const rows = logs.map((l) => [
      l.action || "",
      l.category || "",
      renderUserRef(l.user || l.userId),
      (l.description || formatMeta(l.details || l.metadata)).replace(/"/g, '""'),
      l.ip || "",
      l.createdAt || "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `heartlink-activities-p${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: s.text }}>Activity Monitoring</h1>
      <p style={{ margin: "0 0 20px", color: s.muted, fontSize: 13 }}>Real-time platform activity logs</p>

      <div className="admin-card" style={{ marginBottom: 16, padding: "14px 16px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input className="admin-input" style={{ flex: "1 1 200px" }} placeholder="Search action or description…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="admin-select" style={{ width: 180 }} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          <option value="auth">Auth</option>
          <option value="profile">Profile</option>
          <option value="discovery">Discovery</option>
          <option value="messaging">Messaging</option>
          <option value="security">Security</option>
          <option value="admin">Admin</option>
          <option value="system">System</option>
        </select>
        <button className="admin-btn admin-btn-primary" onClick={() => load()}>Refresh</button>
        {logs.length > 0 && <button className="admin-btn" onClick={exportCsv}>Export CSV</button>}
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? <LoadingState /> : (
        logs.length === 0 ? <EmptyState title="No activity logs" icon="📋" /> : (
          <div className="admin-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Category</th><th>Action</th><th>User</th><th>Details</th><th>IP</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={l._id || i}>
                      <td><Badge type="info">{l.category || l.type || "system"}</Badge></td>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{l.action || "—"}</td>
                      <td style={{ color: s.muted, fontSize: 12 }}>{renderUserRef(l.user || l.userId)}</td>
                      <td style={{ color: s.muted, fontSize: 12, maxWidth: 300 }}>{l.description || formatMeta(l.details || l.metadata)}</td>
                      <td style={{ color: s.muted, fontSize: 12 }}>{l.ip || "—"}</td>
                      <td style={{ color: s.muted, fontSize: 11 }}>{fmtDate(l.createdAt || l.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────
export function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("30d");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/analytics", { params: { period } });
      setData(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load analytics."));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: s.text }}>Analytics</h1>
      <p style={{ margin: "0 0 20px", color: s.muted, fontSize: 13 }}>Platform performance metrics and trends</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {["7d", "30d", "90d", "1y"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`admin-btn ${period === p ? "admin-btn-primary" : ""}`}
            style={{ fontSize: 12, padding: "6px 14px" }}>
            {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : "1 Year"}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? <LoadingState /> : !data ? <EmptyState title="No data available" icon="📊" /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard label="New Users" value={data.newUsers ?? data.users?.total ?? "—"} icon="👤" />
            <StatCard label="New Matches" value={data.newMatches ?? data.matches?.total ?? "—"} icon="💞" color={s.primary} />
            <StatCard label="Messages" value={data.messages ?? data.messages?.total ?? "—"} icon="💬" />
            <StatCard label="Avg Session" value={data.avgSession ?? "—"} icon="⏱️" color={s.warning} sub="minutes" />
            <StatCard label="Retention" value={data.retention ? `${data.retention}%` : "—"} icon="🔄" color={s.success} />
            <StatCard label="Conversion" value={data.conversion ? `${data.conversion}%` : "—"} icon="💎" />
          </div>

          {data.dailySignups && (
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: s.text }}>Daily Signups</h2>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead><tr><th>Date</th><th>Signups</th><th>Matches</th><th>Messages</th></tr></thead>
                  <tbody>
                    {data.dailySignups.map((r, i) => (
                      <tr key={i}>
                        <td style={{ color: s.muted, fontSize: 12 }}>{fmtDateShort(r.date || r._id)}</td>
                        <td>{r.signups ?? r.count ?? "—"}</td>
                        <td style={{ color: s.muted }}>{r.matches ?? "—"}</td>
                        <td style={{ color: s.muted }}>{r.messages ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.topLocations && (
            <div className="admin-card">
              <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: s.text }}>Top Locations</h2>
              <table className="admin-table">
                <thead><tr><th>Location</th><th>Users</th><th>% of Total</th></tr></thead>
                <tbody>
                  {data.topLocations.map((l, i) => (
                    <tr key={i}>
                      <td>{l.city || l.location || l._id || "—"}</td>
                      <td>{l.count || l.users}</td>
                      <td style={{ color: s.muted }}>{l.percentage ? `${l.percentage}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SECURITY CENTER
// ─────────────────────────────────────────────
export function SecurityCenter() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [severity, setSeverity] = useState("");
  const [type, setType] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 25 };
      if (severity) params.severity = severity;
      if (type) params.type = type;
      const res = await api.get("/admin/security", { params });
      const d = res.data;
      setEvents(d.events || d.data || []);
      setTotalPages(d.totalPages || d.pages || 1);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load security events."));
    } finally {
      setLoading(false);
    }
  }, [page, severity, type]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: s.text }}>Security Center</h1>
      <p style={{ margin: "0 0 20px", color: s.muted, fontSize: 13 }}>Monitor security events and threats</p>

      <div className="admin-card" style={{ marginBottom: 16, padding: "14px 16px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <select className="admin-select" style={{ width: 170 }} value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}>
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select className="admin-select" style={{ width: 200 }} value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
          <option value="">All Event Types</option>
          <option value="failed_login">Failed Login</option>
          <option value="unauthorized_api">Unauthorized API</option>
          <option value="suspicious_access">Suspicious Access</option>
          <option value="account_lockout">Account Lockout</option>
          <option value="role_change">Role Change</option>
          <option value="password_change">Password Change</option>
          <option value="admin_login">Admin Login</option>
        </select>
        <button className="admin-btn admin-btn-primary" onClick={() => load()}>Refresh</button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? <LoadingState /> : (
        events.length === 0 ? <EmptyState title="No security events" icon="🔒" desc="All clear — no suspicious activity detected." /> : (
          <div className="admin-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Event</th><th>Severity</th><th>User / IP</th><th>Details</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {events.map((e, i) => {
                    const sev = e.severity || "low";
                    const actor = renderUserRef(e.user || e.userId);
                    return (
                      <tr key={e._id || i}>
                        <td style={{ fontWeight: 600 }}>{e.type || e.event || e.action || "—"}</td>
                        <td><Badge type={sev === "critical" || sev === "high" ? "danger" : sev === "medium" ? "warning" : "info"}>{sev}</Badge></td>
                        <td style={{ color: s.muted, fontSize: 12 }}>{actor !== "—" ? `${actor} (${e.ip || "—"})` : (e.ip || "—")}</td>
                        <td style={{ color: s.muted, fontSize: 12, maxWidth: 280 }}>{formatMeta(e.details || e.description)}</td>
                        <td style={{ color: s.muted, fontSize: 11 }}>{fmtDate(e.createdAt || e.timestamp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────
export function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [action, setAction] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 25 };
      if (action) params.action = action;
      const res = await api.get("/admin/audit-logs", { params });
      const d = res.data;
      setLogs(d.logs || d.auditLogs || d.data || []);
      setTotalPages(d.totalPages || d.pages || 1);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load audit logs."));
    } finally {
      setLoading(false);
    }
  }, [page, action]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: s.text }}>Audit Logs</h1>
      <p style={{ margin: "0 0 20px", color: s.muted, fontSize: 13 }}>Comprehensive record of all admin actions</p>

      <div className="admin-card" style={{ marginBottom: 16, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
        <select className="admin-select" style={{ width: 220 }} value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="user_suspended">User Suspended</option>
          <option value="user_activated">User Activated</option>
          <option value="role_changed">Role Changed</option>
          <option value="user_profile_edited">Profile Edited</option>
          <option value="report_updated">Report Updated</option>
        </select>
        <button className="admin-btn admin-btn-primary" onClick={() => load()}>Refresh</button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? <LoadingState /> : (
        logs.length === 0 ? <EmptyState title="No audit logs" icon="📜" /> : (
          <div className="admin-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Action</th><th>Admin</th><th>Target</th><th>Details</th><th>IP</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={l._id || i}>
                      <td><Badge type="info">{l.action || l.type || "—"}</Badge></td>
                      <td style={{ color: s.muted, fontSize: 12 }}>{renderUserRef(l.admin || l.adminId || l.performedBy)}</td>
                      <td style={{ color: s.muted, fontSize: 12 }}>{renderUserRef(l.target || l.targetId || l.targetUser)}</td>
                      <td style={{ color: s.muted, fontSize: 12, maxWidth: 280 }}>{formatMeta(l.metadata || l.details || l.description || l.reason)}</td>
                      <td style={{ color: s.muted, fontSize: 12 }}>{l.ip || "—"}</td>
                      <td style={{ color: s.muted, fontSize: 11 }}>{fmtDate(l.createdAt || l.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// DATABASE MONITOR
// ─────────────────────────────────────────────
export function DatabaseMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/database/health");
      setData(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load database health."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: s.text }}>Database Monitor</h1>
      <p style={{ margin: "0 0 20px", color: s.muted, fontSize: 13 }}>MongoDB health, stats, and collection overview</p>

      <div style={{ marginBottom: 16, display: "flex", gap: 10 }}>
        <button className="admin-btn admin-btn-primary" onClick={load}>Refresh</button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? <LoadingState /> : !data ? <EmptyState title="No data" icon="🗄️" /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard label="Status" value={data.status || data.state || "—"} icon="🟢"
              color={data.status === "connected" || data.status === "healthy" ? s.success : s.danger} />
            <StatCard label="DB Name" value={data.dbName || data.database || "—"} icon="🗄️" />
            <StatCard label="Collections" value={data.collections?.length ?? data.collectionCount ?? "—"} icon="📂" />
            <StatCard label="Total Size" value={data.dataSize || data.totalSize || "—"} icon="💾" />
            <StatCard label="Uptime" value={data.uptime || "—"} icon="⏱️" />
            <StatCard label="Connections" value={data.connections?.current ?? data.currentConnections ?? "—"} icon="🔗" />
          </div>

          {data.collections && data.collections.length > 0 && (
            <div className="admin-card">
              <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: s.text }}>Collections</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Collection</th><th>Documents</th><th>Size</th><th>Avg Doc Size</th><th>Indexes</th></tr>
                  </thead>
                  <tbody>
                    {data.collections.map((c, i) => (
                      <tr key={c.name || i}>
                        <td style={{ fontWeight: 600 }}>{c.name || c.ns || c.collection}</td>
                        <td>{c.count ?? c.documents ?? "—"}</td>
                        <td style={{ color: s.muted, fontSize: 12 }}>{fmtBytes(c.size)}</td>
                        <td style={{ color: s.muted, fontSize: 12 }}>{fmtBytes(c.avgObjSize ?? c.avgDocSize)}</td>
                        <td style={{ color: s.muted }}>{c.nindexes ?? c.indexes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SYSTEM HEALTH
// ─────────────────────────────────────────────
export function SystemHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/system/health");
      setData(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load system health."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pct = (v) => typeof v === "number" ? `${v.toFixed(1)}%` : v || "—";

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: s.text }}>System Health</h1>
      <p style={{ margin: "0 0 20px", color: s.muted, fontSize: 13 }}>Server CPU, memory, storage, and service status</p>

      <div style={{ marginBottom: 16 }}>
        <button className="admin-btn admin-btn-primary" onClick={load}>Refresh</button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? <LoadingState /> : !data ? <EmptyState title="No data" icon="💻" /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard label="CPU Usage" value={pct(data.cpu?.usage ?? data.cpuUsage)} icon="🖥️"
              color={(data.cpu?.usage ?? data.cpuUsage) > 80 ? s.danger : (data.cpu?.usage ?? data.cpuUsage) > 60 ? s.warning : s.success} />
            <StatCard label="Memory Used" value={pct(data.memory?.usedPercent ?? data.memoryUsage)} icon="🧠"
              color={(data.memory?.usedPercent ?? data.memoryUsage) > 80 ? s.danger : s.success} />
            <StatCard label="Disk Used" value={pct(data.disk?.usedPercent ?? data.diskUsage)} icon="💾"
              color={(data.disk?.usedPercent ?? data.diskUsage) > 85 ? s.danger : s.success} />
            <StatCard label="Uptime" value={data.uptime || "—"} icon="⏱️" color={s.success} />
            <StatCard label="Node Version" value={data.nodeVersion || data.node || "—"} icon="🟩" />
            <StatCard label="Platform" value={data.platform || data.os || "—"} icon="🖧" />
          </div>

          {data.services && (
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: s.text }}>Services</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 10 }}>
                {Object.entries(data.services).map(([svc, status]) => (
                  <div key={svc} style={{ padding: "12px 14px", border: `1px solid ${s.border}`, borderRadius: 10, background: s.surface }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: s.text, marginBottom: 4, textTransform: "capitalize" }}>{svc}</div>
                    <Badge type={status === "up" || status === "healthy" || status === true ? "success" : "danger"}>
                      {typeof status === "boolean" ? (status ? "Up" : "Down") : status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.memory && (
            <div className="admin-card">
              <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: s.text }}>Memory Details</h2>
              <table className="admin-table">
                <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                <tbody>
                  {Object.entries(data.memory).map(([k, v]) => (
                    <tr key={k}><td style={{ fontWeight: 600, color: s.muted, textTransform: "capitalize" }}>{k}</td><td>{String(v)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN NOTIFICATIONS
// ─────────────────────────────────────────────
export function AdminNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/notifications", { params: { page, limit: 25 } });
      const d = res.data;
      setNotifs(d.notifications || d.data || []);
      setTotalPages(d.totalPages || d.pages || 1);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load notifications."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    try {
      await api.patch("/admin/notifications/read-all");
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const markOneRead = async (notifId) => {
    try {
      await api.patch(`/admin/notifications/${notifId}/read`);
      setNotifs((prev) => prev.map((n) => (n._id === notifId ? { ...n, read: true } : n)));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: s.text }}>Notifications</h1>
          <p style={{ margin: 0, color: s.muted, fontSize: 13 }}>Admin alerts and system notifications</p>
        </div>
        <button className="admin-btn" onClick={markAllRead} style={{ fontSize: 12 }}>Mark all read</button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? <LoadingState /> : (
        notifs.length === 0 ? <EmptyState title="No notifications" icon="🔔" desc="You're all caught up!" /> : (
          <div className="admin-card" style={{ overflow: "hidden" }}>
            {notifs.map((n, i) => (
              <div key={n._id || i} style={{
                padding: "14px 18px", borderBottom: i < notifs.length - 1 ? `1px solid ${s.border}` : "none",
                background: n.read === false ? `${s.primary}08` : "transparent",
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>
                  {n.type === "safety_alert" || n.type === "report" ? "⚠️" : n.type === "security" ? "🔒" : "🔔"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: s.text, marginBottom: 2 }}>{n.title || n.subject || n.message || "Notification"}</div>
                  <div style={{ fontSize: 12, color: s.muted }}>{n.body || n.description || n.message || ""}</div>
                  <div style={{ fontSize: 11, color: s.muted, marginTop: 4 }}>{fmtDate(n.createdAt || n.timestamp)}</div>
                </div>
                {n.read === false && (
                  <button className="admin-btn" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => markOneRead(n._id)}>
                    Mark read
                  </button>
                )}
              </div>
            ))}
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ROLE MANAGEMENT (wraps UserManagement with role filter)
// ─────────────────────────────────────────────
export function RoleManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users", { params: { page, limit: 20, role: "admin,moderator,superadmin" } });
      const d = res.data;
      setUsers(d.users || d.data || []);
      setTotalPages(d.totalPages || d.pages || 1);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load staff users."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setConfirm(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to update role."));
      setConfirm(null);
    }
  };

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: s.text }}>Role Management</h1>
      <p style={{ margin: "0 0 20px", color: s.muted, fontSize: 13 }}>Manage superadmin, admin, and moderator roles</p>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? <LoadingState /> : (
        users.length === 0 ? <EmptyState title="No staff users" icon="🛡️" /> : (
          <div className="admin-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Current Role</th><th>Change Role</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const uid = u._id || u.id;
                    const isSelf = String(uid) === String(currentUser?._id || currentUser?.id);
                    return (
                      <tr key={uid}>
                        <td><Link to={`/admin/users/${uid}`} style={{ color: s.primary, textDecoration: "none", fontWeight: 600 }}>{u.name}</Link></td>
                        <td style={{ color: s.muted, fontSize: 12 }}>{u.email}</td>
                        <td><Badge type={u.role === "superadmin" ? "danger" : u.role === "admin" ? "warning" : "info"}>{u.role}</Badge></td>
                        <td>
                          {isSelf ? (
                            <span style={{ fontSize: 12, color: s.muted }}>Cannot change own role</span>
                          ) : !isSuperAdmin ? (
                            <span style={{ fontSize: 12, color: s.muted }}>Super Admin required</span>
                          ) : (
                            <select className="admin-select" value={u.role} style={{ fontSize: 12 }}
                              onChange={e => setConfirm({ userId: uid, newRole: e.target.value, name: u.name, oldRole: u.role })}>
                              <option value="member">Member</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Superadmin</option>
                            </select>
                          )}
                        </td>
                        <td style={{ color: s.muted, fontSize: 12 }}>{fmtDateShort(u.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        )
      )}

      {confirm && (
        <ConfirmationModal
          title="Change Role"
          message={`Change ${confirm.name}'s role from "${confirm.oldRole}" to "${confirm.newRole}"?`}
          onConfirm={() => handleRoleChange(confirm.userId, confirm.newRole)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN SETTINGS
// ─────────────────────────────────────────────
export function AdminSettings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sysInfo, setSysInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (user?.role !== "superadmin") return;
    setLoading(true);
    api.get("/admin/system/health")
      .then(res => setSysInfo(res.data))
      .catch(err => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [user]);

  if (!["admin", "superadmin"].includes(user?.role)) {
    return <EmptyState title="Access Denied" desc="Only admins can access settings." icon="🔒" />;
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: s.text }}>Settings</h1>
      <p style={{ margin: "0 0 24px", color: s.muted, fontSize: 13 }}>Admin panel preferences and system configuration</p>

      <div style={{ display: "grid", gap: 20 }}>
        <div className="admin-card">
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: s.text }}>Appearance</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${s.border}` }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: s.text }}>Theme</div>
              <div style={{ fontSize: 12, color: s.muted, marginTop: 3 }}>Choose between light and dark mode</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["light", "dark"].map((t) => (
                <button key={t} onClick={() => { setTheme(t); setSaved("Theme saved!"); setTimeout(() => setSaved(""), 2000); }}
                  className={`admin-btn ${theme === t ? "admin-btn-primary" : ""}`} style={{ fontSize: 12, padding: "7px 16px", textTransform: "capitalize" }}>
                  {t === "light" ? "☀️ Light" : "🌙 Dark"}
                </button>
              ))}
            </div>
          </div>
          {saved && <div style={{ marginTop: 10, color: s.success, fontSize: 13 }}>✅ {saved}</div>}
        </div>

        <div className="admin-card">
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: s.text }}>Account Info</h2>
          <table className="admin-table">
            <tbody>
              <tr><td style={{ fontWeight: 600, color: s.muted, width: "35%" }}>Name</td><td>{user?.name}</td></tr>
              <tr><td style={{ fontWeight: 600, color: s.muted }}>Email</td><td>{user?.email}</td></tr>
              <tr><td style={{ fontWeight: 600, color: s.muted }}>Role</td><td><Badge type={user?.role === "superadmin" ? "danger" : "warning"}>{user?.role}</Badge></td></tr>
            </tbody>
          </table>
        </div>

        {user?.role === "superadmin" && (
          <div className="admin-card">
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: s.text }}>System Information</h2>
            {error && <ErrorBanner message={error} />}
            {loading ? <LoadingState /> : sysInfo ? (
              <table className="admin-table">
                <tbody>
                  {[
                    ["Node Version", sysInfo.nodeVersion || sysInfo.node],
                    ["Platform", sysInfo.platform || sysInfo.os],
                    ["Uptime", sysInfo.uptime],
                    ["Memory (Used%)", sysInfo.memory?.usedPercent ?? sysInfo.memoryUsage],
                    ["CPU Usage", sysInfo.cpu?.usage ?? sysInfo.cpuUsage],
                    ["Environment", sysInfo.env || sysInfo.environment || import.meta.env.MODE],
                  ].map(([k, v]) => (
                    <tr key={k}><td style={{ fontWeight: 600, color: s.muted, width: "35%" }}>{k}</td><td>{String(v ?? "—")}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState title="No system info" icon="💻" />}
          </div>
        )}
      </div>
    </div>
  );
}
