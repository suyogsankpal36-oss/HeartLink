import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  Bell,
  Check,
  CheckCheck,
  Database,
  FileText,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api, apiErrorMessage } from "../../services/api";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorNotice,
  Field,
  PageHeader,
  PageSpinner,
  PageTransition,
  Pagination,
  RoleBadge,
  SearchBar,
  Select,
  StatCard,
  ThemeToggle,
} from "../../components/ui";

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

const RBAC_MATRIX = [
  { capability: "Member Discovery, Likes, Matches & Messaging", member: true, moderator: true, admin: true, superadmin: true },
  { capability: "Review Moderation Reports & Support Tickets", member: false, moderator: true, admin: true, superadmin: true },
  { capability: "Suspend / Reactivate Member Accounts", member: false, moderator: true, admin: true, superadmin: true },
  { capability: "Admin Dashboard, Analytics & User Directory", member: false, moderator: false, admin: true, superadmin: true },
  { capability: "Activity Logs, Security Center & Audit Logs", member: false, moderator: false, admin: true, superadmin: true },
  { capability: "System Health Runtime Monitoring", member: false, moderator: false, admin: true, superadmin: true },
  { capability: "Assign / Revoke Admin & Moderator Roles", member: false, moderator: false, admin: false, superadmin: true },
  { capability: "MongoDB Atlas Database Health & Collection Telemetry", member: false, moderator: false, admin: false, superadmin: true },
];

