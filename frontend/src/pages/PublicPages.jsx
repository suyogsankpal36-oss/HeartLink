import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { api, apiErrorMessage } from "../services/api.js";
import { firebaseConfigured, getGoogleIdToken } from "../services/firebase.js";
import { Button, EmptyState, Field, Icon, Logo, PageHeading } from "../components/ui.jsx";
import { PublicPage } from "../components/Layout.jsx";

function ageOn(dateValue) {
  if (!dateValue) return 0;
  const birth = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

const faqItems = [
  ["Who can join HeartLink?", "HeartLink is for adults aged 18 and over. We ask for a date of birth to confirm eligibility; the exact date is not shown on your public profile."],
  ["How does matching work?", "You can like a profile or pass. A conversation becomes available after both people have liked each other."],
  ["Are my photos public?", "Photos you add are shown on your profile to other eligible members. You can update or remove them from Edit profile."],
  ["How do I keep my account safe?", "You can block or report a member from their profile. Never share financial details or private verification codes with another person."],
  ["Can I delete my account?", "Yes. Open Settings, choose Delete account, and confirm. The request removes your account and associated app records."],
  ["Is Premium checkout available?", "Plans and prices are displayed from the server, but checkout is not enabled in this version. No payment will be taken."],
  ["How do I contact support?", "Use the Support page to send a request. Please include enough detail for the team to understand the issue, and avoid sharing passwords."],
];

export function LandingPage() {
  return (
    <PublicPage className="landing-page">
      <main>
        <section className="hero-wrap">
          <div className="hero-copy">
            <span className="hero-kicker"><Icon name="heart" size={14} /> For connections that feel like you</span>
            <h1>Make room for <em>something real.</em></h1>
            <p>Meet people with shared interests, take things at your own pace, and let a mutual spark become a good conversation.</p>
            <div className="hero-actions"><Button to="/signup">Create your profile <Icon name="arrowRight" size={17} /></Button><Button to="/#features" variant="soft">Explore HeartLink</Button></div>
            <div className="hero-trust"><span><Icon name="shield" size={15} /> Adults only</span><span><Icon name="heart" size={15} /> Mutual matches</span><span><Icon name="lock" size={15} /> Private by design</span></div>
          </div>
          <div className="hero-visual" aria-label="HeartLink's illustrated couple sharing a heart">
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            <span className="hero-spark spark-one">♡</span><span className="hero-spark spark-two">✦</span><span className="hero-spark spark-three">♡</span>
            <div className="hero-art-card"><div className="art-card-top"><span className="online-dot" /> A little connection goes a long way</div><img src="/heartlink-couple.jpg" alt="Two illustrated people sharing a heart" fetchPriority="high" /><span className="art-card-caption"><Icon name="heart" size={17} /> Shared interests. Mutual curiosity.</span></div>
            <div className="hero-note"><span className="note-icon"><Icon name="heart" size={18} /></span><span><strong>A mutual spark</strong><small>Starts with a hello.</small></span></div>
          </div>
        </section>

        <section className="promise-strip" aria-label="How HeartLink works"><div><strong>18+</strong><span>Adults only</span></div><i /><div><strong>Mutual</strong><span>Like-based matching</span></div><i /><div><strong>6 photos</strong><span>Room to be yourself</span></div></section>

        <section id="features" className="public-section feature-section">
          <div className="section-heading"><span className="eyebrow">A more thoughtful way to meet</span><h2>Good connections begin with <em>good intentions.</em></h2><p>Built to make discovering people feel welcoming, clear, and comfortable.</p></div>
          <div className="feature-grid">
            <article className="feature-card"><span className="feature-number">01</span><span className="feature-icon"><Icon name="compass" size={21} /></span><h3>Discover with context</h3><p>See real profiles, shared interests, and the details people choose to share.</p></article>
            <article className="feature-card"><span className="feature-number">02</span><span className="feature-icon"><Icon name="heart" size={21} /></span><h3>Let the feeling be mutual</h3><p>Chat opens after you both show interest, so the first hello has a little more meaning.</p></article>
            <article className="feature-card"><span className="feature-number">03</span><span className="feature-icon"><Icon name="shield" size={21} /></span><h3>Move at your pace</h3><p>Choose what to share, tune your privacy settings, and use block or report when needed.</p></article>
          </div>
        </section>

        <section id="how-it-works" className="public-section journey-section">
          <div className="journey-art"><div className="journey-ring" /><img src="/heartlink-couple.jpg" alt="HeartLink couple illustration" loading="lazy" /><span className="journey-caption">Small moments. Real possibilities.</span></div>
          <div className="journey-copy"><span className="eyebrow">THE HEARTLINK WAY</span><h2>Less pressure.<br /><em>More possibility.</em></h2><p>There is no perfect opening line. Start by noticing what you have in common and follow the conversation where it naturally goes.</p><ol><li><b>1</b><span><strong>Find a little in common</strong><small>Discover profiles shaped by interests and intent.</small></span></li><li><b>2</b><span><strong>Choose a mutual spark</strong><small>A match happens when interest goes both ways.</small></span></li><li><b>3</b><span><strong>Start with a hello</strong><small>Build a conversation at a pace that feels right.</small></span></li></ol><Button to="/signup" variant="soft">Start exploring <Icon name="arrowRight" size={16} /></Button></div>
        </section>

        <section className="closing-cta"><span className="cta-halo" /><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>Show up as yourself.<br /><em>See who you meet.</em></h2><p>One profile, one thoughtful hello, and a little room for something unexpected.</p><Button to="/signup">Create a free profile <Icon name="arrowRight" size={17} /></Button></section>
      </main>
    </PublicPage>
  );
}

export function AuthPage({ mode = "signup" }) {
  const signup = mode === "signup";
  const { authenticate, authenticateWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", dateOfBirth: "", gender: "", termsAccepted: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const destination = typeof location.state?.from === "string" && location.state.from.startsWith("/") && !location.state.from.startsWith("//") ? location.state.from : "/discover";

  function update(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate(includeGoogle = false) {
    const next = {};
    if (signup || includeGoogle) {
      const name = form.name.trim();
      if (name.length < 2 || name.length > 60) next.name = "Enter your name (2–60 characters).";
      if (!form.dateOfBirth || ageOn(form.dateOfBirth) < 18 || ageOn(form.dateOfBirth) > 120) next.dateOfBirth = "You must be 18 or older to join.";
      if (!["male", "female", "non-binary", "other"].includes(form.gender)) next.gender = "Choose an option to continue.";
      if (!form.termsAccepted) next.termsAccepted = "Please agree to the terms to create an account.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.email.length > 100) next.email = "Enter a valid email address.";
    if (signup || includeGoogle) {
      if (!includeGoogle && (form.password.length < 8 || form.password.length > 72)) next.password = "Use 8–72 characters.";
      if (signup && form.password !== form.confirmPassword) next.confirmPassword = "Your passwords do not match.";
    } else if (!form.password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    setServerError("");
    setSuccess("");
    if (!validate()) return;
    setBusy(true);
    try {
      const payload = signup
        ? { name: form.name.trim(), email: form.email.trim(), password: form.password, dateOfBirth: form.dateOfBirth, gender: form.gender, termsAccepted: true }
        : { email: form.email.trim(), password: form.password };
      const result = await authenticate(mode, payload);
      if (result.user) navigate(destination, { replace: true });
      else setSuccess(result.message || "Check your inbox for the next step.");
    } catch (error) {
      setServerError(apiErrorMessage(error, signup ? "We could not create the account." : "We could not sign you in."));
    } finally {
      setBusy(false);
    }
  }

  async function googleSubmit() {
    setServerError("");
    setSuccess("");
    if (signup && !validate(true)) return;
    setBusy(true);
    try {
      const idToken = await getGoogleIdToken();
      const result = await authenticateWithGoogle(idToken, signup ? { name: form.name.trim(), dateOfBirth: form.dateOfBirth, gender: form.gender, termsAccepted: true } : {});
      if (result.user) navigate(destination, { replace: true });
      else setSuccess(result.message || "Your account is ready for the next step.");
    } catch (error) {
      setServerError(apiErrorMessage(error, error.message || "Google sign-in could not be completed."));
    } finally {
      setBusy(false);
    }
  }

  const passwordStrength = form.password.length < 8 ? "Add at least 8 characters" : form.password.length < 12 ? "Good start — longer is safer" : "Longer password looks good";
  const maxBirthDateValue = new Date();
  maxBirthDateValue.setFullYear(maxBirthDateValue.getFullYear() - 18);
  const maxBirthDate = `${maxBirthDateValue.getFullYear()}-${String(maxBirthDateValue.getMonth() + 1).padStart(2, "0")}-${String(maxBirthDateValue.getDate()).padStart(2, "0")}`;

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-one" /><div className="auth-bg-orb auth-bg-orb-two" />
      <section className="auth-shell">
        <aside className="auth-art-panel">
          <Logo />
          <div className="auth-art-scene"><span className="auth-orbit auth-orbit-a" /><span className="auth-orbit auth-orbit-b" /><span className="auth-float-heart heart-a">♡</span><span className="auth-float-heart heart-b">✦</span><img src="/heartlink-couple.jpg" alt="HeartLink's illustrated couple holding a heart" /></div>
          <div className="auth-art-copy"><span className="eyebrow">REAL PEOPLE. REAL POSSIBILITIES.</span><h2>Good people.<br /><em>Better connections.</em></h2><p>Meet with care, share a little curiosity, and see where a real conversation can lead.</p><div><span><Icon name="shield" size={16} /> Adults-only community</span><span><Icon name="heart" size={16} /> Built for mutual interest</span></div></div>
        </aside>
        <main className="auth-form-panel">
          <div className="auth-form-top"><p>{signup ? "Already a member?" : "New to HeartLink?"}</p><Link to={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Create an account"} <Icon name="arrowRight" size={14} /></Link></div>
          <div className="auth-form-inner">
            <span className="eyebrow">{signup ? "A GOOD PLACE TO BEGIN" : "GOOD TO SEE YOU AGAIN"}</span>
            <h1>{signup ? "Create your account" : "Welcome back"}</h1>
            <p className="auth-lede">{signup ? "A few details to get your profile started." : "Sign in to see who you have connected with."}</p>
            {signup && <p className="privacy-note"><Icon name="shield" size={15} /> Your birth date is only used to confirm you’re 18+.</p>}
            {serverError && <div className="form-banner form-banner-error" role="alert"><Icon name="alert" size={17} />{serverError}</div>}
            {success && <div className="form-banner form-banner-success" role="status"><Icon name="checkCircle" size={17} />{success}</div>}
            <form className="auth-form" onSubmit={submit} noValidate>
              {signup && <Field id="signup-name" name="name" label="Full name" autoComplete="name" placeholder="Your full name" maxLength={60} value={form.name} onChange={update} error={errors.name} />}
              <Field id="auth-email" name="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" maxLength={100} value={form.email} onChange={update} error={errors.email} />
              {signup && <div className="form-row"><div className="field"><label htmlFor="signup-dob">Date of birth</label><input id="signup-dob" type="date" name="dateOfBirth" autoComplete="bday" max={maxBirthDate} value={form.dateOfBirth} onChange={update} aria-invalid={Boolean(errors.dateOfBirth)} aria-describedby={errors.dateOfBirth ? "signup-dob-error" : "signup-dob-hint"} /><small id="signup-dob-hint" className="field-hint">You must be 18 or older.</small>{errors.dateOfBirth && <small id="signup-dob-error" className="field-error" role="alert">{errors.dateOfBirth}</small>}</div><div className="field"><label htmlFor="signup-gender">Gender</label><select id="signup-gender" name="gender" value={form.gender} onChange={update} aria-invalid={Boolean(errors.gender)}><option value="">Choose an option</option><option value="female">Woman</option><option value="male">Man</option><option value="non-binary">Non-binary</option><option value="other">Other</option></select>{errors.gender && <small className="field-error" role="alert">{errors.gender}</small>}</div></div>}
              <div className="field"><div className="field-label-row"><label htmlFor="auth-password">Password</label>{!signup && <Link to="/forgot-password">Forgot password?</Link>}</div><div className="password-control"><input id="auth-password" type={showPassword ? "text" : "password"} name="password" autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "At least 8 characters" : "Your password"} minLength={signup ? 8 : undefined} maxLength={72} value={form.password} onChange={update} aria-invalid={Boolean(errors.password)} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}><Icon name={showPassword ? "eyeOff" : "eye"} size={17} /></button></div>{signup && <small className="field-hint">{passwordStrength}</small>}{errors.password && <small className="field-error" role="alert">{errors.password}</small>}</div>
              {signup && <div className="field"><label htmlFor="signup-confirm">Confirm password</label><div className="password-control"><input id="signup-confirm" type={showConfirm ? "text" : "password"} name="confirmPassword" autoComplete="new-password" placeholder="Re-enter your password" maxLength={72} value={form.confirmPassword} onChange={update} aria-invalid={Boolean(errors.confirmPassword)} /><button type="button" aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"} aria-pressed={showConfirm} onClick={() => setShowConfirm((value) => !value)}><Icon name={showConfirm ? "eyeOff" : "eye"} size={17} /></button></div>{errors.confirmPassword && <small className="field-error" role="alert">{errors.confirmPassword}</small>}</div>}
              {signup && <div className="terms-row"><input id="terms-accepted" type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={update} aria-invalid={Boolean(errors.termsAccepted)} /><label htmlFor="terms-accepted">I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.</label>{errors.termsAccepted && <small className="field-error" role="alert">{errors.termsAccepted}</small>}</div>}
              <Button type="submit" disabled={busy} className="auth-submit">{busy ? <><span className="button-spinner" /> {signup ? "Creating your account…" : "Signing in…"}</> : <>{signup ? "Create account" : "Log in"} <Icon name="arrowRight" size={17} /></>}</Button>
            </form>
            {firebaseConfigured && <><div className="auth-divider"><span /> or <span /></div><Button variant="outline" disabled={busy} className="google-button" onClick={googleSubmit}><span className="google-g">G</span>{signup ? "Continue with Google" : "Sign in with Google"}</Button>{signup && <small className="google-hint">Complete your profile details above before continuing.</small>}</>}
            <p className="auth-switch">{signup ? "Already have an account?" : "New to HeartLink?"} <Link to={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Create an account"}</Link></p>
          </div>
          <div className="auth-assurance"><Icon name="lock" size={14} /> Your password is never shown on your profile.</div>
        </main>
      </section>
    </div>
  );
}

export function AboutPage() {
  return <PublicPage className="info-page"><main className="info-main about-main"><section className="about-intro"><div className="about-art-card"><img src="/heartlink-couple.jpg" alt="HeartLink's illustrated couple sharing a heart" /><span><strong>Real people.</strong><small>Real possibilities.</small></span></div><div className="about-copy"><span className="eyebrow">A LITTLE ABOUT US</span><h1>Connection should feel <em>human.</em></h1><p>HeartLink is a place for adults who believe a good relationship begins with curiosity, kindness, and room to be yourself.</p><div className="about-principles"><div><Icon name="heart" /><strong>Mutual by design</strong><span>Both people choose to connect.</span></div><div><Icon name="shield" /><strong>Safety tools in reach</strong><span>Privacy controls, block, and report.</span></div><div><Icon name="message" /><strong>Conversation first</strong><span>Start with what you have in common.</span></div></div><Button to="/signup">Meet with intention <Icon name="arrowRight" /></Button></div></section><section className="about-values"><div><span className="value-index">01</span><h2>People before profiles</h2><p>Give someone a sense of who you are through the details and interests you choose to share.</p></div><div><span className="value-index">02</span><h2>Kindness as the standard</h2><p>Respectful conversation is part of the experience. Members can block or report when something feels wrong.</p></div><div><span className="value-index">03</span><h2>A pace that feels right</h2><p>There is no need to rush. Explore, make a mutual connection, and let a conversation unfold.</p></div></section></main></PublicPage>;
}

export function FAQPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(0);
  const filtered = useMemo(() => faqItems.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(search.trim().toLowerCase())), [search]);
  return <PublicPage className="info-page"><main className="info-main faq-main"><span className="eyebrow">WE’VE GOT ANSWERS</span><h1>Frequently asked <em>questions.</em></h1><p className="info-lede">Clear answers so you can spend more time getting to know people.</p><label className="faq-search" htmlFor="faq-search"><Icon name="search" size={18} /><input id="faq-search" type="search" placeholder="Search matching, privacy, membership…" value={search} onChange={(event) => { setSearch(event.target.value); setOpen(0); }} /></label><div className="faq-list">{filtered.map(([question, answer], index) => <article className={`faq-item ${open === index ? "open" : ""}`} key={question}><button type="button" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}><span>{question}</span><b>{open === index ? "−" : "+"}</b></button>{open === index && <p>{answer}</p>}</article>)}{!filtered.length && <EmptyState icon="search" title="No matching questions" text="Try another word, or send a note to our support team." action={<Button to="/help" variant="soft">Contact support</Button>} />}</div><p className="faq-contact">Still have a question? <Link to="/help">Get in touch with our team <Icon name="arrowRight" size={14} /></Link></p></main></PublicPage>;
}

export function LegalPage({ type = "terms" }) {
  const privacy = type === "privacy";
  return <PublicPage className="info-page"><main className="info-main legal-main"><span className="eyebrow">HEARTLINK POLICIES</span><h1>{privacy ? "Privacy, in plain language." : "A few ways to keep HeartLink kind."}</h1><p className="info-lede">This project’s policy pages are drafts. Review them with qualified counsel before public launch.</p><article className="legal-card">{privacy ? <><h2>What your profile shows</h2><p>Your public profile includes only the details you choose to share, such as your name, age, city, interests, photos, and profile details. Your email and exact date of birth are not shown on your profile.</p><h2>How your data is handled</h2><p>Account records and profile data are sent to the HeartLink API and stored in its configured MongoDB Atlas database. Authentication refresh tokens are handled using an HTTP-only cookie; the browser keeps the short-lived access token in memory.</p><h2>Your choices</h2><p>You can edit your profile, change visibility and notification preferences, block members, or request account deletion in Settings. Contact Support for privacy questions.</p></> : <><h2>Adults only</h2><p>HeartLink is intended for people aged 18 and older. Do not create an account using another person’s identity or an inaccurate birth date.</p><h2>Respect and consent</h2><p>Do not harass, threaten, impersonate, or share content that violates another person’s consent. Use the report and block tools when a member’s behavior concerns you.</p><h2>Account and safety</h2><p>You are responsible for keeping your sign-in details private. Do not share financial information, verification codes, or passwords with other members. You can delete your account from Settings.</p></>}</article><Button to="/signup">Create an account <Icon name="arrowRight" /></Button></main></PublicPage>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ busy: false, message: "", error: "" });
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true, message: "", error: "" });
    try {
      const { data } = await api.post("/auth/forgot-password", { email: email.trim() });
      setState({ busy: false, message: data.message || "If an account exists, a reset link will be sent.", error: "" });
    } catch (error) {
      setState({ busy: false, message: "", error: apiErrorMessage(error, "We could not submit your request.") });
    }
  }
  return <PublicPage className="info-page"><main className="info-main recovery-main"><span className="eyebrow">ACCOUNT RECOVERY</span><h1>Reset your password</h1><p className="info-lede">Enter your account email. If it exists, we’ll send a secure reset link.</p><form className="recovery-form" onSubmit={submit}>{state.error && <div className="form-banner form-banner-error" role="alert"><Icon name="alert" />{state.error}</div>}{state.message && <div className="form-banner form-banner-success" role="status"><Icon name="checkCircle" />{state.message}</div>}<Field id="recovery-email" label="Email address" type="email" autoComplete="email" maxLength={100} required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /><Button type="submit" disabled={state.busy}>{state.busy ? "Sending…" : "Send reset link"} <Icon name="arrowRight" /></Button></form><Link className="recovery-back" to="/login"><Icon name="arrowLeft" size={15} /> Back to login</Link></main></PublicPage>;
}

