import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  FlaskConical,
  Heart,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../services/api";
import { getDashboardForRole } from "../components/ProtectedRoute";
import { firebaseConfigured, getGoogleIdToken } from "../services/firebase";
import { Logo, ThemeToggle } from "../components/ui";

export function LoginPage() {
  const { authenticate, authenticateWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLoginSuccess = (user) => {
    toast.success(`Welcome back, ${user.name || "Member"}!`);
    const targetDashboard = getDashboardForRole(user.role);
    const destination =
      location.state?.from &&
      !location.state.from.includes("/login") &&
      !location.state.from.includes("/admin/login")
        ? location.state.from
        : targetDashboard;

    navigate(destination, { replace: true });
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
        handleLoginSuccess(result.user);
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

  const handleGoogleSignIn = async () => {
    setServerError("");
    setBusy(true);
    try {
      const idToken = await getGoogleIdToken();
      const result = await authenticateWithGoogle(idToken, {});
      if (result?.user) {
        handleLoginSuccess(result.user);
      } else {
        setServerError(result?.message || "Google sign-in could not be completed.");
      }
    } catch (err) {
      setServerError(apiErrorMessage(err, err.message || "Google sign-in failed."));
    } finally {
      setBusy(false);
    }
  };

  const setDemoUser = (email, pwd) => {
    setIdentifier(email);
    setPassword(pwd);
    setErrors({});
    setServerError("");
  };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-[#FFF5F4] dark:bg-[#151219] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      {/* Left Gradient Brand Panel (Desktop 50%) */}
      <aside className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[#E61E50] via-[#A81B5B] to-[#580B44] text-white p-12 lg:p-16 relative overflow-hidden">
        {/* Soft glowing ambient orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-10 right-10 h-80 w-80 rounded-full bg-rose-400/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-black/20 blur-2xl"
        />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-md transition-transform group-hover:scale-105">
              <Heart className="h-5 w-5 fill-[#E61E50] text-[#E61E50]" />
            </span>
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              HeartLink<span className="text-rose-200">.</span>
            </span>
          </Link>
          <Link
            to="/"
            className="text-xs font-medium text-rose-100/80 hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Center Editorial Headline */}
        <div className="relative z-10 my-auto py-12 max-w-lg space-y-5">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            Find someone who gets your vibe.
          </h1>
          <p className="text-rose-100/90 text-base sm:text-lg leading-relaxed font-normal">
            Meaningful connections start with a single spark. Join thousands of members meeting every day.
          </p>
        </div>

        {/* Bottom Copyright */}
        <div className="relative z-10 pt-4 text-xs text-rose-200/70">
          &copy; {new Date().getFullYear()} HeartLink. All rights reserved.
        </div>
      </aside>

      {/* Right Form Panel (50%) */}
      <main className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-10 sm:px-12 md:px-16 lg:px-20 relative">
        {/* Mobile top header bar */}
        <div className="flex items-center justify-between lg:hidden pb-6 mb-4 border-b border-rose-200/40 dark:border-rose-900/30">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link to="/" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
              Home
            </Link>
          </div>
        </div>

        {/* Desktop theme toggle & home link at top-right */}
        <div className="hidden lg:flex items-center justify-end gap-3 absolute top-8 right-10">
          <ThemeToggle compact />
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
            Home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-[420px] space-y-6">
          {/* Welcome Title */}
          <div className="space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Log in to see who liked you and pick up your conversations.
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3 shadow-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#E61E50]" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Continue with Google Button */}
          {firebaseConfigured ? (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="Google authentication is not configured in this environment"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm font-semibold opacity-60 cursor-not-allowed"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            <span className="bg-[#FFF5F4] dark:bg-[#151219] px-3 text-[10px] sm:text-xs font-semibold tracking-wider text-gray-400 uppercase">
              OR LOG IN WITH E-MAIL
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="login-identifier"
                  type="text"
                  name="identifier"
                  autoComplete="username email"
                  required
                  placeholder="you@example.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E61E50] focus:border-transparent transition-all ${
                    errors.identifier
                      ? "border-rose-400 dark:border-rose-600"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                />
              </div>
              {errors.identifier && (
                <p className="text-[11px] text-rose-500 pl-1">{errors.identifier}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-white dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E61E50] focus:border-transparent transition-all ${
                    errors.password
                      ? "border-rose-400 dark:border-rose-600"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 pl-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#E61E50] focus:ring-[#E61E50] h-3.5 w-3.5"
                />
                <span>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-medium text-[#E61E50] hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Pill Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 py-3.5 px-6 rounded-full bg-[#E61E50] hover:bg-[#D01845] active:bg-[#B9143C] text-white text-sm font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Signing in..." : "Log in"}
            </button>
          </form>

          {/* Links */}
          <div className="text-center space-y-2 pt-1 text-xs text-gray-600 dark:text-gray-400">
            <p>
              New to HeartLink?{" "}
              <Link to="/signup" className="font-semibold text-[#E61E50] hover:underline">
                Create an account
              </Link>
            </p>
            <p>
              <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline">
                Admin panel login
              </Link>
            </p>
          </div>

          {/* DEMO MODE Box (Dev & QA Friendly) */}
          <div className="rounded-2xl border border-amber-200/80 bg-[#FEF6EC] dark:bg-amber-950/25 dark:border-amber-800/40 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[10px]">
              <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
              <span>DEMO MODE (DEVELOPMENT ONLY)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDemoUser("suyogsankpal36@gmail.com", "Admin@123")}
                className="py-2 px-3 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900 text-gray-800 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-gray-700 font-medium transition-colors cursor-pointer text-center truncate"
              >
                Demo: Aarav
              </button>
              <button
                type="button"
                onClick={() => setDemoUser("priya@heartlink.app", "Priya@123")}
                className="py-2 px-3 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900 text-gray-800 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-gray-700 font-medium transition-colors cursor-pointer text-center truncate"
              >
                Demo: Meera
              </button>
            </div>
          </div>

          {/* Trust Footnote */}
          <div className="pt-2 flex items-center justify-center gap-6 text-[11px] text-gray-400">
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
