import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Heart,
  HelpCircle,
  Lock,
  Mail,
  MessageSquare,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, apiErrorMessage } from "../services/api";
import { firebaseConfigured, getGoogleIdToken } from "../services/firebase";
import { PublicPage } from "../components/Layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FadeInView,
  Field,
  Logo,
  PageHeader,
  PageTransition,
  SearchBar,
  Select,
  TextArea,
} from "../components/ui";

const FAQ_ITEMS = [
  [
    "How does compatibility scoring work on HeartLink?",
    "HeartLink calculates compatibility using shared interests, dating goals (long-term relationship, casual dating, or friendship), and lifestyle preferences you choose on your profile.",
  ],
  [
    "How is my privacy and location protected?",
    "Your email address and exact birthdate are never displayed publicly. Your location is strictly approximate, and you have complete control to pause discovery, toggle online status, or block anyone anytime.",
  ],
  [
    "Who can see my messages and chat with me?",
    "Conversations unlock exclusively when both people like each other. That means no unsolicited spam or uninvited messages—just genuine conversations between mutual matches.",
  ],
  [
    "How does HeartLink keep the community safe?",
    "Every member can easily block or report any profile or message. Our dedicated moderation team reviews safety reports promptly to keep HeartLink respectful, authentic, and safe.",
  ],
  [
    "How many photos can I add to my profile?",
    "You can upload up to 6 high-quality gallery photos to showcase your genuine smile, passions, and everyday moments with automatic privacy and safety checks.",
  ],
  [
    "Can I switch themes or delete my account?",
    "Yes! You can switch between Light and Dark mode anytime. If you ever find your special someone or need a break, you can easily pause or permanently delete your account in Settings.",
  ],
];

