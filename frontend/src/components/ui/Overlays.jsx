import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button, IconButton } from "./Button";

const MODAL_SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  subtitle = "",
  size = "md",
  footer = null,
  dismissible = true,
  children,
}) {
  const dialogRef = useRef(null);
  const pointerDownOnBackdrop = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  if (!open && !dialogRef.current?.open) {
    return (
      <dialog
        ref={dialogRef}
        aria-labelledby={title ? titleId : undefined}
        className="m-auto p-0 bg-transparent"
      />
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      onClose={() => onClose?.()}
      onCancel={(e) => {
        if (!dismissible) {
          e.preventDefault();
        } else {
          onClose?.();
        }
      }}
      onPointerDown={(e) => {
        pointerDownOnBackdrop.current = e.target === dialogRef.current;
      }}
      onClick={(e) => {
        if (dismissible && pointerDownOnBackdrop.current && e.target === dialogRef.current) {
          onClose?.();
        }
        pointerDownOnBackdrop.current = false;
      }}
      className={`m-auto w-full ${MODAL_SIZES[size] || MODAL_SIZES.md} rounded-xl border border-base-300 bg-base-100 p-0 text-base-content shadow-2xl overflow-hidden`}
    >
      <div className="flex flex-col max-h-[calc(100dvh-2rem)]">
        {(title || dismissible) && (
          <div className="flex items-start justify-between gap-4 border-b hl-subtle-divider px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-base font-semibold tracking-tight text-base-content">
                  {title}
                </h2>
              )}
              {subtitle && <p className="text-xs hl-muted-text mt-1">{subtitle}</p>}
            </div>
            {dismissible && (
              <IconButton label="Close dialog" size="sm" onClick={() => onClose?.()}>
                <X className="h-4 w-4" strokeWidth={1.75} />
              </IconButton>
            )}
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4 text-sm">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t hl-subtle-divider bg-base-200/50 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title = "Confirm action",
  message = "",
  description = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  busy = false,
  destructive = false,
  onConfirm,
  onCancel,
  onClose,
  children,
}) {
  const handleClose = onCancel || onClose;
  const resolvedTone = destructive ? "danger" : tone;
  const isLoading = loading || busy;
  const resolvedMessage = message || description;
  const confirmVariant = resolvedTone === "danger" ? "danger" : resolvedTone === "warning" ? "secondary" : "primary";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      size="sm"
      dismissible={!isLoading}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} size="sm" onClick={onConfirm} loading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
            resolvedTone === "danger"
              ? "bg-error/10 text-error border-error/25"
              : "bg-warning/10 text-warning border-warning/25"
          }`}
        >
          <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="space-y-2 text-sm hl-muted-text leading-relaxed">
          {resolvedMessage && <p className="text-base-content/90">{resolvedMessage}</p>}
          {children}
        </div>
      </div>
    </Modal>
  );
}

export function Drawer({
  open,
  onClose,
  title = "",
  subtitle = "",
  side = "right",
  widthClass = "max-w-md",
  footer = null,
  children,
}) {
  const dialogRef = useRef(null);
  const pointerDownOnBackdrop = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const sideAlign = side === "left" ? "mr-auto ml-0" : "ml-auto mr-0";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      onClose={() => onClose?.()}
      onCancel={() => onClose?.()}
      onPointerDown={(e) => {
        pointerDownOnBackdrop.current = e.target === dialogRef.current;
      }}
      onClick={(e) => {
        if (pointerDownOnBackdrop.current && e.target === dialogRef.current) {
          onClose?.();
        }
        pointerDownOnBackdrop.current = false;
      }}
      className={`fixed inset-y-0 ${sideAlign} my-0 h-dvh max-h-dvh w-full ${widthClass} border-base-300 ${
        side === "left" ? "border-r" : "border-l"
      } bg-base-100 p-0 text-base-content shadow-2xl overflow-hidden`}
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3 border-b hl-subtle-divider px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-base font-semibold tracking-tight text-base-content truncate">
                  {title}
                </h2>
              )}
              {subtitle && <p className="text-xs hl-muted-text mt-0.5 truncate">{subtitle}</p>}
            </div>
            <IconButton label="Close panel" size="sm" onClick={() => onClose?.()}>
              <X className="h-4 w-4" strokeWidth={1.75} />
            </IconButton>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="border-t hl-subtle-divider bg-base-200/50 px-5 py-3.5 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

export function Dropdown({
  trigger,
  align = "right",
  widthClass = "w-56",
  children,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {typeof trigger === "function"
        ? trigger({ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) })
        : (
          <div onClick={() => setOpen((o) => !o)} className="inline-flex">
            {trigger}
          </div>
        )}
      {open && (
        <div
          className={`absolute ${align === "left" ? "left-0" : "right-0"} z-50 mt-2 ${widthClass} max-w-[calc(100vw-2rem)] rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl`}
        >
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
