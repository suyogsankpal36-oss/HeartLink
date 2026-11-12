import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, HeartHandshake, MessageSquare, Users } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { api, apiErrorMessage } from "../../services/api";
import {
  Button,
  Card,
  EmptyState,
  ErrorNotice,
  PageHeader,
  PageSpinner,
  PageTransition,
  StatCard,
} from "../../components/ui";

const PERIODS = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
];

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b"];

export function Analytics() {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState("30d");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/analytics", { params: { period } });
      setAnalytics(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to fetch analytics aggregations."));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const gridStroke = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const tickFill = isDark ? "#94a3b8" : "#64748b";
  const tooltipStyle = {
    backgroundColor: isDark ? "#11131b" : "#ffffff",
    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)",
    borderRadius: "0.75rem",
    fontSize: "12px",
    color: isDark ? "#f1f5f9" : "#0f172a",
  };

  const regTrend = analytics?.registrationTrend || [];
  const activeTrend = analytics?.activeUsersTrend || [];
  const roleDist = analytics?.roleDist || [];
  const statusDist = analytics?.statusDist || [];
  const topLocations = analytics?.topLocations || [];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Platform Intelligence"
        title="Growth & Engagement Analytics"
        subtitle="MongoDB Atlas time-series aggregations across registrations, retention, messaging, and geography."
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Analytics" }]}
        actions={
          <div className="inline-flex rounded-lg border border-base-300 bg-base-100 p-1">
            {PERIODS.map((p) => (
              <Button
                key={p.value}
                size="xs"
                variant={period === p.value ? "primary" : "ghost"}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        }
      />

      {error && <ErrorNotice message={error} onRetry={fetchAnalytics} />}

      {loading && !analytics ? (
        <PageSpinner label="Aggregating telemetry metrics..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={`New Users (${period})`}
              value={analytics?.newUsers}
              icon={Users}
              tone="primary"
            />
            <StatCard
              label={`New Matches (${period})`}
              value={analytics?.newMatches}
              icon={HeartHandshake}
              tone="purple"
            />
            <StatCard
              label={`Messages (${period})`}
              value={analytics?.messages}
              icon={MessageSquare}
              tone="info"
            />
            <StatCard
              label={`Active Retention (${period})`}
              value={analytics?.retention !== undefined ? `${analytics.retention}%` : "—"}
              icon={Activity}
              tone="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card header={<span className="text-sm font-semibold">Daily New Signups</span>}>
              {regTrend.length === 0 ? (
                <EmptyState title="No registrations in selected window" />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={regTrend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="signupsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickFill }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: tickFill }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="count" name="Signups" stroke="#6366f1" strokeWidth={2} fill="url(#signupsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card header={<span className="text-sm font-semibold">Daily Active Members</span>}>
              {activeTrend.length === 0 ? (
                <EmptyState title="No active sessions recorded in window" />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeTrend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickFill }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: tickFill }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="count" name="Active Users" stroke="#10b981" strokeWidth={2} fill="url(#activeGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-6" header={<span className="text-sm font-semibold">Top Cities</span>}>
              {topLocations.length === 0 ? (
                <EmptyState title="No city metadata recorded yet" />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topLocations} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="city" tick={{ fontSize: 11, fill: tickFill }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: tickFill }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Members" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="lg:col-span-3" header={<span className="text-sm font-semibold">Role Split</span>}>
              {roleDist.length === 0 ? (
                <EmptyState title="No data" />
              ) : (
                <div className="space-y-3">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={roleDist} dataKey="value" nameKey="name" innerRadius={40} outerRadius={64} paddingAngle={3}>
                          {roleDist.map((entry, idx) => (
                            <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {roleDist.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 capitalize hl-muted-text">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                          {item.name}
                        </span>
                        <span className="font-semibold hl-tabular">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="lg:col-span-3" header={<span className="text-sm font-semibold">Account Status</span>}>
              {statusDist.length === 0 ? (
                <EmptyState title="No data" />
              ) : (
                <div className="space-y-3">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDist} dataKey="value" nameKey="name" innerRadius={40} outerRadius={64} paddingAngle={3}>
                          {statusDist.map((entry) => (
                            <Cell key={entry.name} fill={entry.name === "Active" ? "#10b981" : "#f43f5e"} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {statusDist.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 hl-muted-text">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.name === "Active" ? "#10b981" : "#f43f5e" }}
                          />
                          {item.name}
                        </span>
                        <span className="font-semibold hl-tabular">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </PageTransition>
  );
}