export function RoleManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("superadmin,admin,moderator");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingChange, setPendingChange] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadRoleDirectory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/users", {
        params: { role: roleFilter || undefined, limit: 50 },
      });
      setUsers(data.users || []);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to fetch role assignments."));
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    loadRoleDirectory();
  }, [loadRoleDirectory]);

  const applyRoleUpdate = async () => {
    if (!pendingChange) return;
    setBusy(true);
    try {
      await api.patch(`/admin/users/${pendingChange.user._id}/role`, {
        role: pendingChange.nextRole,
      });
      toast.success(`Updated ${pendingChange.user.name} to ${pendingChange.nextRole}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === pendingChange.user._id ? { ...u, role: pendingChange.nextRole } : u)),
      );
      setPendingChange(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to update role."));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Account",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.profilePhoto} name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-base-content truncate">{row.name}</p>
            <p className="text-xs hl-muted-text truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Current Role",
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge tone={row.isActive ? "success" : "danger"} dot>
          {row.isActive ? "Active" : "Suspended"}
        </Badge>
      ),
    },
    {
      key: "assign",
      label: "Assign Role",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => {
        const isSelf = String(row._id) === String(currentUser?.id || currentUser?._id);
        return (
          <div className="inline-block w-40">
            <Select
              aria-label={`Assign role for ${row.name}`}
              disabled={isSelf}
              value={row.role}
              onChange={(e) => {
                if (e.target.value !== row.role) {
                  setPendingChange({ user: row, nextRole: e.target.value });
                }
              }}
              options={[
                { value: "member", label: "Member" },
                { value: "moderator", label: "Moderator" },
                { value: "admin", label: "Admin" },
                { value: "superadmin", label: "Super Admin" },
              ]}
            />
          </div>
        );
      },
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Super Admin Governance"
        title="Roles & Access Control"
        subtitle="Review permission boundaries and assign or revoke Moderator, Admin, and Super Admin privileges."
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Roles & Access" }]}
      />

      <Card header={<span className="text-sm font-semibold">4-Level RBAC Capability Matrix</span>} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b hl-subtle-divider bg-base-200/60 font-semibold uppercase tracking-wider hl-muted-text">
                <th className="px-4 py-3">Capability</th>
                <th className="px-4 py-3 text-center">Member</th>
                <th className="px-4 py-3 text-center">Moderator</th>
                <th className="px-4 py-3 text-center">Admin</th>
                <th className="px-4 py-3 text-center">Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300/60">
              {RBAC_MATRIX.map((row) => (
                <tr key={row.capability} className="hover:bg-base-200/40">
                  <td className="px-4 py-3 font-medium text-base-content">{row.capability}</td>
                  {["member", "moderator", "admin", "superadmin"].map((rKey) => (
                    <td key={rKey} className="px-4 py-3 text-center">
                      {row[rKey] ? (
                        <Check className="h-4 w-4 text-emerald-500 inline" />
                      ) : (
                        <span className="hl-muted-text">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant={roleFilter === "superadmin,admin,moderator" ? "primary" : "outline"}
            onClick={() => setRoleFilter("superadmin,admin,moderator")}
          >
            Elevated Staff Only
          </Button>
          <Button
            size="xs"
            variant={roleFilter === "" ? "primary" : "outline"}
            onClick={() => setRoleFilter("")}
          >
            All Accounts
          </Button>
        </div>
      </div>

      {error && <ErrorNotice message={error} onRetry={loadRoleDirectory} />}

      <DataTable
        caption="Role assignments table"
        columns={columns}
        rows={users}
        loading={loading}
      />

      <ConfirmDialog
        open={Boolean(pendingChange)}
        title={`Assign ${pendingChange?.nextRole} role?`}
        message={`This immediately changes permissions for ${pendingChange?.user?.name} (${pendingChange?.user?.email}) and logs an Admin Audit event.`}
        confirmLabel="Confirm Role Assignment"
        tone="warning"
        loading={busy}
        onCancel={() => setPendingChange(null)}
        onConfirm={applyRoleUpdate}
      />
    </PageTransition>
  );
}

export function ActivityMonitoring() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/activities", {
        params: {
          page,
          limit: 25,
          search: search.trim() || undefined,
          category: category || undefined,
          status: status || undefined,
        },
      });
      setRows(data.activities || []);
      setTotal(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to fetch platform activities."));
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const columns = [
    {
      key: "user",
      label: "Actor",
      render: (row) => (
        <div className="min-w-0">
          <p className="text-xs font-medium text-base-content truncate">{row.userId?.name || "System"}</p>
          <p className="text-[11px] hl-muted-text truncate">{row.userId?.email || "—"}</p>
        </div>
      ),
    },
    {
      key: "action",
      label: "Event",
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-base-content">{row.description || row.action}</p>
          <p className="text-[11px] font-mono hl-muted-text">{row.action}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => <Badge tone="neutral">{row.category || "general"}</Badge>,
    },
    {
      key: "status",
      label: "Outcome",
      render: (row) => (
        <Badge tone={row.status === "failure" ? "danger" : "success"}>
          {row.status || "success"}
        </Badge>
      ),
    },
    {
      key: "ip",
      label: "IP",
      render: (row) => <span className="font-mono text-xs hl-muted-text">{row.ip || "—"}</span>,
    },
    {
      key: "createdAt",
      label: "Timestamp",
      render: (row) => (
        <span className="text-xs hl-muted-text hl-tabular whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Telemetry"
        title="Activity Monitoring"
        subtitle="Audit authentication events, profile updates, discovery interactions, and admin changes."
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Activity Logs" }]}
      />

      <Card noPadding className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <SearchBar
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setPage(1);
              }}
              placeholder="Search action or description..."
              label="Search activities"
            />
          </div>
          <div className="sm:col-span-3">
            <Select
              aria-label="Category filter"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Categories" },
                { value: "auth", label: "Auth" },
                { value: "profile", label: "Profile" },
                { value: "discovery", label: "Discovery" },
                { value: "messaging", label: "Messaging" },
                { value: "security", label: "Security" },
                { value: "admin", label: "Admin" },
              ]}
            />
          </div>
          <div className="sm:col-span-3">
            <Select
              aria-label="Status filter"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Outcomes" },
                { value: "success", label: "Success" },
                { value: "failure", label: "Failure" },
              ]}
            />
          </div>
        </div>
      </Card>

      {error && <ErrorNotice message={error} onRetry={fetchActivities} />}
      <DataTable caption="Activity log stream" columns={columns} rows={rows} loading={loading} />
      <Pagination page={page} pages={totalPages} total={total} limit={25} onPageChange={setPage} />
    </PageTransition>
  );
}

export function SecurityCenter() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSecurity = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/security", {
        params: {
          page,
          limit: 25,
          severity: severity || undefined,
          type: typeFilter.trim() || undefined,
        },
      });
      setEvents(data.events || []);
      setTotal(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to load security events."));
    } finally {
      setLoading(false);
    }
  }, [page, severity, typeFilter]);

  useEffect(() => {
    fetchSecurity();
  }, [fetchSecurity]);

  const severityTone = (sev) => {
    if (sev === "critical" || sev === "high") return "danger";
    if (sev === "medium") return "warning";
    return "info";
  };

  const columns = [
    {
      key: "severity",
      label: "Severity",
      render: (row) => (
        <Badge tone={severityTone(row.severity)} dot>
          {row.severity || "low"}
        </Badge>
      ),
    },
    {
      key: "type",
      label: "Event Type",
      render: (row) => <span className="font-mono text-xs font-medium text-base-content">{row.type}</span>,
    },
    {
      key: "user",
      label: "Account",
      render: (row) => (
        <div className="min-w-0">
          <p className="text-xs font-medium text-base-content truncate">{row.userId?.name || "Anonymous"}</p>
          <p className="text-[11px] hl-muted-text truncate">{row.userId?.email || "—"}</p>
        </div>
      ),
    },
    {
      key: "ip",
      label: "Source IP",
      render: (row) => <span className="font-mono text-xs hl-muted-text">{row.ip || "—"}</span>,
    },
    {
      key: "createdAt",
      label: "Recorded",
      render: (row) => (
        <span className="text-xs hl-muted-text hl-tabular whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Security Operations"
        title="Security Center"
        subtitle="Monitor failed logins, lockouts, unauthorized API attempts, and password resets."
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Security Center" }]}
      />

      <Card noPadding className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <SearchBar
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              onClear={() => {
                setTypeFilter("");
                setPage(1);
              }}
              placeholder="Exact event type (e.g., failed_login, account_lockout)..."
              label="Filter by security event type"
            />
          </div>
          <div className="sm:col-span-6">
            <Select
              aria-label="Filter by severity"
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Severities" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
            />
          </div>
        </div>
      </Card>

      {error && <ErrorNotice message={error} onRetry={fetchSecurity} />}
      <DataTable caption="Security events table" columns={columns} rows={events} loading={loading} />
      <Pagination page={page} pages={totalPages} total={total} limit={25} onPageChange={setPage} />
    </PageTransition>
  );
}

export function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/audit-logs", {
        params: { page, limit: 25, action: actionFilter.trim() || undefined },
      });
      setLogs(data.logs || []);
      setTotal(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to fetch admin audit logs."));
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      key: "admin",
      label: "Operator",
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-base-content">{row.adminId?.name || "System"}</span>
            {row.adminId?.role && <RoleBadge role={row.adminId.role} />}
          </div>
          <p className="text-[11px] hl-muted-text">{row.adminId?.email || "—"}</p>
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (row) => <Badge tone="primary">{row.action}</Badge>,
    },
    {
      key: "target",
      label: "Target Account",
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-base-content">{row.targetId?.name || "—"}</p>
          <p className="text-[11px] hl-muted-text">{row.targetId?.email || ""}</p>
        </div>
      ),
    },
    {
      key: "ip",
      label: "IP",
      render: (row) => <span className="font-mono text-xs hl-muted-text">{row.ip || "—"}</span>,
    },
    {
      key: "createdAt",
      label: "Timestamp",
      render: (row) => (
        <span className="text-xs hl-muted-text hl-tabular whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="Admin Audit Logs"
        subtitle="Immutable record of role updates, account suspensions, and moderation actions."
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Audit Logs" }]}
      />

      <Card noPadding className="p-4">
        <SearchBar
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          onClear={() => {
            setActionFilter("");
            setPage(1);
          }}
          placeholder="Filter by exact action key (e.g., user_suspended, role_changed)..."
          label="Filter audit logs by action"
        />
      </Card>

      {error && <ErrorNotice message={error} onRetry={fetchLogs} />}
      <DataTable caption="Admin audit trail" columns={columns} rows={logs} loading={loading} />
      <Pagination page={page} pages={totalPages} total={total} limit={25} onPageChange={setPage} />
    </PageTransition>
  );
}

export function DatabaseMonitoring() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDbHealth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/database/health");
      setHealth(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to query MongoDB Atlas cluster health."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDbHealth();
  }, [fetchDbHealth]);

  const collections = health?.collections || [];
  const totalDocs = collections.reduce((sum, c) => sum + (Number(c.count) || 0), 0);
  const totalBytes = collections.reduce((sum, c) => sum + (Number(c.size) || 0), 0);

  const columns = [
    {
      key: "name",
      label: "Collection",
      render: (row) => <span className="font-mono text-xs font-semibold text-base-content">{row.name}</span>,
    },
    {
      key: "count",
      label: "Documents",
      render: (row) => <span className="hl-tabular text-xs">{row.count ?? "—"}</span>,
    },
    {
      key: "size",
      label: "Storage Size",
      render: (row) => <span className="hl-tabular text-xs">{formatBytes(row.size)}</span>,
    },
    {
      key: "avgObjSize",
      label: "Avg Doc Size",
      render: (row) => <span className="hl-tabular text-xs">{formatBytes(row.avgObjSize)}</span>,
    },
    {
      key: "nindexes",
      label: "Indexes",
      render: (row) => <Badge tone="neutral">{row.nindexes ?? "—"}</Badge>,
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Super Admin Infrastructure"
        title="MongoDB Atlas Monitor"
        subtitle="Inspect live primary cluster status, collection document counts, storage footprint, and indexes."
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Database Monitor" }]}
        actions={
          <Button size="sm" variant="outline" loading={loading} onClick={fetchDbHealth} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Poll Cluster
          </Button>
        }
      />

      {error && <ErrorNotice message={error} onRetry={fetchDbHealth} />}

      {loading && !health ? (
        <PageSpinner label="Inspecting MongoDB Atlas collections..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Connection State"
              value={health?.connected ? "Connected" : "Disconnected"}
              subtitle={`Database: ${health?.dbName || "—"}`}
              icon={Database}
              tone={health?.connected ? "success" : "danger"}
            />
            <StatCard
              label="Collections"
              value={collections.length}
              subtitle="Active Atlas & GridFS namespaces"
              icon={FileText}
              tone="primary"
            />
            <StatCard
              label="Total Documents"
              value={totalDocs}
              subtitle="Estimated document count"
              icon={Activity}
              tone="info"
            />
            <StatCard
              label="Logical Size"
              value={formatBytes(totalBytes)}
              subtitle="Across inspected collections"
              icon={Server}
              tone="purple"
            />
          </div>

          <DataTable caption="MongoDB collections health" columns={columns} rows={collections} keyField="name" />
        </>
      )}
    </PageTransition>
  );
}

export function SystemHealth() {
  const [sys, setSys] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSystem = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/system/health");
      setSys(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to read system health metrics."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystem();
  }, [fetchSystem]);

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Runtime Telemetry"
        title="System Health"
        subtitle="Live Node.js Express runtime diagnostics, heap allocation, and database connectivity."
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "System Health" }]}
        actions={
          <Button size="sm" variant="outline" loading={loading} onClick={fetchSystem} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh Telemetry
          </Button>
        }
      />

      {error && <ErrorNotice message={error} onRetry={fetchSystem} />}

      {loading && !sys ? (
        <PageSpinner label="Reading Node.js process diagnostics..." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Service Status"
              value={sys?.status === "ok" ? "Operational" : "Degraded"}
              subtitle={`Database: ${sys?.database || "unknown"}`}
              icon={ShieldCheck}
              tone={sys?.status === "ok" ? "success" : "warning"}
            />
            <StatCard
              label="Process Uptime"
              value={sys?.uptimeFormatted || sys?.uptime || "—"}
              subtitle={`${sys?.uptimeSeconds ?? 0}s total uptime`}
              icon={Activity}
              tone="primary"
            />
            <StatCard
              label="Heap Utilization"
              value={`${sys?.memory?.usedPercent ?? sys?.memoryUsage ?? 0}%`}
              subtitle={`${sys?.memory?.heapUsed || "—"} / ${sys?.memory?.heapTotal || "—"}`}
              icon={Server}
              tone="info"
            />
            <StatCard
              label="Environment"
              value={sys?.environment || "—"}
              subtitle={`Node ${sys?.nodeVersion || ""} · ${sys?.platform || ""}`}
              icon={Lock}
              tone="purple"
            />
          </div>

          <Card header={<span className="text-sm font-semibold">Heap Memory Breakdown</span>}>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="hl-muted-text">
                  Heap Used: <strong className="text-base-content">{sys?.memory?.heapUsed || "—"}</strong>
                </span>
                <span className="hl-muted-text">
                  Heap Total: <strong className="text-base-content">{sys?.memory?.heapTotal || "—"}</strong>
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-base-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500"
                  style={{ width: `${Math.min(100, Number(sys?.memory?.usedPercent ?? sys?.memoryUsage ?? 0))}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageTransition>
  );
}

export function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/notifications", { params: { limit: 30 } });
      setItems(data.notifications || []);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to load admin notifications."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAllRead = async () => {
    try {
      await api.patch("/admin/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All admin alerts marked read");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to update notifications."));
    }
  };

  const markSingle = async (id) => {
    try {
      await api.patch(`/admin/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {
      // silent
    }
  };

  return (
    <PageTransition className="space-y-6 max-w-3xl">
      <PageHeader
        eyebrow="Console Alerts"
        title="Admin Notifications"
        subtitle="System alerts, safety escalations, and operational notices for staff."
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Notifications" }]}
        actions={
          items.some((n) => !n.read) && (
            <Button size="sm" variant="outline" onClick={markAllRead} leftIcon={<CheckCheck className="h-4 w-4" />}>
              Mark all read
            </Button>
          )
        }
      />

      {error && <ErrorNotice message={error} onRetry={fetchAlerts} />}

      {loading ? (
        <PageSpinner label="Loading alerts..." />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="No system alerts" description="Safety escalations and operational notices will appear here." />
        </Card>
      ) : (
        <Card noPadding>
          <div className="divide-y divide-base-300/60">
            {items.map((n) => (
              <div key={n._id} className={`p-4 flex items-start justify-between gap-4 ${!n.read ? "bg-primary/5" : ""}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-base-content">{n.title || "System Alert"}</p>
                    {!n.read && <Badge tone="primary">Unread</Badge>}
                  </div>
                  <p className="text-xs hl-muted-text mt-1">{n.message}</p>
                  <time className="text-[11px] hl-muted-text mt-1 block">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </time>
                </div>
                {!n.read && (
                  <Button size="xs" variant="ghost" onClick={() => markSingle(n._id)}>
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageTransition>
  );
}

export function AdminSettings() {
  const { user, logout } = useAuth();
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Password updated. Other sessions revoked.");
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to change password."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition className="space-y-6 max-w-3xl">
      <PageHeader
        eyebrow="Operator Workspace"
        title="Console Settings"
        subtitle="Manage console appearance, operator credentials, and current session."
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Settings" }]}
      />

      <Card header={<span className="text-sm font-semibold">Operator Identity</span>}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar src={user?.profilePhoto} name={user?.name} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-base-content">{user?.name}</p>
                <RoleBadge role={user?.role} />
              </div>
              <p className="text-xs hl-muted-text">{user?.email}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>
      </Card>

      <Card header={<span className="text-sm font-semibold">Console Theme</span>}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-base-content">Interface Color Mode</p>
            <p className="text-xs hl-muted-text">Persisted cleanly without theme flash across tabs.</p>
          </div>
          <ThemeToggle showSystem />
        </div>
      </Card>

      <Card header={<span className="text-sm font-semibold">Rotate Staff Password</span>}>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Field
            label="Current password"
            type="password"
            required
            value={passwords.currentPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="New password"
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
            />
            <Field
              label="Confirm new password"
              type="password"
              required
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            />
          </div>
          <Button type="submit" size="sm" loading={busy}>
            Update Staff Password
          </Button>
        </form>
      </Card>
    </PageTransition>
  );
}
