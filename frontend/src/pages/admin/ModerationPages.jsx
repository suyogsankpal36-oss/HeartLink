import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowUpRight,
  Compass,
  LifeBuoy,
  Megaphone,
  MessageCircleOff,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { api, apiErrorMessage } from "../../services/api";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  ErrorNotice,
  Modal,
  PageHeader,
  PageTransition,
  Pagination,
  RoleBadge,
  Select,
  TextArea,
} from "../../components/ui";

const REPORT_STATUS_TONE = {
  open: "danger",
  pending: "warning",
  under_review: "info",
  reviewed: "info",
  resolved: "success",
  dismissed: "neutral",
};

const TICKET_STATUS_TONE = {
  open: "danger",
  in_progress: "warning",
  resolved: "success",
};

const MODERATION_STATS = [
  { key: "open", label: "Needs triage", icon: ShieldAlert, tone: "text-error" },
  { key: "inReview", label: "Under review", icon: Activity, tone: "text-info" },
  { key: "escalated", label: "Escalated", icon: ArrowUpRight, tone: "text-warning" },
  { key: "resolvedToday", label: "Resolved today", icon: ShieldCheck, tone: "text-success" },
];

export function ModeratorDashboardPage() {
  const [overview, setOverview] = useState({ stats: {}, recentCases: [], myActions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/moderation/overview");
      setOverview({
        stats: data.stats || {},
        recentCases: data.recentCases || [],
        myActions: data.myActions || [],
      });
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to load the moderation overview."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Trust & Safety Workspace"
        title="Moderation overview"
        subtitle="Triage safety reports, record proportionate actions, and escalate cases without exposing private conversations."
        actions={
          <Link to="/admin/reports">
            <Button rightIcon={<ArrowUpRight className="h-4 w-4" />}>Open report queue</Button>
          </Link>
        }
      />

      {error && <ErrorNotice message={error} onRetry={loadOverview} />}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Moderation queue statistics">
        {MODERATION_STATS.map(({ key, label, icon: Icon, tone }) => (
          <Card key={key} className="p-4 space-y-3" noPadding>
            <div className="flex items-center justify-between">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-base-200 ${tone}`}>
                <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
              </span>
              <span className="text-2xl font-semibold hl-tabular text-base-content">
                {loading ? "—" : Number(overview.stats[key] || 0)}
              </span>
            </div>
            <p className="text-xs font-medium hl-muted-text">{label}</p>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Priority cases" subtitle="Latest unresolved reports. Case notes are limited to report metadata.">
          <div className="divide-y divide-base-300/70">
            {overview.recentCases.length ? overview.recentCases.map((item) => (
              <div key={item._id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-base-content truncate">
                    {item.reportedUser?.name || "Deleted member"}
                  </p>
                  <p className="text-xs hl-muted-text capitalize truncate">
                    {String(item.reason || "other").replace(/_/g, " ")} · {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.escalation?.isEscalated && <Badge tone="warning">Escalated</Badge>}
                  <Badge tone={REPORT_STATUS_TONE[item.status] || "neutral"}>{String(item.status || "open").replace(/_/g, " ")}</Badge>
                </div>
              </div>
            )) : (
              <p className="text-sm hl-muted-text py-5">No unresolved safety cases.</p>
            )}
          </div>
        </Card>

        <Card title="Your recorded actions" subtitle="Every staff action is written to the immutable administrative audit trail.">
          <div className="divide-y divide-base-300/70">
            {overview.myActions.length ? overview.myActions.map((item) => (
              <div key={item._id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-base-content capitalize">{String(item.action || "action").replace(/_/g, " ")}</p>
                  <p className="text-xs hl-muted-text truncate">{item.targetId?.name || "Safety case"}</p>
                </div>
                <time className="text-[11px] hl-muted-text hl-tabular shrink-0">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                </time>
              </div>
            )) : (
              <p className="text-sm hl-muted-text py-5">No actions have been recorded by this account yet.</p>
            )}
          </div>
        </Card>
      </section>
    </PageTransition>
  );
}

export function ReportQueuePage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null);
  const [actionDialog, setActionDialog] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [restrictionDays, setRestrictionDays] = useState("7");
  const [escalationTarget, setEscalationTarget] = useState("admin");
  const [busy, setBusy] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/reports", {
        params: {
          page,
          limit: 20,
          status: statusFilter || undefined,
          reason: reasonFilter || undefined,
        },
      });
      setReports(data.reports || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to retrieve moderation reports."));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, reasonFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const updateReportStatus = async (reportId, status, actionOnUser = undefined) => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/admin/reports/${reportId}`, {
        status,
        ...(actionOnUser ? { actionOnUser } : {}),
      });
      toast.success(data.message || "Moderation report updated.");
      setActionConfirm(null);
      setActionDialog(null);
      setSelectedReport(null);
      await loadReports();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to update report."));
    } finally {
      setBusy(false);
    }
  };

  const openModerationAction = (report, action) => {
    setActionNote("");
    setRestrictionDays("7");
    setEscalationTarget("admin");
    setActionDialog({ report, action });
  };

  const submitModerationAction = async () => {
    if (!actionDialog) return;
    setBusy(true);
    try {
      const { action, report } = actionDialog;
      const payload = {
        actionOnUser: action,
        actionNote,
        ...(action === "escalate" ? { escalationTarget } : {}),
        ...(action === "restrict_messaging" || action === "restrict_discovery" ? { restrictionDays: Number(restrictionDays) } : {}),
        ...(action === "escalate" ? {} : { status: "under_review" }),
      };
      const { data } = await api.patch(`/admin/reports/${report._id}`, payload);
      toast.success(data.message || "Moderation action recorded.");
      setActionDialog(null);
      setSelectedReport(null);
      await loadReports();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to record moderation action."));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: "reportedUser",
      label: "Reported Member",
      render: (row) => (
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-base-content truncate">
              {row.reportedUser?.name || "Deleted user"}
            </span>
            {row.reportedUser?.role && <RoleBadge role={row.reportedUser.role} />}
          </div>
          <p className="text-[11px] hl-muted-text truncate">
            {row.reportedUser?.email || "—"} ·{" "}
            <span className={row.reportedUser?.isActive === false ? "text-error font-medium" : "text-emerald-500"}>
              {row.reportedUser?.isActive === false ? "Suspended" : "Active"}
            </span>
          </p>
        </div>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => (
        <div>
          <Badge tone="warning">{String(row.reason || "").replace(/_/g, " ")}</Badge>
          {(row.details || row.description) && (
            <p className="text-xs hl-muted-text mt-1 line-clamp-1 max-w-xs">
              {row.details || row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "reporter",
      label: "Reporter",
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-base-content">{row.reporter?.name || "Member"}</p>
          <p className="text-[11px] hl-muted-text">{row.reporter?.email || "—"}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge tone={REPORT_STATUS_TONE[row.status] || "neutral"} dot>
          {String(row.status || "open").replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Submitted",
      render: (row) => (
        <span className="text-xs hl-muted-text hl-tabular whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Review",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <Button size="xs" variant="outline" onClick={() => setSelectedReport(row)}>
          Review Case
        </Button>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Trust & Safety"
        title="Moderation Report Queue"
        subtitle="Inspect member safety reports, triage incidents, and enforce account suspensions when required."
        breadcrumbs={[{ label: "Moderation" }, { label: "Report Queue" }]}
      />

      <Card noPadding className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <Select
            aria-label="Filter reports by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Statuses" },
              { value: "open", label: "Open" },
              { value: "under_review", label: "Under Review" },
              { value: "resolved", label: "Resolved" },
              { value: "dismissed", label: "Dismissed" },
            ]}
          />
          <Select
            aria-label="Filter reports by reason"
            value={reasonFilter}
            onChange={(e) => {
              setReasonFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Reasons" },
              { value: "harassment", label: "Harassment" },
              { value: "fake_profile", label: "Fake Profile" },
              { value: "spam_or_scam", label: "Spam or Scam" },
              { value: "inappropriate_photos", label: "Inappropriate Photos" },
              { value: "underage", label: "Underage" },
              { value: "other", label: "Other" },
            ]}
          />
        </div>
      </Card>

      {error && <ErrorNotice message={error} onRetry={loadReports} />}
      <DataTable
        caption="Safety reports moderation queue"
        columns={columns}
        rows={reports}
        loading={loading}
        emptyTitle="Moderation queue is clear"
        emptyDescription="No safety reports match the selected filters."
      />
      <Pagination
        page={page}
        pages={pagination.pages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={setPage}
      />

      {/* Case Inspector Modal */}
      <Modal
        open={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title="Safety Report Case Review"
        subtitle={`Case ID: ${selectedReport?._id || ""}`}
        size="md"
        footer={
          selectedReport && (
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <div className="flex flex-wrap gap-2">
                {selectedReport.reportedUser && (
                  <Button
                    size="sm"
                    variant={selectedReport.reportedUser.isActive === false ? "success" : "soft-danger"}
                    disabled={busy}
                    leftIcon={
                      selectedReport.reportedUser.isActive === false ? (
                        <UserCheck className="h-3.5 w-3.5" />
                      ) : (
                        <UserX className="h-3.5 w-3.5" />
                      )
                    }
                    onClick={() =>
                      setActionConfirm({
                        report: selectedReport,
                        action: selectedReport.reportedUser.isActive === false ? "reactivate" : "suspend",
                      })
                    }
                  >
                    {selectedReport.reportedUser.isActive === false ? "Reactivate User" : "Suspend User"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  leftIcon={<Megaphone className="h-3.5 w-3.5" />}
                  onClick={() => openModerationAction(selectedReport, "warn")}
                >
                  Issue warning
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  leftIcon={<MessageCircleOff className="h-3.5 w-3.5" />}
                  onClick={() => openModerationAction(selectedReport, "restrict_messaging")}
                >
                  Restrict messaging
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  leftIcon={<Compass className="h-3.5 w-3.5" />}
                  onClick={() => openModerationAction(selectedReport, "restrict_discovery")}
                >
                  Restrict discovery
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  leftIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
                  onClick={() => openModerationAction(selectedReport, "escalate")}
                >
                  Escalate
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => updateReportStatus(selectedReport._id, "dismissed")}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => updateReportStatus(selectedReport._id, "under_review")}
                >
                  Mark Under Review
                </Button>
                <Button
                  size="sm"
                  loading={busy}
                  onClick={() => updateReportStatus(selectedReport._id, "resolved")}
                >
                  Resolve Case
                </Button>
              </div>
            </div>
          )
        }
      >
        {selectedReport && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border hl-subtle-divider bg-base-200/50 p-3">
                <p className="hl-muted-text uppercase font-semibold tracking-wider mb-1">Reported Account</p>
                <p className="text-sm font-semibold text-base-content">
                  {selectedReport.reportedUser?.name || "Deleted"}
                </p>
                <p className="hl-muted-text">{selectedReport.reportedUser?.email || "—"}</p>
              </div>
              <div className="rounded-lg border hl-subtle-divider bg-base-200/50 p-3">
                <p className="hl-muted-text uppercase font-semibold tracking-wider mb-1">Submitted By</p>
                <p className="text-sm font-semibold text-base-content">
                  {selectedReport.reporter?.name || "Member"}
                </p>
                <p className="hl-muted-text">{selectedReport.reporter?.email || "—"}</p>
              </div>
            </div>

            <div className="rounded-lg border hl-subtle-divider p-3.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning" />
                <span className="font-semibold text-base-content capitalize">
                  {String(selectedReport.reason || "").replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-base-content leading-relaxed">
                {selectedReport.details || selectedReport.description || "No written explanation provided."}
              </p>
            </div>

            <div className="rounded-lg border hl-subtle-divider p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-base-content">Moderation history</p>
                {selectedReport.escalation?.isEscalated && <Badge tone="warning">Escalated to {selectedReport.escalation.targetRole}</Badge>}
              </div>
              {selectedReport.moderationHistory?.length ? (
                <ol className="space-y-2.5">
                  {[...selectedReport.moderationHistory].reverse().map((entry, index) => (
                    <li key={`${entry.createdAt || index}-${entry.action}`} className="border-l-2 border-primary/25 pl-3">
                      <p className="font-medium text-base-content capitalize">
                        {String(entry.action || "action").replace(/_/g, " ")}
                      </p>
                      <p className="hl-muted-text mt-0.5">
                        {entry.actor?.name || "Staff member"} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                        {entry.restrictionUntil ? ` · until ${new Date(entry.restrictionUntil).toLocaleString()}` : ""}
                      </p>
                      {entry.note && <p className="text-base-content/80 mt-1">{entry.note}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="hl-muted-text">No moderation action has been recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(actionConfirm)}
        title={
          actionConfirm?.action === "suspend"
            ? `Suspend ${actionConfirm?.report?.reportedUser?.name}?`
            : `Reactivate ${actionConfirm?.report?.reportedUser?.name}?`
        }
        message={
          actionConfirm?.action === "suspend"
            ? "This suspends the reported account, disconnects active sockets, and marks the report resolved."
            : "This restores sign-in access for the reported account."
        }
        confirmLabel={actionConfirm?.action === "suspend" ? "Confirm Suspension" : "Reactivate"}
        tone={actionConfirm?.action === "suspend" ? "danger" : "primary"}
        loading={busy}
        onCancel={() => setActionConfirm(null)}
        onConfirm={() =>
          updateReportStatus(
            actionConfirm.report._id,
            actionConfirm.action === "suspend" ? "resolved" : "under_review",
            actionConfirm.action,
          )
        }
      />

      <Modal
        open={Boolean(actionDialog)}
        onClose={() => !busy && setActionDialog(null)}
        title={
          actionDialog?.action === "warn"
            ? "Issue account warning"
            : actionDialog?.action === "restrict_messaging"
            ? "Temporarily restrict messaging"
            : actionDialog?.action === "restrict_discovery"
            ? "Temporarily restrict discovery"
            : "Escalate safety case"
        }
        subtitle="This action is permission-checked on the server and recorded in the administrative audit log."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button size="sm" loading={busy} onClick={submitModerationAction}>
              Record action
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {(actionDialog?.action === "restrict_messaging" || actionDialog?.action === "restrict_discovery") && (
            <Select
              label="Restriction duration"
              value={restrictionDays}
              onChange={(event) => setRestrictionDays(event.target.value)}
              options={[
                { value: "1", label: "1 day" },
                { value: "3", label: "3 days" },
                { value: "7", label: "7 days" },
                { value: "14", label: "14 days" },
                { value: "30", label: "30 days" },
              ]}
            />
          )}
          {actionDialog?.action === "escalate" && (
            <Select
              label="Escalate to"
              value={escalationTarget}
              onChange={(event) => setEscalationTarget(event.target.value)}
              options={[
                { value: "admin", label: "Admin review" },
                { value: "superadmin", label: "Super Admin review" },
              ]}
            />
          )}
          <TextArea
            label="Internal case note"
            hint="Do not include credentials, authentication tokens, or irrelevant private information."
            value={actionNote}
            onChange={(event) => setActionNote(event.target.value)}
            maxLength={600}
            rows={4}
            placeholder="Brief factual justification for this moderation decision..."
          />
        </div>
      </Modal>
    </PageTransition>
  );
}

export function SupportQueuePage() {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/support", {
        params: {
          page,
          limit: 20,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        },
      });
      setTickets(data.tickets || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to fetch support queue."));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const updateTicketStatus = async (id, status) => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/admin/support/${id}`, { status });
      toast.success(data.message || "Ticket status updated.");
      setSelectedTicket(null);
      await loadTickets();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update ticket."));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: "subject",
      label: "Subject",
      render: (row) => (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-base-content truncate max-w-xs">{row.subject}</p>
          <p className="text-[11px] hl-muted-text truncate max-w-xs">{row.email}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => <Badge tone="neutral">{row.category}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge tone={TICKET_STATUS_TONE[row.status] || "neutral"} dot>
          {String(row.status || "open").replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Received",
      render: (row) => (
        <span className="text-xs hl-muted-text hl-tabular whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Manage",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <Button size="xs" variant="outline" onClick={() => setSelectedTicket(row)}>
          Open Ticket
        </Button>
      ),
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Help Desk Operations"
        title="Support Ticket Queue"
        subtitle="Review incoming member inquiries and track issue resolution progress."
        breadcrumbs={[{ label: "Moderation" }, { label: "Support Tickets" }]}
      />

      <Card noPadding className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <Select
            aria-label="Filter support by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Statuses" },
              { value: "open", label: "Open" },
              { value: "in_progress", label: "In Progress" },
              { value: "resolved", label: "Resolved" },
            ]}
          />
          <Select
            aria-label="Filter support by category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Categories" },
              { value: "account", label: "Account" },
              { value: "profile", label: "Profile" },
              { value: "matching", label: "Matching" },
              { value: "billing", label: "Billing" },
              { value: "safety", label: "Safety" },
              { value: "other", label: "Other" },
            ]}
          />
        </div>
      </Card>

      {error && <ErrorNotice message={error} onRetry={loadTickets} />}
      <DataTable
        caption="Support ticket queue"
        columns={columns}
        rows={tickets}
        loading={loading}
        emptyTitle="No support tickets found"
        emptyDescription="Incoming member requests submitted on the Help page appear here."
      />
      <Pagination
        page={page}
        pages={pagination.pages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={setPage}
      />

      <Modal
        open={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket?.subject || "Support Ticket"}
        subtitle={`${selectedTicket?.email || ""} · Category: ${selectedTicket?.category || ""}`}
        size="md"
        footer={
          selectedTicket && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => updateTicketStatus(selectedTicket._id, "in_progress")}
              >
                Mark In Progress
              </Button>
              <Button
                size="sm"
                loading={busy}
                onClick={() => updateTicketStatus(selectedTicket._id, "resolved")}
              >
                Resolve Ticket
              </Button>
            </>
          )
        }
      >
        {selectedTicket && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-xs hl-muted-text">
              <LifeBuoy className="h-4 w-4 hl-accent-text" />
              <span>Submitted by {selectedTicket.user?.name || selectedTicket.email}</span>
            </div>
            <div className="rounded-lg border hl-subtle-divider bg-base-200/50 p-4 leading-relaxed whitespace-pre-wrap text-base-content">
              {selectedTicket.message}
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
