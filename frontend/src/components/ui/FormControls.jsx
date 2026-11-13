import { forwardRef, useId, useState } from "react";
import { AlertCircle, Eye, EyeOff, Search, X } from "lucide-react";

export const Field = forwardRef(function Field(
  {
    id: providedId,
    label,
    hint = "",
    error = "",
    type = "text",
    required = false,
    leftIcon = null,
    rightSlot = null,
    className = "",
    inputClassName = "",
    children: _children,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id = providedId || autoId;
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-base-content/90 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-error" aria-hidden="true">*</span>}
        </label>
      )}
      {hint && (
        <p id={hintId} className="text-xs hl-muted-text leading-snug">
          {hint}
        </p>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 text-base-content/50 flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={isPassword ? (revealed ? "text" : "password") : type}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={[
            "input input-bordered w-full bg-base-100 text-sm h-10 rounded-lg transition-colors",
            "border-base-300 focus:border-primary focus:outline-none",
            error ? "border-error focus:border-error" : "",
            leftIcon ? "pl-9" : "px-3",
            isPassword || rightSlot ? "pr-10" : "pr-3",
            inputClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-md text-base-content/60 hover:text-base-content hover:bg-base-300/60 transition-colors"
          >
            {revealed ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        ) : (
          rightSlot && <div className="absolute right-2 flex items-center">{rightSlot}</div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error flex items-center gap-1.5 mt-0.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export const TextArea = forwardRef(function TextArea(
  {
    id: providedId,
    label,
    hint = "",
    error = "",
    maxLength,
    value = "",
    required = false,
    rows = 4,
    className = "",
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id = providedId || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const currentLength = typeof value === "string" ? value.length : 0;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-base-content/90 flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-error" aria-hidden="true">*</span>}
          </label>
        )}
        {maxLength && (
          <span className="text-[11px] hl-muted-text hl-tabular">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-xs hl-muted-text leading-snug">
          {hint}
        </p>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={[
          "textarea textarea-bordered w-full bg-base-100 text-sm rounded-lg p-3 leading-relaxed border-base-300 focus:border-primary focus:outline-none",
          error ? "border-error focus:border-error" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error flex items-center gap-1.5 mt-0.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export const Select = forwardRef(function Select(
  {
    id: providedId,
    label,
    hint = "",
    error = "",
    options = [],
    required = false,
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id = providedId || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-base-content/90 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-error" aria-hidden="true">*</span>}
        </label>
      )}
      {hint && (
        <p id={hintId} className="text-xs hl-muted-text leading-snug">
          {hint}
        </p>
      )}
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={[
          "select select-bordered w-full bg-base-100 text-sm h-10 min-h-10 rounded-lg border-base-300 focus:border-primary focus:outline-none",
          error ? "border-error focus:border-error" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error flex items-center gap-1.5 mt-0.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export function SearchBar({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  label = "Search",
  shortcut = "",
  className = "",
  inputProps = {},
}) {
  const id = useId();
  return (
    <div className={`relative flex items-center ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-base-content/50" strokeWidth={1.75} />
      <input
        id={id}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input input-bordered h-9 w-full bg-base-100 pl-9 pr-14 text-sm rounded-lg border-base-300 focus:border-primary focus:outline-none"
        {...inputProps}
      />
      {value ? (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange?.({ target: { value: "" } }))}
          aria-label="Clear search"
          className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-md text-base-content/60 hover:text-base-content hover:bg-base-300/60"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      ) : (
        shortcut && (
          <kbd className="pointer-events-none absolute right-2 hidden sm:inline-flex items-center rounded border border-base-300 bg-base-200 px-1.5 py-0.5 text-[10px] font-medium hl-muted-text">
            {shortcut}
          </kbd>
        )
      )}
    </div>
  );
}

export function ToggleSwitch({ id: providedId, label, description = "", checked = false, onChange, disabled = false }) {
  const autoId = useId();
  const id = providedId || autoId;

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-base-content cursor-pointer block">
          {label}
        </label>
        {description && <p className="text-xs hl-muted-text mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={Boolean(checked)}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className="toggle toggle-primary toggle-sm shrink-0 mt-0.5"
      />
    </div>
  );
}
