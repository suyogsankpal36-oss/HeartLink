import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api, apiErrorMessage } from "../../services/api";
import {
  ActivityTimeline,
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Drawer,
  Dropdown,
  ErrorNotice,
  Field,
  PageHeader,
  PageSpinner,
  PageTransition,
  Pagination,
  RoleBadge,
  SearchBar,
  Select,
  TextArea,
} from "../../components/ui";

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Slide-over Inspector Drawer state
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerActivities, setDrawerActivities] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Confirm Dialog states
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [roleConfirm, setRoleConfirm] = useState(null);
  const [mutating, setMutating] = useState(false);

  const isSuperAdmin = currentUser?.role === "superadmin";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/users", {
        params: {
          page,
          limit,
          search: search.trim() || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          sortBy,
          sortOrder,
        },
      });
      setUsers(data.users || []);
      setTotal(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load user directory."));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openInspector = async (target) => {
    setSelectedUser(target);
    setDrawerActivities([]);
    setDrawerLoading(true);
    try {
      const [detailRes, actRes] = await Promise.all([
        api.get(`/admin/users/${target._id}`),
        api.get(`/admin/users/${target._id}/activities`, { params: { limit: 15 } }),
      ]);
      if (detailRes.data?.user) setSelectedUser(detailRes.data.user);
      setDrawerActivities(actRes.data?.activities || []);
    } catch {
      // keep summary target
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleSort = (colKey) => {
    if (sortBy === colKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(colKey);
      setSortOrder(colKey === "name" || colKey === "email" ? "asc" : "desc");
    }
    setPage(1);
  };

  const confirmStatusChange = async () => {
    if (!statusConfirm) return;
    setMutating(true);
    try {
      const nextActive = !statusConfirm.isActive;
      const { data } = await api.patch(`/admin/users/${statusConfirm._id}/status`, {
        isActive: nextActive,
      });
      toast.success(data.message || "User status updated.");
      setUsers((prev) =>
        prev.map((u) => (u._id === statusConfirm._id ? { ...u, isActive: nextActive } : u)),
      );
      if (selectedUser?._id === statusConfirm._id) {
        setSelectedUser((prev) => ({ ...prev, isActive: nextActive }));
      }
      setStatusConfirm(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to change account status."));
    } finally {
      setMutating(false);
    }
  };

  const confirmRoleChange = async () => {
    if (!roleConfirm) return;
    setMutating(true);
    try {
      const { data } = await api.patch(`/admin/users/${roleConfirm.user._id}/role`, {
        role: roleConfirm.nextRole,
      });
      toast.success(data.message || "Role updated.");
      setUsers((prev) =>
        prev.map((u) => (u._id === roleConfirm.user._id ? { ...u, role: roleConfirm.nextRole } : u)),
      );
      if (selectedUser?._id === roleConfirm.user._id) {
        setSelectedUser((prev) => ({ ...prev, role: roleConfirm.nextRole }));
      }
      setRoleConfirm(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to update role."));
    } finally {
      setMutating(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "User",
      sortKey: "name",
      render: (row) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={row.profilePhoto} name={row.name} size="sm" verified={row.isVerified} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-base-content truncate">{row.name}</p>
            <p className="text-xs hl-muted-text truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortKey: "role",
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
      key: "lastActive",
      label: "Last Active",
      sortKey: "lastActive",
      render: (row) => (
        <span className="text-xs hl-muted-text hl-tabular whitespace-nowrap">
          {row.lastActive ? new Date(row.lastActive).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortKey: "createdAt",
      render: (row) => (
        <span className="text-xs hl-muted-text hl-tabular whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => {
        const isSelf = String(row._id) === String(currentUser?.id || currentUser?._id);
        const protectedSuper = row.role === "superadmin" && !isSuperAdmin;

        return (
          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="ghost" onClick={() => openInspector(row)}>
              Inspect
            </Button>
            <Dropdown
              align="right"
              widthClass="w-48"
              trigger={({ toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={`More actions for ${row.name}`}
                  className="btn btn-ghost btn-xs h-7 w-7 p-0 rounded-md"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            >
              {({ close }) => (
                <div className="flex flex-col text-xs text-left">
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      navigate(`/admin/users/${row._id}`);
                    }}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-base-200 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> Full Profile Page
                  </button>
                  {!isSelf && !protectedSuper && (
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        setStatusConfirm(row);
                      }}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-base-200 cursor-pointer ${
                        row.isActive ? "text-error" : "text-success"
                      }`}
                    >
                      {row.isActive ? (
                        <>
                          <UserX className="h-3.5 w-3.5" /> Suspend Account
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5" /> Activate Account
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title="User Management"
        subtitle="Search, inspect, sort, and govern member and staff accounts across the platform."
        breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Users" }]}
      />

      <Card noPadding className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5">
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
              placeholder="Search by name or email..."
              label="Search users"
            />
          </div>
          <div className="lg:col-span-3">
            <Select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Roles" },
                { value: "member", label: "Member" },
                { value: "moderator", label: "Moderator" },
                { value: "admin", label: "Admin" },
                { value: "superadmin", label: "Super Admin" },
              ]}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
                if (searchParams.get("status")) setSearchParams({});
              }}
              options={[
                { value: "", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Suspended" },
              ]}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              aria-label="Rows per page"
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              options={[
                { value: "10", label: "10 / page" },
                { value: "20", label: "20 / page" },
                { value: "50", label: "50 / page" },
              ]}
            />
          </div>
        </div>
      </Card>

      {error && <ErrorNotice message={error} onRetry={fetchUsers} />}

      <DataTable
        caption="HeartLink platform users directory"
        columns={columns}
        rows={users}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={openInspector}
      />

      <Pagination page={page} pages={totalPages} total={total} limit={limit} onPageChange={setPage} />

      {/* Slide-over User Profile Drawer */}
      <Drawer
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name || "Account Inspector"}
        subtitle={selectedUser?.email}
        widthClass="max-w-lg"
        footer={
          selectedUser && (
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
              <Link to={`/admin/users/${selectedUser._id}`}>
                <Button size="sm">Open Full Editor</Button>
              </Link>
            </>
          )
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar src={selectedUser.profilePhoto} name={selectedUser.name} size="xl" verified={selectedUser.isVerified} />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <RoleBadge role={selectedUser.role} />
                  <Badge tone={selectedUser.isActive ? "success" : "danger"} dot>
                    {selectedUser.isActive ? "Active" : "Suspended"}
                  </Badge>
                  {selectedUser.isEmailVerified && (
                    <Badge tone="info">Email Verified</Badge>
                  )}
                </div>
                <p className="text-xs hl-muted-text">
                  {selectedUser.city || "City unset"} · Joined{" "}
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border hl-subtle-divider bg-base-200/50 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base-content">Governance Controls</span>
                {String(selectedUser._id) === String(currentUser?.id || currentUser?._id) && (
                  <Badge tone="neutral">Current Session</Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {String(selectedUser._id) !== String(currentUser?.id || currentUser?._id) &&
                  (selectedUser.role !== "superadmin" || isSuperAdmin) && (
                    <Button
                      size="xs"
                      variant={selectedUser.isActive ? "soft-danger" : "success"}
                      onClick={() => setStatusConfirm(selectedUser)}
                    >
                      {selectedUser.isActive ? "Suspend Account" : "Activate Account"}
                    </Button>
                  )}
              </div>

              {isSuperAdmin && String(selectedUser._id) !== String(currentUser?.id || currentUser?._id) && (
                <div className="pt-2 border-t hl-subtle-divider">
                  <Select
                    label="Assign Role (Super Admin)"
                    value={selectedUser.role}
                    onChange={(e) => {
                      if (e.target.value !== selectedUser.role) {
                        setRoleConfirm({ user: selectedUser, nextRole: e.target.value });
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
              )}
            </div>

            {selectedUser.bio && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider hl-muted-text mb-1">
                  Profile Bio
                </h3>
                <p className="text-sm text-base-content leading-relaxed">{selectedUser.bio}</p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider hl-muted-text mb-3">
                Recent Account Activity
              </h3>
              {drawerLoading ? (
                <PageSpinner label="Loading activity timeline..." />
              ) : (
                <ActivityTimeline items={drawerActivities} />
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(statusConfirm)}
        title={statusConfirm?.isActive ? `Suspend ${statusConfirm?.name}?` : `Reactivate ${statusConfirm?.name}?`}
        message={
          statusConfirm?.isActive
            ? "Suspending this account revokes active refresh sessions and closes real-time sockets immediately."
            : "This restores sign-in and platform visibility for this member."
        }
        confirmLabel={statusConfirm?.isActive ? "Suspend User" : "Activate User"}
        tone={statusConfirm?.isActive ? "danger" : "primary"}
        loading={mutating}
        onCancel={() => setStatusConfirm(null)}
        onConfirm={confirmStatusChange}
      />

      <ConfirmDialog
        open={Boolean(roleConfirm)}
        title={`Change role to ${roleConfirm?.nextRole}?`}
        message={`Assigning the ${roleConfirm?.nextRole} role to ${roleConfirm?.user?.name} updates their RBAC permissions immediately and logs an audit entry.`}
        confirmLabel="Confirm Role Change"
        tone="warning"
        loading={mutating}
        onCancel={() => setRoleConfirm(null)}
        onConfirm={confirmRoleChange}
      />
    </PageTransition>
  );
}

export function UserDetails() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [target, setTarget] = useState(null);
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState({ name: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAdminOrSuper = ["admin", "superadmin"].includes(currentUser?.role);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const userRes = await api.get(`/admin/users/${id}`);
      const u = userRes.data?.user;
      setTarget(u);
      setForm({ name: u?.name || "", bio: u?.bio || "" });
      if (isAdminOrSuper) {
        const actRes = await api.get(`/admin/users/${id}/activities`, { params: { limit: 25 } });
        setActivities(actRes.data?.activities || []);
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to fetch user record."));
    } finally {
      setLoading(false);
    }
  }, [id, isAdminOrSuper]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/users/${id}`, {
        name: form.name.trim(),
        bio: form.bio.trim(),
      });
      setTarget((prev) => ({ ...prev, ...data.user }));
      toast.success("Account record updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update user."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        eyebrow="Account Inspector"
        title={target?.name || "User Profile"}
        subtitle={target?.email || "Detailed member metadata and audit log trace."}
        breadcrumbs={[
          { label: "Admin", to: "/admin/dashboard" },
          { label: "Users", to: "/admin/users" },
          { label: target?.name || "Details" },
        ]}
        actions={
          <Link to="/admin/users">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
              Back to Directory
            </Button>
          </Link>
        }
      />

      {error && <ErrorNotice message={error} onRetry={loadDetails} />}

      {loading ? (
        <PageSpinner label="Loading user dossier..." />
      ) : target ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-5">
            <Card>
              <div className="flex items-center gap-4 pb-4 border-b hl-subtle-divider">
                <Avatar src={target.profilePhoto} name={target.name} size="xl" verified={target.isVerified} />
                <div className="min-w-0 space-y-1.5">
                  <h2 className="text-base font-semibold text-base-content truncate">{target.name}</h2>
                  <p className="text-xs hl-muted-text truncate">{target.email}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <RoleBadge role={target.role} />
                    <Badge tone={target.isActive ? "success" : "danger"} dot>
                      {target.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 pt-4 text-xs">
                <div>
                  <dt className="hl-muted-text">Gender</dt>
                  <dd className="font-medium text-base-content capitalize mt-0.5">{target.gender || "—"}</dd>
                </div>
                <div>
                  <dt className="hl-muted-text">City</dt>
                  <dd className="font-medium text-base-content mt-0.5">{target.city || "—"}</dd>
                </div>
                <div>
                  <dt className="hl-muted-text">Auth Provider</dt>
                  <dd className="font-medium text-base-content uppercase mt-0.5">{target.authProvider || "local"}</dd>
                </div>
                <div>
                  <dt className="hl-muted-text">Email Verified</dt>
                  <dd className="font-medium text-base-content mt-0.5 flex items-center gap-1">
                    {target.isEmailVerified ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Verified
                      </>
                    ) : (
                      "Pending"
                    )}
                  </dd>
                </div>
              </dl>
            </Card>

            {isAdminOrSuper && (
              <Card header={<span className="text-sm font-semibold">Quick Record Edit</span>}>
                <form onSubmit={handleSave} className="space-y-4">
                  <Field
                    label="Display Name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <TextArea
                    label="Bio"
                    rows={3}
                    maxLength={500}
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  />
                  <Button type="submit" size="sm" loading={saving}>
                    Save Fields
                  </Button>
                </form>
              </Card>
            )}
          </div>

          <div className="lg:col-span-7">
            <Card
              header={
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 hl-accent-text" />
                  <span className="text-sm font-semibold text-base-content">User Activity History</span>
                </div>
              }
            >
              <ActivityTimeline items={activities} emptyMessage="No logged events for this user." />
            </Card>
          </div>
        </div>
      ) : null}
    </PageTransition>
  );
}