function calculateAgeFromIso(dob) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob || "");
  if (!match) return 0;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText) - 1;
  const day = Number(dayText);
  const now = new Date();
  let age = now.getFullYear() - year;
  const beforeBirthday =
    now.getMonth() < month || (now.getMonth() === month && now.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

export function LandingPage() {
  const { user } = useAuth();

  return (
    <PublicPage>
      <PageTransition>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b hl-subtle-divider">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[780px] rounded-full bg-rose-500/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6 space-y-6">
                <Badge tone="primary" dot>
                  Where Chemistry Begins
                </Badge>
                <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-base-content leading-[1.12]">
                  Find the one who matches{" "}
                  <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
                    your heart.
                  </span>
                </h1>
                <p className="text-base sm:text-lg hl-muted-text max-w-xl leading-relaxed">
                  HeartLink is the intentional dating app for singles looking for genuine connections. Meet verified people who share your values, passions, and dating goals—free from mindless swipe fatigue.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {user ? (
                    <Link to="/dashboard">
                      <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                        Explore Matches
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/signup">
                        <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                          Find Your Match
                        </Button>
                      </Link>
                      <Link to="/login">
                        <Button variant="outline" size="lg">
                          Log In
                        </Button>
                      </Link>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t hl-subtle-divider">
                  <div className="flex items-center gap-2.5 text-xs hl-muted-text">
                    <ShieldCheck className="h-4 w-4 text-rose-500 shrink-0" strokeWidth={1.75} />
                    <span>Adults 18+ Verified</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs hl-muted-text">
                    <Heart className="h-4 w-4 text-rose-500 shrink-0" strokeWidth={1.75} />
                    <span>Mutual Match Chat Only</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs hl-muted-text">
                    <MessageSquare className="h-4 w-4 text-rose-500 shrink-0" strokeWidth={1.75} />
                    <span>Real-Time Chemistry</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <Card variant="elevated" noPadding className="relative overflow-hidden shadow-2xl border-rose-500/20">
                  <div className="border-b hl-subtle-divider bg-base-200/70 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-pink-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="ml-2 text-xs font-medium hl-muted-text">
                        HeartLink Match Discovery
                      </span>
                    </div>
                    <Badge tone="primary" dot>Online Now</Badge>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5 bg-base-100">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-base-300">
                      <img
                        src="/heartlink-couple.jpg"
                        alt="HeartLink couple in authentic connection"
                        fetchPriority="high"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 flex items-end justify-between text-white">
                        <div>
                          <p className="text-xs font-medium text-rose-300">96% Mutual Chemistry</p>
                          <p className="text-sm font-semibold">Shared love for travel, cozy coffee &amp; live music</p>
                        </div>
                        <span className="rounded-full bg-rose-500/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          Mutual Match
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border hl-subtle-divider bg-base-200/60 p-3 text-center sm:text-left">
                        <Compass className="h-4 w-4 text-rose-500 mb-1.5 mx-auto sm:mx-0" strokeWidth={1.75} />
                        <p className="text-xs font-semibold text-base-content">Curated Feed</p>
                        <p className="text-[11px] hl-muted-text mt-0.5">Location &amp; intent</p>
                      </div>
                      <div className="rounded-xl border hl-subtle-divider bg-base-200/60 p-3 text-center sm:text-left">
                        <MessageSquare className="h-4 w-4 text-rose-500 mb-1.5 mx-auto sm:mx-0" strokeWidth={1.75} />
                        <p className="text-xs font-semibold text-base-content">Instant Sparks</p>
                        <p className="text-[11px] hl-muted-text mt-0.5">Typing &amp; reactions</p>
                      </div>
                      <div className="rounded-xl border hl-subtle-divider bg-base-200/60 p-3 text-center sm:text-left">
                        <Shield className="h-4 w-4 text-rose-500 mb-1.5 mx-auto sm:mx-0" strokeWidth={1.75} />
                        <p className="text-xs font-semibold text-base-content">Safe Dating</p>
                        <p className="text-[11px] hl-muted-text mt-0.5">Verified &amp; protected</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-2">
              How HeartLink Works
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-base-content">
              From first spark to real dates—simple, respectful &amp; exciting.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: UserCheck,
                title: "Curate Your Authentic Story",
                body: "Upload up to 6 of your favorite photos, answer fun conversation prompts, and let singles know what you're truly looking for.",
              },
              {
                step: "02",
                icon: Sparkles,
                title: "Discover Real Chemistry",
                body: "Explore curated profiles aligned with your age, interests, and distance preferences with smooth pass, like, and superlike controls.",
              },
              {
                step: "03",
                icon: Heart,
                title: "Mutual Sparks & Private Chat",
                body: "When both of you like each other, it's a match! Start real-time private conversations with no unsolicited cold DMs.",
              },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <Card key={item.step} variant="interactive" className="h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      <IconComp className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="text-xs font-mono font-semibold text-rose-400">{item.step}</span>
                  </div>
                  <h3 className="text-base font-semibold text-base-content mb-2">{item.title}</h3>
                  <p className="text-sm hl-muted-text leading-relaxed">{item.body}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Safety & Peace of Mind */}
        <section className="border-y hl-subtle-divider bg-base-100/60">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
                  Dating Safety
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-base-content">
                  Your safety and privacy are our highest priority.
                </h2>
                <p className="text-sm hl-muted-text leading-relaxed">
                  HeartLink gives you complete control over who sees your profile, keeps your contact info strictly private, and offers 24/7 moderation support.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <Link to="/about">
                    <Button variant="outline" size="sm">Our Dating Standards</Button>
                  </Link>
                  <Link to="/help">
                    <Button variant="ghost" size="sm" leftIcon={<Shield className="h-4 w-4" />}>
                      Safety Tips &amp; Support
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Adults 18+ Only Community",
                    desc: "Every profile requires age verification at signup to ensure a mature, respectful dating atmosphere.",
                  },
                  {
                    icon: Lock,
                    title: "Total Privacy Protection",
                    desc: "Your email, birthdate, and exact GPS coordinates are kept private. Only approximate distance is shown.",
                  },
                  {
                    icon: Users,
                    title: "Mutual Consent Conversations",
                    desc: "No unwanted messages or intrusive requests. Chats only open when both individuals mutually swipe right.",
                  },
                  {
                    icon: HelpCircle,
                    title: "Instant Block & Report",
                    desc: "Feel safe with one-click blocking and direct reporting. Our human safety team investigates every report.",
                  },
                ].map((feature) => {
                  const IconComp = feature.icon;
                  return (
                    <Card key={feature.title} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mt-0.5">
                          <IconComp className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-base-content">{feature.title}</h3>
                          <p className="text-xs hl-muted-text mt-1 leading-relaxed">{feature.desc}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card variant="elevated" className="bg-gradient-to-br from-rose-500/10 via-base-100 to-pink-500/10 border-rose-500/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4 px-2">
              <div className="space-y-1.5 max-w-xl">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-base-content">
                  Ready to find your special person?
                </h2>
                <p className="text-sm hl-muted-text">
                  Join HeartLink for free today. Create your profile in under two minutes and meet someone wonderful.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link to={user ? "/dashboard" : "/signup"}>
                  <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    {user ? "Explore Matches" : "Find Your Match Free"}
                  </Button>
                </Link>
                <Link to="/faq">
                  <Button variant="outline" size="lg">How It Works</Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      </PageTransition>
    </PublicPage>
  );
}

export function AuthPage({ mode = "login" }) {
  const signup = mode === "signup";
  const { user, authenticate, authenticateWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from || "/dashboard";

  const [form, setForm] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  if (user) {
    return <Navigate to={destination} replace />;
  }

  const maxBirthDateValue = new Date();
  maxBirthDateValue.setFullYear(maxBirthDateValue.getFullYear() - 18);
  const maxBirthDate = `${maxBirthDateValue.getFullYear()}-${String(
    maxBirthDateValue.getMonth() + 1,
  ).padStart(2, "0")}-${String(maxBirthDateValue.getDate()).padStart(2, "0")}`;

  const update = (event) => {
    const { name, type, value, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const validate = (includeGoogle = false) => {
    const next = {};
    if (signup || includeGoogle) {
      const name = form.name.trim();
      if (name.length < 2 || name.length > 60) next.name = "Enter your full name (2–60 characters).";
      const age = calculateAgeFromIso(form.dateOfBirth);
      if (!form.dateOfBirth || age < 18 || age > 120) next.dateOfBirth = "You must be 18 or older to join.";
      if (!["male", "female", "non-binary", "other"].includes(form.gender)) next.gender = "Select your gender option.";
      if (!form.termsAccepted) next.termsAccepted = "Please accept the Terms and Privacy Policy.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.email.length > 100) {
      next.email = "Enter a valid email address.";
    }
    if (signup || includeGoogle) {
      if (!includeGoogle && (form.password.length < 8 || form.password.length > 72)) {
        next.password = "Password must be 8–72 characters.";
      }
      if (signup && form.password !== form.confirmPassword) {
        next.confirmPassword = "Passwords do not match.";
      }
    } else if (!form.password) {
      next.password = "Enter your password.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setServerError("");
    setSuccess("");
    if (!validate()) return;
    setBusy(true);
    try {
      const payload = signup
        ? {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            dateOfBirth: form.dateOfBirth,
            gender: form.gender,
            termsAccepted: true,
          }
        : { email: form.email.trim(), password: form.password };
      const result = await authenticate(mode, payload);
      if (result.user) {
        toast.success(signup ? "Welcome to HeartLink" : "Signed in successfully");
        navigate(destination, { replace: true });
      } else {
        setSuccess(result.message || "Check your email inbox to verify your account.");
      }
    } catch (error) {
      setServerError(apiErrorMessage(error, signup ? "Could not create your account." : "Could not sign in."));
    } finally {
      setBusy(false);
    }
  };

  const googleSubmit = async () => {
    setServerError("");
    setSuccess("");
    if (signup && !validate(true)) return;
    setBusy(true);
    try {
      const idToken = await getGoogleIdToken();
      const result = await authenticateWithGoogle(
        idToken,
        signup
          ? {
              name: form.name.trim(),
              dateOfBirth: form.dateOfBirth,
              gender: form.gender,
              termsAccepted: true,
            }
          : {},
      );
      if (result.user) {
        toast.success("Signed in with Google");
        navigate(destination, { replace: true });
      } else {
        setSuccess(result.message || "Your account is ready for the next step.");
      }
    } catch (error) {
      setServerError(apiErrorMessage(error, error.message || "Google sign-in could not be completed."));
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    if (!form.email.trim()) return;
    setResending(true);
    try {
      const { data } = await api.post("/auth/resend-verification", { email: form.email.trim() });
      toast.success(data.message || "Verification email sent.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not resend verification email."));
    } finally {
      setResending(false);
    }
  };

  const showResendAction = !signup && /verify|verification/i.test(serverError);

  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-12 bg-base-200 text-base-content">
      {/* Left Luxury Brand Panel */}
      <aside className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-[#140c13] text-slate-100 p-10 border-r border-rose-500/10 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rose-500/20 blur-3xl"
        />
        <div className="relative z-10 flex items-center justify-between">
          <Logo light />
          <Link to="/" className="text-xs text-rose-300 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>

        <div className="relative z-10 space-y-6 my-auto py-8">
          <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl border border-rose-500/20 shadow-2xl">
            <img
              src="/heartlink-couple.jpg"
              alt="HeartLink curated connection artwork"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-300">
              Authentic Connections
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white leading-snug">
              Real connections with people who truly match your energy.
            </h2>
            <p className="text-sm text-rose-200/70 leading-relaxed">
              Curate your authentic dating profile, discover mutual sparks, and enjoy real-time conversations without unsolicited noise.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-rose-100">
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Adults 18+ verified</span>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Mutual match chat only</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          Your password and email are never exposed publicly.
        </p>
      </aside>

      {/* Right Auth Form Panel */}
      <main className="lg:col-span-7 flex flex-col justify-center px-4 py-8 sm:px-8 lg:px-14">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="flex items-center justify-between lg:hidden pb-2 border-b hl-subtle-divider">
            <Logo />
            <Link to="/" className="text-xs hl-muted-text hover:text-base-content">
              Home
            </Link>
          </div>

          <FadeInView className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest hl-accent-text">
              {signup ? "Create Account" : "Member Sign In"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-base-content">
              {signup ? "Join HeartLink" : "Welcome back"}
            </h1>
            <p className="text-sm hl-muted-text">
              {signup
                ? "Set up your private member credentials in under a minute."
                : "Sign in to access your dashboard, matches, and messages."}
            </p>
          </FadeInView>

          {serverError && (
            <div role="alert" className="rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs text-error space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
              {showResendAction && (
                <Button size="xs" variant="outline" loading={resending} onClick={handleResendVerification}>
                  Resend verification email
                </Button>
              )}
            </div>
          )}

          {success && (
            <div role="status" className="rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs text-success flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <Card>
            <form onSubmit={submit} noValidate className="space-y-4">
              {signup && (
                <Field
                  id="signup-name"
                  name="name"
                  label="Full name"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  maxLength={60}
                  required
                  value={form.name}
                  onChange={update}
                  error={errors.name}
                />
              )}

              <Field
                id="auth-email"
                name="email"
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={100}
                required
                value={form.email}
                onChange={update}
                error={errors.email}
              />

              {signup && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    id="signup-dob"
                    name="dateOfBirth"
                    label="Date of birth"
                    type="date"
                    autoComplete="bday"
                    max={maxBirthDate}
                    hint={!errors.dateOfBirth ? "Minimum age: 18 years" : ""}
                    required
                    value={form.dateOfBirth}
                    onChange={update}
                    error={errors.dateOfBirth}
                  />
                  <Select
                    id="signup-gender"
                    name="gender"
                    label="Gender"
                    required
                    value={form.gender}
                    onChange={update}
                    error={errors.gender}
                    options={[
                      { value: "", label: "Select gender" },
                      { value: "female", label: "Woman" },
                      { value: "male", label: "Man" },
                      { value: "non-binary", label: "Non-binary" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-base-content/90">Password</span>
                  {!signup && (
                    <Link to="/forgot-password" className="text-xs font-medium hl-accent-text hover:underline">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <Field
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete={signup ? "new-password" : "current-password"}
                  placeholder={signup ? "Minimum 8 characters" : "Enter your password"}
                  maxLength={72}
                  required
                  value={form.password}
                  onChange={update}
                  error={errors.password}
                  hint={
                    signup && !errors.password
                      ? form.password.length >= 12
                        ? "Strong password length"
                        : "Use 8 to 72 characters"
                      : ""
                  }
                />
              </div>

              {signup && (
                <Field
                  id="signup-confirm"
                  name="confirmPassword"
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  maxLength={72}
                  required
                  value={form.confirmPassword}
                  onChange={update}
                  error={errors.confirmPassword}
                />
              )}

              {signup && (
                <div className="space-y-1 pt-1">
                  <label htmlFor="terms-accepted" className="flex items-start gap-2.5 text-xs hl-muted-text cursor-pointer">
                    <input
                      id="terms-accepted"
                      type="checkbox"
                      name="termsAccepted"
                      checked={form.termsAccepted}
                      onChange={update}
                      className="checkbox checkbox-primary checkbox-sm mt-0.5 rounded"
                    />
                    <span>
                      I confirm I am 18+ and accept the{" "}
                      <Link to="/terms" className="hl-accent-text underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="hl-accent-text underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p role="alert" className="text-xs text-error">
                      {errors.termsAccepted}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={busy}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {signup ? "Create account" : "Sign in"}
              </Button>
            </form>

            {firebaseConfigured && (
              <>
                <div className="divider text-[11px] uppercase hl-muted-text my-4">or</div>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  disabled={busy}
                  onClick={googleSubmit}
                >
                  <span className="font-bold text-indigo-500">G</span>
                  <span>{signup ? "Continue with Google" : "Sign in with Google"}</span>
                </Button>
              </>
            )}
          </Card>

          <div className="text-center text-xs hl-muted-text px-1">
            <p>
              {signup ? "Already have an account?" : "New to HeartLink?"}{" "}
              <Link to={signup ? "/login" : "/signup"} className="font-semibold hl-accent-text hover:underline">
                {signup ? "Sign in" : "Create account"}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export function AboutPage() {
  return (
    <PublicPage>
      <PageTransition>
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5">
              <Card noPadding variant="elevated">
                <img
                  src="/heartlink-couple.jpg"
                  alt="HeartLink connection illustration"
                  className="aspect-[4/3] w-full object-cover"
                />
              </Card>
            </div>
            <div className="md:col-span-7 space-y-4">
              <Badge tone="primary">About HeartLink</Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-base-content">
                Connection built on respect, transparency, and intention.
              </h1>
              <p className="text-sm sm:text-base hl-muted-text leading-relaxed">
                HeartLink is engineered for adults seeking thoughtful conversations without algorithmic noise. Every member controls their visibility, discovery radius, notification preferences, and safety boundaries.
              </p>
              <div className="pt-2">
                <Link to="/signup">
                  <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Join HeartLink</Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                index: "01",
                title: "People Before Metrics",
                desc: "Profiles prioritize real prompts, lifestyle alignment, and shared interests.",
              },
              {
                index: "02",
                title: "Safety Always Accessible",
                desc: "One-click reporting and blocking are paired with human moderator queues.",
              },
              {
                index: "03",
                title: "Controlled Privacy",
                desc: "Toggle online presence, read receipts, or profile visibility at any moment.",
              },
            ].map((item) => (
              <Card key={item.index}>
                <span className="text-xs font-mono font-semibold hl-accent-text">{item.index}</span>
                <h2 className="text-base font-semibold text-base-content mt-2">{item.title}</h2>
                <p className="text-xs hl-muted-text mt-1.5 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </PageTransition>
    </PublicPage>
  );
}

export function FAQPage() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(([qText, aText]) => `${qText} ${aText}`.toLowerCase().includes(q));
  }, [search]);

  return (
    <PublicPage>
      <PageTransition>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
          <PageHeader
            eyebrow="Knowledge Base"
            title="Frequently Asked Questions"
            subtitle="Straightforward answers on matching, privacy, moderation, and account controls."
          />

          <SearchBar
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpenIndex(0);
            }}
            onClear={() => setSearch("")}
            placeholder="Filter topics (privacy, messages, photos, safety)..."
            label="Filter FAQ items"
          />

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                title="No matching questions"
                description="Try another search keyword or reach out directly to our support team."
                action={
                  <Link to="/help">
                    <Button size="sm" variant="outline">Contact Support</Button>
                  </Link>
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(([question, answer], idx) => {
                const isOpen = openIndex === idx;
                return (
                  <Card key={question} noPadding className="overflow-hidden">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-base-200/60 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-semibold text-base-content">{question}</span>
                      <span className="text-base font-mono hl-muted-text shrink-0">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-sm hl-muted-text border-t hl-subtle-divider leading-relaxed">
                        {answer}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageTransition>
    </PublicPage>
  );
}

export function LegalPage({ type = "terms" }) {
  const privacy = type === "privacy";

  return (
    <PublicPage>
      <PageTransition>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
          <PageHeader
            eyebrow="Governance & Compliance"
            title={privacy ? "Privacy Policy" : "Terms of Service"}
            subtitle={
              privacy
                ? "How HeartLink handles member credentials, profile details, and real-time sessions."
                : "Community expectations and account safety responsibilities on HeartLink."
            }
          />
          <Card className="space-y-5 text-sm hl-muted-text leading-relaxed">
            {privacy ? (
              <>
                <section className="space-y-1.5">
                  <h2 className="text-base font-semibold text-base-content">Public Profile Scope</h2>
                  <p>
                    Profiles display only chosen attributes (name, computed age, city, bio, interests, prompts, and photos). Your email address and exact birth date are never shared publicly.
                  </p>
                </section>
                <section className="space-y-1.5">
                  <h2 className="text-base font-semibold text-base-content">Security &amp; Storage</h2>
                  <p>
                    Data is stored in MongoDB Atlas with GridFS media isolation. Authentication uses short-lived JWTs and HTTP-only refresh sessions with activity auditing.
                  </p>
                </section>
                <section className="space-y-1.5">
                  <h2 className="text-base font-semibold text-base-content">Member Controls</h2>
                  <p>
                    You may toggle visibility, manage blocked accounts, pause online presence, or permanently erase your account from Settings.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-1.5">
                  <h2 className="text-base font-semibold text-base-content">Adults 18+ Policy</h2>
                  <p>
                    HeartLink is strictly for adults aged 18 and older. Accurate birth dates and authentic identity details are required.
                  </p>
                </section>
                <section className="space-y-1.5">
                  <h2 className="text-base font-semibold text-base-content">Respect &amp; Safety</h2>
                  <p>
                    Harassment, impersonation, spam, or non-consensual content is prohibited and subject to suspension by our moderation team.
                  </p>
                </section>
                <section className="space-y-1.5">
                  <h2 className="text-base font-semibold text-base-content">Account Stewardship</h2>
                  <p>
                    Keep your password confidential and never share authentication links or financial requests with other members.
                  </p>
                </section>
              </>
            )}
          </Card>
        </div>
      </PageTransition>
    </PublicPage>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ busy: false, message: "", error: "" });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, message: "", error: "" });
    try {
      const { data } = await api.post("/auth/forgot-password", { email: email.trim() });
      setState({
        busy: false,
        message: data.message || "If an account exists for that email, recovery instructions have been sent.",
        error: "",
      });
    } catch (err) {
      setState({ busy: false, message: "", error: apiErrorMessage(err, "Unable to process password recovery.") });
    }
  };

  return (
    <PublicPage>
      <PageTransition>
        <div className="mx-auto max-w-md px-4 py-16">
          <Card className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest hl-accent-text">Recovery</p>
              <h1 className="text-xl font-semibold text-base-content">Reset your password</h1>
              <p className="text-xs hl-muted-text">
                Enter your email address and we will send a secure password reset link if your account is active.
              </p>
            </div>
            {state.error && (
              <div role="alert" className="rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
                {state.error}
              </div>
            )}
            {state.message && (
              <div role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success">
                {state.message}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <Field
                id="recovery-email"
                label="Email address"
                type="email"
                autoComplete="email"
                required
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Button type="submit" fullWidth loading={state.busy}>
                Send Reset Link
              </Button>
            </form>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs hl-muted-text hover:text-base-content">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </Card>
        </div>
      </PageTransition>
    </PublicPage>
  );
}

export function ResetPasswordPage() {
  const { token = "" } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState({ busy: false, message: "", error: "" });

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setState({ busy: false, message: "", error: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setState({ busy: false, message: "", error: "Passwords do not match." });
      return;
    }
    setState({ busy: true, message: "", error: "" });
    try {
      const { data } = await api.post("/auth/reset-password", { token, newPassword: password });
      setState({
        busy: false,
        message: data.message || "Your password has been updated. You may now sign in.",
        error: "",
      });
    } catch (err) {
      setState({ busy: false, message: "", error: apiErrorMessage(err, "This reset link is invalid or expired.") });
    }
  };

  return (
    <PublicPage>
      <PageTransition>
        <div className="mx-auto max-w-md px-4 py-16">
          <Card className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest hl-accent-text">Recovery</p>
              <h1 className="text-xl font-semibold text-base-content">Set new password</h1>
              <p className="text-xs hl-muted-text">Choose a strong password between 8 and 72 characters.</p>
            </div>
            {state.error && (
              <div role="alert" className="rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
                {state.error}
              </div>
            )}
            {state.message && (
              <div role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success">
                {state.message}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <Field
                id="new-password"
                label="New password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Field
                id="confirm-password"
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <Button type="submit" fullWidth loading={state.busy}>
                Save New Password
              </Button>
            </form>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs hl-muted-text hover:text-base-content">
              <ArrowLeft className="h-3.5 w-3.5" />
              Go to Sign In
            </Link>
          </Card>
        </div>
      </PageTransition>
    </PublicPage>
  );
}

export function VerifyEmailPage() {
  const { token = "" } = useParams();
  const submitted = useRef("");
  const [state, setState] = useState({ busy: true, message: "Verifying your email link...", error: "" });

  useEffect(() => {
    if (!token || submitted.current === token) return;
    submitted.current = token;
    api
      .post("/auth/verify-email", { token })
      .then(({ data }) => {
        setState({ busy: false, message: data.message || "Email verification successful.", error: "" });
      })
      .catch((err) => {
        setState({
          busy: false,
          message: "",
          error: apiErrorMessage(err, "This verification token is invalid or has expired."),
        });
      });
  }, [token]);

  return (
    <PublicPage>
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-base-300 bg-base-200">
            {state.busy ? (
              <Clock className="h-6 w-6 text-primary animate-pulse" />
            ) : state.error ? (
              <AlertCircle className="h-6 w-6 text-error" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-success" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-base-content">
            {state.busy ? "Verifying Account" : state.error ? "Verification Unavailable" : "Email Verified"}
          </h1>
          <p className={`text-sm ${state.error ? "text-error" : "hl-muted-text"}`}>
            {state.error || state.message}
          </p>
          <Link to="/login" className="block pt-2">
            <Button fullWidth>Continue to Sign In</Button>
          </Link>
        </Card>
      </div>
    </PublicPage>
  );
}

export function HelpPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    email: user?.email || "",
    category: "account",
    subject: "",
    message: "",
  });
  const [state, setState] = useState({ busy: false, success: "", error: "" });

  const update = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, success: "", error: "" });
    try {
      const { data } = await api.post("/support", { ...form, email: user?.email || form.email });
      setState({
        busy: false,
        success: data.message || "Support ticket received by our safety team.",
        error: "",
      });
      setForm((prev) => ({ ...prev, subject: "", message: "" }));
      toast.success("Support ticket submitted");
    } catch (err) {
      setState({ busy: false, success: "", error: apiErrorMessage(err, "Unable to send support ticket.") });
    }
  };

  const inner = (
    <div className={user ? "space-y-6" : "mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-6"}>
      <PageHeader
        eyebrow="Support Desk"
        title="Help & Safety Center"
        subtitle="Submit an inquiry directly to our moderation and support operations team."
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <div className="space-y-3 text-xs hl-muted-text">
              <div className="flex items-center gap-2 text-sm font-semibold text-base-content">
                <ShieldCheck className="h-4 w-4 hl-accent-text" />
                Direct Team Review
              </div>
              <p className="leading-relaxed">
                Every ticket is logged in our Trust &amp; Ops queue and reviewed by staff. Never include your password in support notes.
              </p>
              <div className="pt-2 border-t hl-subtle-divider space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 hl-accent-text" />
                  <span>Safety concerns prioritized</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 hl-accent-text" />
                  <span>Replies sent to your account email</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-8">
          <Card>
            <form onSubmit={submit} className="space-y-4">
              {state.error && (
                <div role="alert" className="rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
                  {state.error}
                </div>
              )}
              {state.success && (
                <div role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success">
                  {state.success}
                </div>
              )}
              {!user && (
                <Field
                  id="support-email"
                  name="email"
                  label="Contact email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update}
                  placeholder="you@example.com"
                />
              )}
              <Select
                id="support-category"
                name="category"
                label="Category"
                value={form.category}
                onChange={update}
                options={[
                  { value: "account", label: "Account & Sign In" },
                  { value: "profile", label: "Profile & Photos" },
                  { value: "matching", label: "Discovery & Matches" },
                  { value: "billing", label: "Membership & Billing" },
                  { value: "safety", label: "Safety & Harassment" },
                  { value: "other", label: "Other Inquiry" },
                ]}
              />
              <Field
                id="support-subject"
                name="subject"
                label="Subject"
                required
                maxLength={120}
                value={form.subject}
                onChange={update}
                placeholder="Brief summary of the issue"
              />
              <TextArea
                id="support-message"
                name="message"
                label="Details"
                required
                minLength={10}
                maxLength={3000}
                rows={5}
                value={form.message}
                onChange={update}
                placeholder="Describe what happened so our team can assist promptly..."
              />
              <Button type="submit" loading={state.busy} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Submit Support Ticket
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );

  return user ? <PageTransition>{inner}</PageTransition> : <PublicPage>{inner}</PublicPage>;
}

export function NotFoundPage() {
  return (
    <PublicPage>
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Card className="space-y-4">
          <Badge tone="neutral">404 Not Found</Badge>
          <h1 className="text-2xl font-semibold text-base-content">Page not found</h1>
          <p className="text-sm hl-muted-text">
            The route you requested does not exist or has been relocated.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <Link to="/">
              <Button size="sm">Return Home</Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm" variant="outline">Workspace</Button>
            </Link>
          </div>
        </Card>
      </div>
    </PublicPage>
  );
}
