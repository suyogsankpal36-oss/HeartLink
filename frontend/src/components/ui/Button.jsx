import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const VARIANT_CLASSES = {
  primary: "btn-primary text-primary-content shadow-xs",
  secondary: "btn-neutral border border-base-300 text-neutral-content",
  soft: "bg-primary/12 text-primary border border-primary/25 hover:bg-primary/20",
  outline: "btn-outline border-base-300 bg-base-100 hover:bg-base-300/60 hover:text-base-content",
  ghost: "btn-ghost hover:bg-base-300/60",
  quiet: "btn-ghost text-base-content/70 hover:bg-base-300/60 hover:text-base-content",
  danger: "btn-error text-error-content",
  "soft-danger": "bg-error/12 text-error border border-error/25 hover:bg-error/20",
  success: "btn-success text-success-content",
  "soft-primary": "bg-primary/12 text-primary border border-primary/25 hover:bg-primary/20",
  dark: "btn-neutral text-neutral-content",
};

const SIZE_CLASSES = {
  xs: "btn-xs h-7 min-h-7 px-2.5 text-xs",
  sm: "btn-sm h-9 min-h-9 px-3.5 text-xs font-medium",
  md: "h-10 min-h-10 px-4 text-sm font-medium",
  lg: "btn-lg h-11 min-h-11 px-5 text-sm font-semibold",
};

export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    type = "button",
    loading = false,
    disabled = false,
    fullWidth = false,
    to = "",
    onClick,
    leftIcon = null,
    rightIcon = null,
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const classes = [
    "btn rounded-lg transition-all duration-150 inline-flex items-center justify-center gap-2 no-animation font-medium tracking-tight",
    variantClass,
    sizeClass,
    fullWidth ? "w-full" : "",
    disabled || loading ? "opacity-60 cursor-not-allowed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link
        ref={ref}
        to={to}
        aria-disabled={disabled || loading || undefined}
        tabIndex={disabled || loading ? -1 : undefined}
        onClick={(event) => {
          if (disabled || loading) event.preventDefault();
          onClick?.(event);
        }}
        className={classes}
        {...rest}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      className={classes}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" strokeWidth={1.75} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton(
  {
    label,
    variant = "ghost",
    size = "md",
    type = "button",
    loading = false,
    disabled = false,
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const sizeMap = {
    sm: "h-9 w-9 min-h-9 min-w-9",
    md: "h-10 w-10 min-h-10 min-w-10",
    lg: "h-11 w-11 min-h-11 min-w-11",
  };
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.ghost;

  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={rest.title || label}
      disabled={disabled || loading}
      className={[
        "btn btn-square rounded-lg inline-flex items-center justify-center p-0 transition-colors",
        variantClass,
        sizeMap[size] || sizeMap.md,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} /> : children}
    </button>
  );
});
