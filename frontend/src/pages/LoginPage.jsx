import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../services/api";
import { getDashboardForRole } from "../components/ProtectedRoute";
import {
  Badge,
  Button,
  FadeInView,
  Field,
  Logo,
  ThemeToggle,
} from "../components/ui";

export function LoginPage() {
  const { authenticate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const next = {};
    const trimmed = identifier.trim();
    if (!trimmed) {
      next.identifier = "Please enter your email address or username.";
    } else if (trimmed.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      next.identifier = "Please enter a valid email address.";
    }

    if (!password) {
      next.password = "Please enter your password.";
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setBusy(true);
    try {
      const payload = {
        email: identifier.trim(),
        password,
      };

      const result = await authenticate("login", payload);
      if (result?.user) {
        toast.success(`Welcome back, ${result.user.name || "Member"}!`);

        // Read verified role from backend response
        const targetDashboard = getDashboardForRole(result.user.role);
        const destination =
          location.state?.from &&
          !location.state.from.includes("/login") &&
          !location.state.from.includes("/admin/login")
            ? location.state.from
            : targetDashboard;

        navigate(destination, { replace: true });
      } else {
        setServerError(result?.message || "Authentication failed. Please verify credentials.");
      }
    } catch (err) {
      const msg = apiErrorMessage(err, "Invalid email or password.");
      setServerError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-12 bg-base-200 text-base-content transition-colors duration-200">
      {/* Left Brand Panel (Desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-gradient-to-br from-[#180d17] via-[#100810] to-[#1a0a14] text-slate-100 p-10 border-r border-rose-500/10 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl animate-pulse"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-pink-500/15 blur-3xl"
        />

        <div className="relative z-10 flex items-center justify-between">
          <Logo light />
          <Link
            to="/"
            className="text-xs text-rose-300 hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="relative z-10 space-y-6 my-auto py-8">
          <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl border border-rose-500/20 shadow-2xl relative">
            <img
              src="/heartlink-couple.jpg"
              alt="HeartLink connections artwork"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F8DCE5]">Where Hearts Find Their Connection</p>
                <p className="text-sm font-bold text-white">Discover &bull; Connect &bull; Match &bull; Love</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#F45B83]">
              Romantic &bull; Elegant &bull; Trustworthy
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white leading-snug">
              Intentional Dating, Verified Safety &amp; Chemistry.
            </h2>
            <p className="text-sm text-rose-200/70 leading-relaxed">
              Sign in to your Heartlink account. The system automatically detects your credentials and routes you directly to your authorized workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs text-rose-100">
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/30 p-3 flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Role-governed RBAC</span>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/30 p-3 flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Rotating JWT Sessions</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          HeartLink Enterprise Security &bull; End-to-End Authenticated
        </p>
      </aside>

      {/* Right Login Form Panel */}
      <main className="lg:col-span-7 flex flex-col justify-center px-4 py-8 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b hl-subtle-divider">
            <Logo />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/" className="text-xs hl-muted-text hover:text-base-content transition-colors">
                Home
              </Link>
            </div>
          </div>

          <FadeInView className="space-y-2">
            <Badge tone="primary" dot>
              Unified Sign In
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
              Welcome back
            </h1>
            <p className="text-sm hl-muted-text">
              Sign in with your email or username to access your account.
            </p>
          </FadeInView>

          {/* Server Error Alert */}
          {serverError && (
            <div role="alert" className="alert alert-error text-xs rounded-xl shadow-sm border border-error/20">
              <Shield className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Common Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email / Username Field */}
            <Field
              id="login-identifier"
              label="Email or Username"
              type="text"
              name="identifier"
              autoComplete="username email"
              required
              placeholder="name@example.com"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
              }}
              error={errors.identifier}
              hint="Enter the email associated with your account"
              leftIcon={<Mail className="h-4 w-4" />}
            />

            {/* Password Field with built-in Reveal Toggle */}
            <Field
              id="login-password"
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox checkbox-xs checkbox-primary rounded"
                />
                <span className="hl-muted-text">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-medium hl-accent-text hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Login Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={busy}
              disabled={busy}
              rightIcon={!busy && <ArrowRight className="h-4 w-4" />}
              className="mt-2 rounded-xl shadow-lg shadow-rose-500/25"
            >
              {busy ? "Signing in..." : "Sign In to Account"}
            </Button>
          </form>

          {/* Registration Prompt for New Members */}
          <div className="text-center pt-2">
            <p className="text-xs hl-muted-text">
              Don&apos;t have an account yet?{" "}
              <Link to="/signup" className="font-semibold hl-accent-text hover:underline">
                Create Member Profile
              </Link>
            </p>
          </div>

          {/* Trust Banner */}
          <div className="pt-4 border-t hl-subtle-divider flex items-center justify-center gap-6 text-[11px] hl-muted-text">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-rose-500" /> Secure SSL
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-rose-500" /> 256-Bit Encryption
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
