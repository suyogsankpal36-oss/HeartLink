import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Heart } from "lucide-react";
import { resolvePhotoUrl } from "../../services/api";

export function Logo({ to = "/", badge = "", compact = false, className = "", light = false, asDiv = false }) {
  const content = (
    <>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#E61E50] via-[#F43F5E] to-[#FB7185] text-white shadow-md shadow-rose-500/25 shrink-0">
        <Heart className="h-4 w-4 fill-white text-white" strokeWidth={0} />
      </span>
      {!compact && (
        <span className="inline-flex items-baseline gap-0.5">
          <span className={`text-[19px] font-bold tracking-tight font-serif ${light ? "text-white" : "text-base-content"}`}>
            HeartLink
          </span>
          <span className="text-[#E61E50] text-xl font-bold font-serif leading-none">.</span>
          {badge && (
            <span className="ml-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#E61E50]">
              {badge}
            </span>
          )}
        </span>
      )}
    </>
  );

  const classes = `inline-flex items-center gap-2.5 select-none no-underline ${light ? "text-white" : ""} ${className}`;

  if (asDiv || !to) {
    return <div className={classes}>{content}</div>;
  }

  return (
    <Link to={to} aria-label="HeartLink home" className={classes}>
      {content}
    </Link>
  );
}

export function Card({
  variant = "default",
  header = null,
  footer = null,
  noPadding = false,
  className = "",
  children,
  ...rest
}) {
  const variantMap = {
    default: "hl-surface-card",
    interactive: "hl-surface-interactive",
    elevated: "bg-base-100 border border-base-300/80 shadow-md rounded-xl",
    muted: "bg-base-200/70 border border-base-300/70 rounded-xl",
  };

  return (
    <div
      className={`${variantMap[variant] || variantMap.default} overflow-hidden ${className}`}
      {...rest}
    >
      {header && (
        <div className="border-b hl-subtle-divider px-5 py-3.5 flex items-center justify-between gap-3">
          {header}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
      {footer && (
        <div className="border-t hl-subtle-divider px-5 py-3 bg-base-200/40">
          {footer}
        </div>
      )}
    </div>
  );
}

const TONE_MAP = {
  neutral: "bg-base-300/60 text-base-content border-base-300",
  primary: "bg-primary/12 text-indigo-600 dark:text-indigo-300 border-primary/25",
  purple: "bg-violet-500/12 text-violet-600 dark:text-violet-300 border-violet-500/25",
  info: "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25",
  success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
  danger: "bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25",
};

export function Badge({ tone = "neutral", dot = false, className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight ${TONE_MAP[tone] || TONE_MAP.neutral} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-85" aria-hidden="true" />}
      {children}
    </span>
  );
}

const ROLE_META = {
  superadmin: { label: "Super Admin", tone: "purple" },
  admin: { label: "Admin", tone: "info" },
  moderator: { label: "Moderator", tone: "warning" },
  member: { label: "Member", tone: "neutral" },
};

export function RoleBadge({ role = "member", className = "" }) {
  const key = String(role || "member").toLowerCase();
  const meta = ROLE_META[key] || ROLE_META.member;
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  delta = "",
  subtitle = "",
  icon: IconComp = null,
  tone = "primary",
  to = "",
  onClick = null,
}) {
  const iconTone = {
    primary: "bg-indigo-500/12 text-indigo-500 border-indigo-500/20",
    success: "bg-emerald-500/12 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/12 text-amber-500 border-amber-500/20",
    danger: "bg-rose-500/12 text-rose-500 border-rose-500/20",
    info: "bg-sky-500/12 text-sky-500 border-sky-500/20",
    purple: "bg-violet-500/12 text-violet-500 border-violet-500/20",
  }[tone] || "bg-indigo-500/12 text-indigo-500 border-indigo-500/20";

  const body = (
    <div className="p-5 flex flex-col justify-between gap-3 h-full">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider hl-muted-text">
          {label}
        </span>
        {IconComp && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg border shrink-0 ${iconTone}`}>
            <IconComp className="h-4 w-4" strokeWidth={1.75} />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-base-content hl-tabular">
          {value ?? "—"}
        </span>
        {delta && (
          <span className="text-xs font-medium hl-accent-text bg-primary/10 px-2 py-0.5 rounded-full">
            {delta}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs hl-muted-text leading-relaxed">{subtitle}</p>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="hl-surface-interactive block no-underline text-inherit">
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="hl-surface-interactive text-left w-full cursor-pointer">
        {body}
      </button>
    );
  }
  return <div className="hl-surface-card">{body}</div>;
}

export function Avatar({
  person = null,
  src = "",
  name = "",
  size = "md",
  online = false,
  verified = false,
  className = "",
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const personSource = person?.profilePhoto || person?.image || person?.photo || person?.photos?.[0] || "";
  const displayName = name || person?.name || "HeartLink member";
  const source = src || personSource;
  const sizes = {
    xs: "h-7 w-7 text-[11px]",
    sm: "h-9 w-9 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
    "2xl": "h-24 w-24 text-2xl",
  };
  const resolved = source ? resolvePhotoUrl(source) : "";
  const initials = String(displayName || "H")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "H";

  useEffect(() => setImageFailed(false), [resolved]);

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`${sizes[size] || sizes.md} rounded-full overflow-hidden border border-base-300 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center font-semibold text-base-content`}
      >
        {resolved && !imageFailed ? (
          <img
            src={resolved}
            alt={displayName}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {online && (
        <span
          aria-label="Online"
          title="Online now"
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-base-100"
        />
      )}
      {verified && !online && (
        <span
          aria-label="Verified"
          title="Verified profile"
          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white ring-2 ring-base-100"
        >
          <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}

export function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs hl-muted-text">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" strokeWidth={1.75} />}
              {isLast || !item.to ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "font-medium text-base-content" : ""}
                >
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="hover:text-base-content transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({
  eyebrow = "",
  title,
  subtitle = "",
  breadcrumbs = [],
  actions = null,
  className = "",
}) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-5 border-b hl-subtle-divider mb-6 ${className}`}>
      <div className="min-w-0">
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-widest hl-accent-text mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-base-content truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm hl-muted-text mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

export function PageHeading({ description, action, subtitle, actions, ...props }) {
  return <PageHeader subtitle={subtitle ?? description} actions={actions ?? action} {...props} />;
}

export function Skeleton({ className = "h-4 w-full" }) {
  return <div className={`animate-pulse rounded-md bg-base-300/65 ${className}`} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="hl-surface-card p-5 space-y-3" aria-hidden="true">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}