export function ResetPasswordPage() {
  const { token = "" } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [state, setState] = useState({ busy: false, message: "", error: "" });
  async function submit(event) {
    event.preventDefault();
    if (password !== confirm) return setState({ busy: false, message: "", error: "Your passwords do not match." });
    setState({ busy: true, message: "", error: "" });
    try {
      const { data } = await api.post("/auth/reset-password", { token, newPassword: password });
      setState({ busy: false, message: data.message || "Your password was reset. You can log in now.", error: "" });
    } catch (error) {
      setState({ busy: false, message: "", error: apiErrorMessage(error, "This reset link is invalid or expired.") });
    }
  }
  return <PublicPage className="info-page"><main className="info-main recovery-main"><span className="eyebrow">ACCOUNT RECOVERY</span><h1>Choose a new password</h1><p className="info-lede">Use a password between 8 and 72 characters.</p><form className="recovery-form" onSubmit={submit}>{state.error && <div className="form-banner form-banner-error" role="alert">{state.error}</div>}{state.message && <div className="form-banner form-banner-success" role="status">{state.message}</div>}<div className="field"><label htmlFor="new-password">New password</label><div className="password-control"><input id="new-password" type={show ? "text" : "password"} minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}><Icon name={show ? "eyeOff" : "eye"} /></button></div></div><div className="field"><label htmlFor="confirm-password">Confirm password</label><div className="password-control"><input id="confirm-password" type={show ? "text" : "password"} minLength={8} maxLength={72} required value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" /></div></div><Button type="submit" disabled={state.busy}>{state.busy ? "Saving…" : "Reset password"} <Icon name="arrowRight" /></Button></form><Link className="recovery-back" to="/login"><Icon name="arrowLeft" size={15} /> Back to login</Link></main></PublicPage>;
}

