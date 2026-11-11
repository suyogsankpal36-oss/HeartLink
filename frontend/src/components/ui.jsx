import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity, FiAlertCircle, FiArrowDown, FiArrowLeft, FiArrowRight, FiBell, FiCheck,
  FiCheckCircle, FiChevronDown, FiChevronLeft, FiChevronRight, FiCircle, FiClock,
  FiCompass, FiEye, FiEyeOff, FiFilter, FiHeart, FiHelpCircle, FiImage, FiInfo,
  FiLock, FiLogOut, FiMail, FiMapPin, FiMenu, FiMessageCircle, FiMoreHorizontal,
  FiPlus, FiSearch, FiSend, FiSettings, FiShield, FiSliders, FiStar, FiTrash2,
  FiUser, FiUsers, FiX, FiZap,
} from "react-icons/fi";
import { resolvePhotoUrl } from "../services/api";

const iconSet = {
  activity: FiActivity, alert: FiAlertCircle, arrowDown: FiArrowDown, arrowLeft: FiArrowLeft,
  arrowRight: FiArrowRight, bell: FiBell, check: FiCheck, checkCircle: FiCheckCircle,
  chevronDown: FiChevronDown, chevronLeft: FiChevronLeft, chevronRight: FiChevronRight,
  circle: FiCircle, clock: FiClock, compass: FiCompass, eye: FiEye, eyeOff: FiEyeOff,
  filter: FiFilter, heart: FiHeart, help: FiHelpCircle, image: FiImage, info: FiInfo,
  lock: FiLock, logout: FiLogOut, mail: FiMail, mapPin: FiMapPin, menu: FiMenu,
  message: FiMessageCircle, more: FiMoreHorizontal, plus: FiPlus, search: FiSearch,
  send: FiSend, settings: FiSettings, shield: FiShield, sliders: FiSliders,
  star: FiStar, trash: FiTrash2, user: FiUser, users: FiUsers, x: FiX, zap: FiZap,
};

export function Icon({ name, size = 18, className = "", strokeWidth = 1.8 }) {
  const Component = iconSet[name] || FiCircle;
  return <Component aria-hidden="true" className={className} size={size} strokeWidth={strokeWidth} />;
}

export function Logo({ light = false }) {
  return (
    <Link className={`brand ${light ? "brand-light" : ""}`} to="/" aria-label="HeartLink home">
      <span className="brand-mark"><Icon name="heart" size={19} /></span>
      <span className="brand-name">Heart<span>Link</span></span>
    </Link>
  );
}

export function Avatar({ person, size = "md", className = "" }) {
  const name = person?.name || "HeartLink member";
  const [failed, setFailed] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "H";
  const photo = resolvePhotoUrl(person?.profilePhoto || person?.image || person?.photo);
  const [first, second] = initials;
  useEffect(() => setFailed(false), [photo]);
  return photo && !failed ? (
    <img className={`avatar avatar-${size} ${className}`} src={photo} alt={name} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <span className={`avatar avatar-${size} avatar-fallback ${className}`} role="img" aria-label={name}>
      {first}{second && <i>{second}</i>}
    </span>
  );
}

export function Button({ children, to, variant = "primary", className = "", type = "button", disabled = false, onClick, ...props }) {
  const classes = `button button-${variant} ${className}`.trim();
  if (to) return <Link className={classes} to={to} {...props}>{children}</Link>;
  return <button className={classes} type={type} disabled={disabled} onClick={onClick} {...props}>{children}</button>;
}

export function PageHeading({ eyebrow, title, description, action, className = "" }) {
  return (
    <div className={`page-heading ${className}`}>
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}

export function Field({ label, id, hint, error, className = "", ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} />
      {hint && <small id={`${id}-hint`} className="field-hint">{hint}</small>}
      {error && <small id={`${id}-error`} className="field-error" role="alert">{error}</small>}
    </div>
  );
}

export function PageSpinner({ label = "Loading HeartLink" }) {
  return <div className="page-spinner" role="status"><span className="spinner" /><span>{label}</span></div>;
}

export function EmptyState({ icon = "heart", title, text, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={25} /></span><h2>{title}</h2><p>{text}</p>{action}</div>;
}

export function ErrorNotice({ children, onRetry }) {
  return <div className="error-notice" role="alert"><Icon name="alert" size={18} /><span>{children}</span>{onRetry && <Button variant="soft" onClick={onRetry}>Try again</Button>}</div>;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", busy = false, onConfirm, onCancel, destructive = false }) {
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel?.(); }}><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><span className={`confirm-icon ${destructive ? "destructive" : ""}`}><Icon name={destructive ? "alert" : "info"} size={22} /></span><h2 id="confirm-title">{title}</h2><p>{description}</p><div className="confirm-actions"><Button variant="soft" onClick={onCancel} disabled={busy}>Cancel</Button><Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>{busy ? "Please wait…" : confirmLabel}</Button></div></section></div>;
}
