import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { api, apiErrorMessage } from "../../services/api";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorNotice,
  PageHeader,
  PageTransition,
  RoleBadge,
  StatCard,
} from "../../components/ui";

const ROLE_COLORS = {
  member: "#6366f1",
  moderator: "#f59e0b",
  admin: "#0ea5e9",
  superadmin: "#8b5cf6",
};

export function SuperAdminDashboardPage() {
  const { user: currentSuperAdmin } = useAuth();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "roles" | "security" | "database" | "system"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [dashboardData, setDashboardData] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);

  // Role Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("moderator");
  const [roleUpdating, setRoleUpdating] = useState(false);

  const fetchSuperAdminTelemetry = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const [dashRes, dbRes, sysRes, secRes, usersRes] = await Promise.allSettled([
        api.get("/admin/dashboard"),
        api.get("/admin/database/health"),
        api.get("/admin/system/health"),
        api.get("/admin/security?limit=8"),
        api.get("/admin/users?limit=50"),
      ]);

      if (dashRes.status === "fulfilled") setDashboardData(dashRes.value.data);
      if (dbRes.status === "fulfilled") setDbHealth(dbRes.value.data);
      if (sysRes.status === "fulfilled") setSystemHealth(sysRes.value.data);
      if (secRes.status === "fulfilled") setSecurityEvents(secRes.value.data?.events || []);
      if (usersRes.status === "fulfilled") {
        const allUsers = usersRes.value.data?.users || [];
        setStaffUsers(allUsers.filter((u) => ["superadmin", "admin", "moderator"].includes(u.role)));
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load complete Super Admin governance telemetry."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSuperAdminTelemetry();
  }, [fetchSuperAdminTelemetry]);

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setRoleUpdating(true);
    try {
      const res = await api.patch(`/admin/users/${editingUser.id || editingUser._id}/role`, {
        role: selectedRole,
      });
      toast.success(res.data?.message || `Role updated to ${selectedRole}`);
      setEditingUser(null);
      fetchSuperAdminTelemetry(true);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update user role."));
    } finally {
      setRoleUpdating(false);
    }
  };

  const stats = dashboardData?.stats || {};
  const roleCounts = dashboardData?.roleCounts || {};
  const registrationTrend = dashboardData?.registrationTrend || [];

  const rolePieData = Object.entries(roleCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const chartTheme = {
    grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
    text: isDark ? "#94a3b8" : "#64748b",
    tooltipBg: isDark ? "#11131b" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)",
  };

  return (
    <PageTransition className="space-y-6">
      {/* Enterprise Page Header */}
      <PageHeader
        eyebrow="Platform Governance & Control"
        title="Super Admin Control Center"
        subtitle={`Welcome, ${currentSuperAdmin?.name || "Super Administrator"}. Global architecture health, role privilege governance, and Atlas database monitoring.`}
        breadcrumbs={[{ label: "Super Admin" }, { label: "Control Center" }]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              loading={refreshing}
              onClick={() => fetchSuperAdminTelemetry(true)}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Link to="/admin/database">
              <Button size="sm" variant="soft-primary" leftIcon={<Database className="h-3.5 w-3.5" />}>
                Database Explorer
              </Button>
            </Link>
          </div>
        }
      />

      {error && <ErrorNotice message={error} onRetry={() => fetchSuperAdminTelemetry()} />}

      {/* Primary KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 rounded-xl bg-base-200 animate-pulse" />
          <div className="h-28 rounded-xl bg-base-200 animate-pulse" />
          <div className="h-28 rounded-xl bg-base-200 animate-pulse" />
          <div className="h-28 rounded-xl bg-base-200 animate-pulse" />
        </div>
      ) : (
        <section aria-label="Global platform metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Platform Accounts"
            value={stats.totalUsers ?? "—"}
            subtitle="Verified across all 4 roles"
            icon={Users}
            tone="primary"
          />
          <StatCard
            label="Active Staff Operators"
            value={(roleCounts.superadmin || 0) + (roleCounts.admin || 0) + (roleCounts.moderator || 0)}
            subtitle={`${roleCounts.superadmin || 0} Super · ${roleCounts.admin || 0} Admin · ${roleCounts.moderator || 0} Mod`}
            icon={ShieldCheck}
            tone="purple"
          />
          <StatCard
            label="Database Collections"
            value={dbHealth?.collections?.length ?? (dbHealth?.connected ? "Healthy" : "Active")}
            subtitle={dbHealth?.dbName ? `Atlas: ${dbHealth.dbName}` : "MongoDB Atlas connected"}
            icon={Database}
            tone={dbHealth?.connected !== false ? "success" : "danger"}
          />
          <StatCard
            label="Server Process Uptime"
            value={systemHealth?.uptimeFormatted || systemHealth?.uptime || "99.9%"}
            subtitle={`Node ${systemHealth?.nodeVersion || process?.version || "20+"} · ${systemHealth?.status === "ok" ? "Nominal" : "Degraded"}`}
            icon={Server}
            tone={systemHealth?.status === "ok" ? "success" : "warning"}
          />
        </section>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b hl-subtle-divider overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Executive Overview", icon: Activity },
          { id: "roles", label: `Staff & Roles (${staffUsers.length})`, icon: UserCog },
          { id: "security", label: `Security Feed (${securityEvents.length})`, icon: ShieldAlert },
          { id: "database", label: "Atlas Database", icon: Database },
          { id: "system", label: "System Health", icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-primary/12 text-primary border border-primary/25"
                  : "hl-muted-text hover:text-base-content hover:bg-base-300/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Registration Trend Chart */}
            <Card
              className="lg:col-span-8"
              header={
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h2 className="text-sm font-semibold text-base-content">Member Growth Velocity</h2>
                    <p className="text-xs hl-muted-text">Daily registration trend across recent cohort</p>
                  </div>
                  <Badge tone="primary">Live Telemetry</Badge>
                </div>
              }
            >
              <div className="h-64 w-full">
                {registrationTrend.length === 0 ? (
                  <EmptyState icon={Activity} title="Collecting cohort telemetry" description="New registrations will graph here in real time." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={registrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="superAdminTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" stroke={chartTheme.text} tick={{ fontSize: 11 }} />
                      <YAxis stroke={chartTheme.text} tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartTheme.tooltipBg,
                          borderColor: chartTheme.tooltipBorder,
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2.5} fill="url(#superAdminTrendGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Role Distribution Donut Chart */}
            <Card
              className="lg:col-span-4 flex flex-col justify-between"
              header={
                <div>
                  <h2 className="text-sm font-semibold text-base-content">RBAC Distribution</h2>
                  <p className="text-xs hl-muted-text">Platform role segmentation</p>
                </div>
              }
            >
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rolePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                      {rolePieData.map((entry) => (
                        <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTheme.tooltipBg,
                        borderColor: chartTheme.tooltipBorder,
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t hl-subtle-divider text-xs">
                {rolePieData.map((r) => (
                  <div key={r.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: ROLE_COLORS[r.name] }} />
                    <span className="capitalize hl-muted-text">{r.name}:</span>
                    <span className="font-semibold text-base-content hl-tabular">{r.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Governance Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/roles" className="hl-surface-interactive p-4 rounded-xl flex items-center justify-between no-underline">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-base-content">Privilege Management</h3>
                  <p className="text-[11px] hl-muted-text">Elevate and audit admin roles</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 hl-muted-text" />
            </Link>

            <Link to="/admin/audit-logs" className="hl-surface-interactive p-4 rounded-xl flex items-center justify-between no-underline">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-base-content">System Audit Logs</h3>
                  <p className="text-[11px] hl-muted-text">Immutable records of staff mutations</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 hl-muted-text" />
            </Link>

            <Link to="/admin/security" className="hl-surface-interactive p-4 rounded-xl flex items-center justify-between no-underline">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-base-content">Security Center</h3>
                  <p className="text-[11px] hl-muted-text">Brute-force and threat monitoring</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 hl-muted-text" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PRIVILEGES */}
      {activeTab === "roles" && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div>
                <h2 className="text-sm font-semibold text-base-content">Staff &amp; Operator Accounts</h2>
                <p className="text-xs hl-muted-text">Accounts with elevated Moderator, Admin, or Super Admin privileges</p>
              </div>
              <Link to="/admin/roles">
                <Button size="xs" variant="outline">Full Matrix →</Button>
              </Link>
            </div>
          }
          noPadding
        >
          {staffUsers.length === 0 ? (
            <EmptyState icon={Users} title="No staff accounts found" description="Staff accounts will be listed here." />
          ) : (
            <div className="divide-y divide-base-300/60 overflow-x-auto">
              <table className="table w-full text-xs">
                <thead>
                  <tr className="border-b hl-subtle-divider text-left text-base-content/70">
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffUsers.map((staff) => (
                    <tr key={staff.id || staff._id} className="hover:bg-base-200/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={staff.profilePhoto} name={staff.name} size="sm" />
                          <span className="font-medium text-base-content">{staff.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] hl-muted-text">{staff.email}</td>
                      <td className="py-3 px-4">
                        <RoleBadge role={staff.role} />
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={staff.isActive !== false ? "success" : "danger"}>
                          {staff.isActive !== false ? "Active" : "Suspended"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(staff);
                            setSelectedRole(staff.role);
                          }}
                        >
                          Modify Role
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: SECURITY & AUDIT FEED */}
      {activeTab === "security" && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div>
                <h2 className="text-sm font-semibold text-base-content">Security Events Stream</h2>
                <p className="text-xs hl-muted-text">Real-time authentication and access events recorded in Atlas</p>
              </div>
              <Badge tone="danger">SecOps</Badge>
            </div>
          }
          noPadding
        >
          {securityEvents.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No security incidents logged" description="All login patterns and token sessions are nominal." />
          ) : (
            <div className="divide-y divide-base-300/60 overflow-x-auto">
              <table className="table w-full text-xs">
                <thead>
                  <tr className="border-b hl-subtle-divider text-left text-base-content/70">
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Origin IP</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {securityEvents.map((evt, idx) => {
                    const isHigh = evt.severity === "high" || evt.severity === "critical";
                    const isMed = evt.severity === "medium";
                    return (
                      <tr key={evt.id || evt._id || idx} className="hover:bg-base-200/50 transition-colors">
                        <td className="py-3 px-4">
                          <Badge tone={isHigh ? "danger" : isMed ? "warning" : "info"}>
                            {evt.severity || "info"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-semibold text-base-content capitalize">
                          {String(evt.eventType || "Event").replace("_", " ")}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] hl-muted-text">
                          {evt.ipAddress || evt.ip || "127.0.0.1"}
                        </td>
                        <td className="py-3 px-4 text-xs hl-muted-text max-w-xs truncate">
                          {evt.metadata ? JSON.stringify(evt.metadata) : evt.reason || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] hl-muted-text">
                          {evt.createdAt ? new Date(evt.createdAt).toLocaleString() : "Just now"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: DATABASE MONITORING */}
      {activeTab === "database" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="space-y-1">
              <p className="text-xs hl-muted-text uppercase tracking-wider">Cluster State</p>
              <p className="text-xl font-bold text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5" /> Connected
              </p>
              <p className="text-xs hl-muted-text">MongoDB Atlas Cloud Replica</p>
            </Card>
            <Card className="space-y-1">
              <p className="text-xs hl-muted-text uppercase tracking-wider">Active Target Database</p>
              <p className="text-xl font-bold text-base-content font-mono">
                {dbHealth?.dbName || "heartlink"}
              </p>
              <p className="text-xs hl-muted-text">Dedicated Production Namespace</p>
            </Card>
            <Card className="space-y-1">
              <p className="text-xs hl-muted-text uppercase tracking-wider">Mongoose ReadyState</p>
              <p className="text-xl font-bold text-base-content hl-tabular">
                State 1 (Full Read/Write)
              </p>
              <p className="text-xs hl-muted-text">Connection Pool Active</p>
            </Card>
          </div>

          <Card
            header={
              <div>
                <h2 className="text-sm font-semibold text-base-content">Atlas Collections Telemetry</h2>
                <p className="text-xs hl-muted-text">Live document counts and storage footprint per collection</p>
              </div>
            }
            noPadding
          >
            {(!dbHealth?.collections || dbHealth.collections.length === 0) ? (
              <div className="p-6 text-center text-xs hl-muted-text">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-40 text-primary" />
                Connecting to MongoDB Atlas telemetry provider...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full text-xs">
                  <thead>
                    <tr className="border-b hl-subtle-divider text-left text-base-content/70">
                      <th className="py-3 px-4">Collection</th>
                      <th className="py-3 px-4">Estimated Records</th>
                      <th className="py-3 px-4">Storage Size</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbHealth.collections.map((col) => (
                      <tr key={col.name} className="hover:bg-base-200/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-base-content">{col.name}</td>
                        <td className="py-3 px-4 hl-tabular font-medium">{col.count ?? "—"}</td>
                        <td className="py-3 px-4 hl-tabular hl-muted-text">
                          {col.size ? `${(col.size / 1024).toFixed(1)} KB` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge tone="success" dot>Nominal</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 5: SYSTEM HEALTH */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            header={
              <div>
                <h2 className="text-sm font-semibold text-base-content">Runtime Specifications</h2>
                <p className="text-xs hl-muted-text">Node runtime, platform &amp; architecture</p>
              </div>
            }
          >
            <dl className="divide-y divide-base-300/60 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <dt className="hl-muted-text">Node.js Engine</dt>
                <dd className="font-mono font-semibold text-base-content">{systemHealth?.nodeVersion || process?.version || "Node 20+"}</dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="hl-muted-text">Host Platform</dt>
                <dd className="font-mono text-base-content">{systemHealth?.platform || "cloud"}</dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="hl-muted-text">Service Health Status</dt>
                <dd>
                  <Badge tone={systemHealth?.status === "ok" ? "success" : "warning"} dot>
                    {systemHealth?.status === "ok" ? "Online & Healthy" : "Degraded"}
                  </Badge>
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="hl-muted-text">Database Link</dt>
                <dd>
                  <Badge tone={systemHealth?.database === "connected" ? "success" : "danger"} dot>
                    {systemHealth?.database === "connected" ? "Connected" : "Disconnected"}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <Card
            header={
              <div>
                <h2 className="text-sm font-semibold text-base-content">Process Resource Footprint</h2>
                <p className="text-xs hl-muted-text">Memory allocation and uptime telemetry</p>
              </div>
            }
          >
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="hl-muted-text">Memory Heap Allocation</span>
                  <span className="font-semibold text-base-content hl-tabular">
                    {systemHealth?.memory?.heapUsedMB ? `${systemHealth.memory.heapUsedMB} MB` : "Normal"}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-base-200 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: "35%" }} />
                </div>
              </div>

              <div className="pt-2 border-t hl-subtle-divider">
                <p className="hl-muted-text mb-1">Process Lifetime</p>
                <p className="text-xl font-bold text-base-content hl-tabular">
                  {systemHealth?.uptimeFormatted || systemHealth?.uptime || "Running"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Role Elevation Modal */}
      {editingUser && (
        <ConfirmDialog
          open={Boolean(editingUser)}
          title={`Modify Privileges for ${editingUser.name}`}
          confirmLabel={roleUpdating ? "Updating..." : "Save Role Assignment"}
          variant="primary"
          onClose={() => setEditingUser(null)}
          onConfirm={handleUpdateRole}
          loading={roleUpdating}
        >
          <div className="space-y-4 py-2 text-xs">
            <p className="hl-muted-text">
              Assign a new privilege level for <strong className="text-base-content">{editingUser.email}</strong>.
              All changes are logged in the Super Admin Audit Stream.
            </p>
            <div>
              <label htmlFor="role-select" className="block text-xs font-semibold text-base-content mb-1">
                Select Platform Role
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="select select-bordered w-full text-xs rounded-xl"
              >
                <option value="member">Member (Regular User)</option>
                <option value="moderator">Moderator (Trust &amp; Safety Queue)</option>
                <option value="admin">Admin (Operations &amp; Analytics)</option>
                <option value="superadmin">Super Admin (Global Platform Governance)</option>
              </select>
            </div>
          </div>
        </ConfirmDialog>
      )}
    </PageTransition>
  );
}

export default SuperAdminDashboardPage;
