import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  Activity,
  HeartHandshake,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { api, apiErrorMessage } from "../../services/api";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNotice,
  PageHeader,
  PageTransition,
  RoleBadge,
  SkeletonCard,
  StaggerItem,
  StaggerList,
  StatCard,
} from "../../components/ui";

const ROLE_COLORS = {
  member: "#6366f1",
  moderator: "#f59e0b",
  admin: "#0ea5e9",
  superadmin: "#8b5cf6",
};

export function AdminDashboard() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/dashboard");
      setData(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to fetch admin telemetry."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = data?.stats || {};
  const trendData = data?.registrationTrend || [];
  const rolePieData = Object.entries(data?.roleCounts || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const gridStroke = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const tickFill = isDark ? "#94a3b8" : "#64748b";
  const tooltipStyle = {
    backgroundColor: isDark ? "#11131b" : "#ffffff",
    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)",
    borderRadius: "0.75rem",
    fontSize: "12px",
    color: isDark ? "#f1f5f9" : "#0f172a",
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Operations Overview"
        title="Executive Telemetry"
        subtitle="Live member growth, engagement metrics, moderation queue posture, and recent operator activity."
        breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
        actions={
          <Button
            size="sm"
            variant="outline"
            loading={loading}
            onClick={loadDashboard}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        }
      />

      {error && <ErrorNotice message={error} onRetry={loadDashboard} />}

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem>
              <StatCard
                label="Total Accounts"
                value={stats.totalUsers}
                subtitle={`${stats.newToday ?? 0} joined in last 24h`}
                icon={Users}
                tone="primary"
                to="/admin/users"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Active Users"
                value={stats.activeUsers}
                subtitle={`${stats.inactiveUsers ?? 0} suspended accounts`}
                icon={UserCheck}
                tone="success"
                to="/admin/users?status=active"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Daily Active (24h)"
                value={stats.dailyActiveUsers}
                subtitle={`${stats.monthlyActiveUsers ?? 0} monthly active`}
                icon={Activity}
                tone="info"
                to="/admin/analytics"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="New Signups (30d)"
                value={stats.newRegistrations}
                subtitle="Verified & pending members"
                icon={UserPlus}
                tone="purple"
                to="/admin/analytics"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Total Matches"
                value={stats.totalMatches}
                subtitle="Mutual active pairings"
                icon={HeartHandshake}
                tone="primary"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Messages Exchanged"
                value={stats.messagesSent}
                subtitle="Cumulative platform messages"
                icon={MessageSquare}
                tone="info"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Open Safety Reports"
                value={stats.openReports}
                subtitle="Awaiting moderator triage"
                icon={ShieldAlert}
                tone={stats.openReports > 0 ? "warning" : "success"}
                to="/admin/reports"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Failed Logins (24h)"
                value={stats.failedLogins}
                subtitle="Auth security telemetry"
                icon={Lock}
                tone={stats.failedLogins > 10 ? "danger" : "neutral"}
                to="/admin/security"
              />
            </StaggerItem>
          </StaggerList>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card
              className="lg:col-span-8"
              header={
                <>
                  <div>
                    <h2 className="text-sm font-semibold text-base-content">30-Day Registration Trend</h2>
                    <p className="text-xs hl-muted-text">Daily account creations in MongoDB Atlas</p>
                  </div>
                  <Link to="/admin/analytics" className="text-xs font-medium hl-accent-text hover:underline">
                    Full analytics →
                  </Link>
                </>
              }
            >
              {trendData.length === 0 ? (
                <EmptyState title="No registration data in the last 30 days" />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickFill }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: tickFill }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Registrations"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#regGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card
              className="lg:col-span-4"
              header={
                <div>
                  <h2 className="text-sm font-semibold text-base-content">Accounts by Role</h2>
                  <p className="text-xs hl-muted-text">RBAC distribution</p>
                </div>
              }
            >
              {rolePieData.length === 0 ? (
                <EmptyState title="No role counts yet" />
              ) : (
                <div className="space-y-4">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={rolePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {rolePieData.map((entry) => (
                            <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || "#64748b"} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-xs">
                    {rolePieData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 capitalize hl-muted-text">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: ROLE_COLORS[item.name] || "#64748b" }}
                          />
                          {item.name}
                        </span>
                        <span className="font-semibold text-base-content hl-tabular">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Bottom Grid: Recent Users & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card
              className="lg:col-span-6"
              noPadding
              header={
                <>
                  <h2 className="text-sm font-semibold text-base-content">Recent Registrations</h2>
                  <Link to="/admin/users" className="text-xs font-medium hl-accent-text hover:underline">
                    Manage users →
                  </Link>
                </>
              }
            >
              {!(data?.recentUsers || []).length ? (
                <EmptyState title="No recent users" />
              ) : (
                <div className="divide-y divide-base-300/60">
                  {data.recentUsers.slice(0, 6).map((u) => (
                    <Link
                      key={u._id}
                      to={`/admin/users/${u._id}`}
                      className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-base-200/50 transition-colors no-underline"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={u.profilePhoto} name={u.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-base-content truncate">{u.name}</p>
                          <p className="text-xs hl-muted-text truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <RoleBadge role={u.role} />
                        <Badge tone={u.isActive ? "success" : "danger"}>
                          {u.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card
              className="lg:col-span-6"
              noPadding
              header={
                <>
                  <h2 className="text-sm font-semibold text-base-content">Recent Platform Activity</h2>
                  <Link to="/admin/activity" className="text-xs font-medium hl-accent-text hover:underline">
                    All logs →
                  </Link>
                </>
              }
            >
              {!(data?.recentActivities || []).length ? (
                <EmptyState title="No activity logs yet" />
              ) : (
                <div className="divide-y divide-base-300/60">
                  {data.recentActivities.slice(0, 6).map((act) => (
                    <div key={act._id} className="px-5 py-3 flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-base-content truncate">
                          {act.description || act.action}
                        </p>
                        <p className="hl-muted-text truncate">
                          {act.userId?.name || act.userId?.email || "System"} · {act.category}
                        </p>
                      </div>
                      <Badge tone={act.status === "failure" ? "danger" : "neutral"}>
                        {act.status || "ok"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </PageTransition>
  );
}
