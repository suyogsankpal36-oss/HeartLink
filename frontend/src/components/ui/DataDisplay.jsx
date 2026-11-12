import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Inbox,
  Bell,
  Compass,
  Heart,
  Loader2,
  Monitor,
  Moon,
  Shield,
  Sun,
  User,
  Users,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "./Button";
import { Badge, Skeleton } from "./Surface";

export function DataTable({
  caption,
  columns = [],
  rows = [],
  keyField = "_id",
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or search query.",
  emptyAction = null,
  sortBy = "",
  sortOrder = "desc",
  onSort = null,
  onRowClick = null,
  rowClassName = "",
}) {
  if (loading && rows.length === 0) {
    return (
      <div className="hl-surface-card overflow-hidden p-4 space-y-3" aria-busy="true">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-4 py-2 border-b last:border-b-0 hl-subtle-divider">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/6 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <div className="hl-surface-card">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={caption}
      className="hl-surface-card overflow-x-auto focus:outline-primary"
    >
      <table className="w-full text-left border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b hl-subtle-divider bg-base-200/60 text-xs font-semibold uppercase tracking-wider hl-muted-text">
            {columns.map((col) => {
              const isSorted = Boolean(col.sortKey && sortBy === col.sortKey);
              const ariaSort = isSorted
                ? sortOrder === "asc"
                  ? "ascending"
                  : "descending"
                : undefined;

              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={`px-4 py-3 whitespace-nowrap ${col.headerClassName || ""}`}
                >
                  {col.sortKey && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.sortKey)}
                      className="inline-flex items-center gap-1.5 min-h-6 font-semibold uppercase tracking-wider hover:text-base-content transition-colors cursor-pointer"
                    >
                      <span>{col.label}</span>
                      {isSorted ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 hl-accent-text" strokeWidth={2} />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 hl-accent-text" strokeWidth={2} />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-45" strokeWidth={1.75} />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300/60">
          {rows.map((row, idx) => {
            const key = row[keyField] ?? row.id ?? idx;
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={[
                  "transition-colors hover:bg-base-200/60",
                  onRowClick ? "cursor-pointer" : "",
                  typeof rowClassName === "function" ? rowClassName(row) : rowClassName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3.5 align-middle ${col.cellClassName || ""}`}
                  >
                    {col.render ? col.render(row) : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page = 1, pages = 1, total = 0, limit = 20, onPageChange }) {
  if (pages <= 1 && total <= limit) return null;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-xs hl-muted-text">
      <p className="hl-tabular">
        Showing <span className="font-medium text-base-content">{start}</span> to{" "}
        <span className="font-medium text-base-content">{end}</span> of{" "}
        <span className="font-medium text-base-content">{total}</span> records
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
        >
          Previous
        </Button>
        <span className="px-2.5 font-medium text-base-content hl-tabular">
          Page {page} of {Math.max(1, pages)}
        </span>
        <Button
          variant="outline"
          size="xs"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function EmptyState({
  icon = Inbox,
  title = "Nothing here yet",
  description = "",
  text = "",
  action = null,
  className = "",
}) {
  const iconMap = { bell: Bell, compass: Compass, heart: Heart, shield: Shield, user: User, users: Users };
  const IconComp = typeof icon === "string" ? iconMap[icon] || null : icon;
  const isEmoji = typeof icon === "string" && !IconComp;
  const detail = description || text;
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className}`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-base-300 bg-base-200 text-base-content/60">
        {isEmoji ? <span className="text-xl leading-none" aria-hidden="true">{icon}</span> : <IconComp className="h-5 w-5" strokeWidth={1.75} />}
      </div>
      <h3 className="text-sm font-semibold text-base-content">{title}</h3>
      {detail && (
        <p className="mt-1 max-w-sm text-xs hl-muted-text leading-relaxed">{detail}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorNotice({
  message = "Something went wrong while loading this view.",
  children,
  onRetry = null,
  className = "",
}) {
  const detail = children || message;
  return (
    <div
      role="alert"
      className={`rounded-xl border border-error/30 bg-error/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" strokeWidth={1.75} />
        <div>
          <p className="text-sm font-medium text-base-content">Unable to complete request</p>
          <p className="text-xs text-error mt-0.5">{detail}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="outline" size="xs" onClick={onRetry} className="shrink-0">
          Retry
        </Button>
      )}
    </div>
  );
}

export function PageSpinner({ label = "Loading workspace..." }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" strokeWidth={1.75} />
      <p className="text-xs font-medium hl-muted-text">{label}</p>
    </div>
  );
}

export function ThemeToggle({ showSystem = false, compact = false }) {
  const { theme, themeMode, setTheme, toggleTheme } = useTheme();

  if (!showSystem) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        className="btn btn-ghost btn-sm h-9 px-2.5 rounded-lg border border-base-300/80 bg-base-100/80 hover:bg-base-300/60 inline-flex items-center gap-1.5 text-xs font-medium"
      >
        {theme === "dark" ? (
          <>
            <Sun className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
            {!compact && <span className="hidden sm:inline">Light</span>}
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 text-indigo-600" strokeWidth={1.75} />
            {!compact && <span className="hidden sm:inline">Dark</span>}
          </>
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme preference"
      className="inline-flex items-center rounded-lg border border-base-300 bg-base-200 p-0.5"
    >
      {[
        { id: "light", label: "Light", Icon: Sun },
        { id: "dark", label: "Dark", Icon: Moon },
        { id: "system", label: "Auto", Icon: Monitor },
      ].map(({ id, label, Icon }) => {
        const active = themeMode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              active
                ? "bg-base-100 text-base-content shadow-xs"
                : "hl-muted-text hover:text-base-content"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ActivityTimeline({ items = [], emptyMessage = "No activity recorded yet." }) {
  if (!items.length) {
    return <EmptyState icon={Clock} title={emptyMessage} />;
  }

  return (
    <ol className="relative border-l border-base-300 ml-3 space-y-4">
      {items.map((item, idx) => {
        const tone =
          item.status === "failure" || item.severity === "high" || item.severity === "critical"
            ? "danger"
            : item.severity === "medium"
            ? "warning"
            : "success";
        return (
          <li key={item._id || item.id || idx} className="ml-5 relative">
            <span
              aria-hidden="true"
              className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-base-100 ${
                tone === "danger"
                  ? "bg-error"
                  : tone === "warning"
                  ? "bg-warning"
                  : "bg-indigo-500"
              }`}
            />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-base-content">
                  {item.description || item.action || item.eventType}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs hl-muted-text">
                  {item.category && <Badge tone="neutral">{item.category}</Badge>}
                  {item.status && (
                    <Badge tone={item.status === "failure" ? "danger" : "success"}>
                      {item.status}
                    </Badge>
                  )}
                  {item.ip && <span className="font-mono text-[11px]">{item.ip}</span>}
                </div>
              </div>
              <time className="text-[11px] hl-muted-text hl-tabular shrink-0">
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