export function VerifyEmailPage() {
  const { token = "" } = useParams();
  const submitted = useRef("");
  const activeToken = useRef(token);
  activeToken.current = token;
  const [state, setState] = useState({ busy: true, message: "Checking your secure link…", error: "" });
  useEffect(() => {
    if (submitted.current === token) return;
    submitted.current = token;
    api.post("/auth/verify-email", { token }).then(({ data }) => {
      if (activeToken.current === token) setState({ busy: false, message: data.message || "Your email is verified.", error: "" });
    }).catch((error) => {
      if (activeToken.current === token) setState({ busy: false, message: "", error: apiErrorMessage(error, "This verification link is invalid or expired.") });
    });
  }, [token]);
  return <PublicPage className="info-page"><main className="info-main recovery-main"><span className="eyebrow">EMAIL VERIFICATION</span><div className={`status-illustration ${state.error ? "has-error" : ""}`}><Icon name={state.busy ? "clock" : state.error ? "alert" : "checkCircle"} size={32} /></div><h1>{state.busy ? "One moment…" : state.error ? "Link unavailable" : "You’re verified"}</h1>{state.error ? <div role="alert" className="form-banner form-banner-error">{state.error}</div> : <p role="status" className="info-lede">{state.message}</p>}<Button to="/login">Go to login <Icon name="arrowRight" /></Button></main></PublicPage>;
}

export function HelpPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ email: user?.email || "", category: "account", subject: "", message: "" });
  const [state, setState] = useState({ busy: false, success: "", error: "" });
  function update(event) { setForm((value) => ({ ...value, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true, success: "", error: "" });
    try {
      const { data } = await api.post("/support", { ...form, email: user?.email || form.email });
      setState({ busy: false, success: data.message || "Your support request was received.", error: "" });
      if (!user) setForm((value) => ({ ...value, subject: "", message: "" }));
      toast.success("Support request sent");
    } catch (error) {
      setState({ busy: false, success: "", error: apiErrorMessage(error, "We could not send your request.") });
    }
  }
  const content = <main className={`info-main help-main ${user ? "member-help-main" : ""}`}><PageHeading eyebrow="WE’RE HERE TO HELP" title="Tell us what you need." description="Send a note to the HeartLink support team. Please never include your password or payment details." /><div className="help-layout"><aside className="help-aside"><span className="help-aside-icon"><Icon name="message" size={23} /></span><h2>A real person will take a look.</h2><p>Choose the closest topic and share the steps that led to the issue.</p><div><Icon name="shield" /> Safety concerns are reviewed with care.</div><div><Icon name="clock" /> We’ll reply to the email on your account.</div></aside><form className="help-form" onSubmit={submit}>{state.error && <div className="form-banner form-banner-error" role="alert">{state.error}</div>}{state.success && <div className="form-banner form-banner-success" role="status">{state.success}</div>}{!user && <Field id="support-email" label="Email address" type="email" name="email" required maxLength={100} value={form.email} onChange={update} placeholder="you@example.com" />}<div className="field"><label htmlFor="support-category">What is this about?</label><select id="support-category" name="category" value={form.category} onChange={update}><option value="account">Account</option><option value="profile">Profile</option><option value="matching">Matching</option><option value="billing">Billing</option><option value="safety">Safety</option><option value="other">Something else</option></select></div><Field id="support-subject" label="Subject" name="subject" required maxLength={120} value={form.subject} onChange={update} placeholder="A short summary" /><div className="field"><label htmlFor="support-message">How can we help?</label><textarea id="support-message" name="message" rows={6} required minLength={10} maxLength={3000} value={form.message} onChange={update} placeholder="Share the details that will help us understand…" /><small className="field-hint">At least 10 characters, up to 3000.</small></div><Button type="submit" disabled={state.busy}>{state.busy ? "Sending request…" : "Send to support"} <Icon name="arrowRight" /></Button></form></div></main>;
  return user ? content : <PublicPage className="info-page">{content}</PublicPage>;
}

export function NotFoundPage() {
  return <PublicPage className="info-page"><main className="info-main not-found-main"><span className="eyebrow">404 · WRONG TURN</span><div className="not-found-mark"><Icon name="heart" size={34} /></div><h1>This page wandered off.</h1><p className="info-lede">Let’s get you back to something good.</p><Button to="/">Back to HeartLink <Icon name="arrowRight" /></Button></main></PublicPage>;
}
