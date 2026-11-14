import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  EyeOff,
  Heart,
  HelpCircle,
  Lock,
  Mail,
  MessageSquare,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
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
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <PublicPage>
      <PageTransition>
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden border-b hl-subtle-divider">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[780px] rounded-full bg-rose-500/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="primary" dot>
                    Where Hearts Find Their Connection
                  </Badge>
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#F45B83]">
                    Discover &bull; Connect &bull; Match &bull; Love
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-base-content leading-[1.12]">
                  Find Your Connection.{" "}
                  <span className="bg-gradient-to-r from-[#F45B83] via-[#C2295D] to-[#681D3B] bg-clip-text text-transparent">
                    Start Your Story.
                  </span>
                </h1>
                <p className="text-base sm:text-lg hl-muted-text max-w-xl leading-relaxed">
                  Discover genuine people, create meaningful connections, and meet someone who makes every moment special.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {user ? (
                    <Link to="/dashboard">
                      <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                        Explore Connections
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/signup">
                        <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                          Join Heartlink
                        </Button>
                      </Link>
                      <Link to="/login">
                        <Button variant="outline" size="lg">
                          Explore Connections
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

        {/* 2. How Heartlink Works */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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

        {/* 3. Discover New People */}
        <section className="border-t hl-subtle-divider bg-base-100/40">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-4">
                <Badge tone="primary" dot>Curated Discovery</Badge>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-base-content">
                  Discover genuine singles in your city who match your intentions.
                </h2>
                <p className="text-sm hl-muted-text leading-relaxed">
                  Swipe through natural, photo-forward profiles with natural spring physics. Filter by verified age, relationship intentions, location, and lifestyle preferences.
                </p>
                <ul className="space-y-2 text-xs hl-muted-text pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Fluid swipe gestures: pass left, like right, superlike up</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Double-tap photo to trigger spontaneous heart animation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Rewind previous swipe with Instant Rewind capability</span>
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-4 space-y-3 bg-base-100 border border-rose-500/20 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-base-content">Sophia, 26</span>
                        <ShieldCheck className="h-4 w-4 text-rose-500" />
                      </div>
                      <Badge tone="success">98% Match</Badge>
                    </div>
                    <p className="text-xs hl-muted-text italic">
                      "Looking for someone who appreciates weekend road trips and slow Sunday pour-overs."
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded-md bg-base-200 px-2 py-0.5 text-[11px] text-base-content">Photography</span>
                      <span className="rounded-md bg-base-200 px-2 py-0.5 text-[11px] text-base-content">Hiking</span>
                      <span className="rounded-md bg-base-200 px-2 py-0.5 text-[11px] text-base-content">Indie Cinema</span>
                    </div>
                  </Card>
                  <Card className="p-4 space-y-3 bg-base-100 border border-rose-500/20 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-base-content">Liam, 28</span>
                        <ShieldCheck className="h-4 w-4 text-rose-500" />
                      </div>
                      <Badge tone="primary">94% Match</Badge>
                    </div>
                    <p className="text-xs hl-muted-text italic">
                      "Architect by day, vinyl collector by night. Let&apos;s trade favorite records."
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded-md bg-base-200 px-2 py-0.5 text-[11px] text-base-content">Architecture</span>
                      <span className="rounded-md bg-base-200 px-2 py-0.5 text-[11px] text-base-content">Vinyl Records</span>
                      <span className="rounded-md bg-base-200 px-2 py-0.5 text-[11px] text-base-content">Coffee</span>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Find Meaningful Connections */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
              Values &amp; Lifestyle
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-base-content">
              Find Meaningful Connections Built on Chemistry &amp; Shared Values.
            </h2>
            <p className="text-sm hl-muted-text leading-relaxed">
              Dating is better when you connect on what matters most. HeartLink highlights shared conversation prompts, mutual values, and lifestyle preferences.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Long-term Love", icon: Heart },
              { label: "Active Lifestyle", icon: Sparkles },
              { label: "World Travel", icon: Compass },
              { label: "Book Enthusiasts", icon: UserCheck },
              { label: "Foodie & Cooking", icon: Users },
              { label: "Verified Safety", icon: ShieldCheck },
            ].map((v) => {
              const IconComp = v.icon;
              return (
                <div
                  key={v.label}
                  className="rounded-xl border hl-subtle-divider bg-base-100 p-4 text-center hover:border-rose-500/40 transition-colors shadow-xs"
                >
                  <IconComp className="h-5 w-5 text-rose-500 mx-auto mb-2" strokeWidth={1.75} />
                  <p className="text-xs font-semibold text-base-content">{v.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Real-Time Conversations */}
        <section className="border-t hl-subtle-divider bg-base-100/60">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-4">
                <Badge tone="primary" dot>Socket.IO Powered</Badge>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-base-content">
                  Real-time conversations with instant typing &amp; reactions.
                </h2>
                <p className="text-sm hl-muted-text leading-relaxed">
                  No awkward lags or cold unsolicited DMs. HeartLink conversations open exclusively when two people mutually swipe right. Enjoy live typing indicators, heart reactions, and read receipts.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border hl-subtle-divider bg-base-200/50 p-3">
                    <p className="text-xs font-semibold text-base-content">Zero Cold Spam</p>
                    <p className="text-[11px] hl-muted-text">Chats open only upon mutual like.</p>
                  </div>
                  <div className="rounded-lg border hl-subtle-divider bg-base-200/50 p-3">
                    <p className="text-xs font-semibold text-base-content">Interactive Reactions</p>
                    <p className="text-[11px] hl-muted-text">React with hearts, fire, and sparkles.</p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6">
                <Card className="max-w-md mx-auto p-4 space-y-3 bg-base-100 shadow-xl border-rose-500/20">
                  <div className="flex items-center justify-between border-b hl-subtle-divider pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-8 w-8 rounded-full bg-rose-500/20 items-center justify-center text-xs font-bold text-rose-500">
                        E
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-base-100" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-base-content">Emma &bull; Mutual Match</p>
                        <p className="text-[10px] text-emerald-500">Online now</p>
                      </div>
                    </div>
                    <Badge tone="primary">Live Chat</Badge>
                  </div>
                  <div className="space-y-2 text-xs py-2">
                    <div className="flex justify-start">
                      <div className="bg-base-200 rounded-2xl rounded-bl-xs px-3.5 py-2 max-w-[80%] text-base-content">
                        Hey! I saw you love indie cinema too. Have you seen the new festival release? 🎬
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl rounded-br-xs px-3.5 py-2 max-w-[80%]">
                        Yes! Watched it last weekend at the local theatre. Absolutely loved the cinematography! ✨
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] hl-muted-text pt-1">
                      <span className="inline-flex gap-1">
                        <span className="h-1 w-1 rounded-full bg-rose-500 animate-bounce" />
                        <span className="h-1 w-1 rounded-full bg-rose-500 animate-bounce [animation-delay:120ms]" />
                        <span className="h-1 w-1 rounded-full bg-rose-500 animate-bounce [animation-delay:240ms]" />
                      </span>
                      <span>Emma is typing...</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Why Choose Heartlink */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-2">
              The HeartLink Difference
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-base-content">
              Why thousands of singles choose HeartLink every week.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "100% Mutual Consent",
                desc: "No uninvited direct messages or intrusive solicitations. You only speak with people you have mutually chosen.",
              },
              {
                title: "Strict 18+ Verification",
                desc: "Every account validates age and date of birth at registration to ensure a mature and respectful dating environment.",
              },
              {
                title: "Granular Privacy Controls",
                desc: "Choose who sees you, hide your profile with 1 click, conceal exact location, or pause discovery whenever you want.",
              },
              {
                title: "24/7 Human Moderation",
                desc: "Our active moderation triage queue promptly investigates reports and suspends bad actors to protect your experience.",
              },
            ].map((col) => (
              <Card key={col.title} className="p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-base-content mb-2">{col.title}</h3>
                  <p className="text-xs hl-muted-text leading-relaxed">{col.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 7. Privacy and Safety */}
        <section id="safety" className="border-t hl-subtle-divider bg-base-100/60">
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

        {/* 8. Frequently Asked Questions (FAQ) */}
        <section id="faq" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-2">
              Got Questions?
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-base-content">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 max-w-3xl">
            {FAQ_ITEMS.map(([q, a], idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={q}
                  className="rounded-xl border hl-subtle-divider bg-base-100 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 font-medium text-sm text-base-content hover:bg-base-200/50 cursor-pointer"
                  >
                    <span>{q}</span>
                    <span className="text-rose-500 font-bold shrink-0">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs hl-muted-text leading-relaxed border-t hl-subtle-divider bg-base-200/20">
                      {a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 9. Final Call to Action */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card variant="elevated" className="bg-gradient-to-br from-rose-500/15 via-base-100 to-pink-500/15 border-rose-500/30 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 px-4">
              <div className="space-y-2 max-w-xl">
                <Badge tone="primary" dot>Start Your Journey</Badge>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-base-content">
                  Find Your Connection. Start Your Story.
                </h2>
                <p className="text-sm hl-muted-text leading-relaxed">
                  Join HeartLink for free today. Create your profile in under two minutes and meet someone wonderful who shares your chemistry and values.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link to={user ? "/dashboard" : "/signup"}>
                  <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    {user ? "Explore Connections" : "Join Heartlink Free"}
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

  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, label: "", width: "0%", color: "" };
    let points = 0;
    if (pw.length >= 8) points++;
    if (/[A-Z]/.test(pw)) points++;
    if (/[0-9]/.test(pw)) points++;
    if (/[^A-Za-z0-9]/.test(pw)) points++;
    if (points <= 1) return { score: 1, label: "Weak", width: "25%", color: "bg-error" };
    if (points === 2) return { score: 2, label: "Fair", width: "50%", color: "bg-warning" };
    if (points === 3) return { score: 3, label: "Good", width: "75%", color: "bg-info" };
    return { score: 4, label: "Strong", width: "100%", color: "bg-success" };
  };
  const pwStrength = getPasswordStrength(form.password);

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

  const [showPassword, setShowPassword] = useState(false);

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

        {/* Center Editorial Headline matching 03-register.png */}
        <div className="relative z-10 my-auto py-12 max-w-lg space-y-5">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            {signup ? "Your next chapter starts here." : "Find someone who gets your vibe."}
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
        {/* Mobile header */}
        <div className="flex items-center justify-between lg:hidden pb-6 mb-4 border-b border-rose-200/40 dark:border-rose-900/30">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link to="/" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
              Home
            </Link>
          </div>
        </div>

        {/* Desktop theme toggle & home link */}
        <div className="hidden lg:flex items-center justify-end gap-3 absolute top-8 right-10">
          <ThemeToggle compact />
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400">
            Home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-[440px] space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              {signup ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {signup
                ? "It takes less than a minute. Must be 18 or older."
                : "Log in to see who liked you and pick up your conversations."}
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3 shadow-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#E61E50]" />
              <div className="flex-1 space-y-1.5">
                <span>{serverError}</span>
                {showResendAction && (
                  <div>
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResendVerification}
                      className="font-semibold underline text-[#E61E50] cursor-pointer"
                    >
                      {resending ? "Resending..." : "Resend verification email"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800/40 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-3 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Continue with Google */}
          {firebaseConfigured ? (
            <button
              type="button"
              onClick={googleSubmit}
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
              <span>{signup ? "Sign up with Google" : "Continue with Google"}</span>
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
              <span>{signup ? "Sign up with Google" : "Continue with Google"}</span>
            </button>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            <span className="bg-[#FFF5F4] dark:bg-[#151219] px-3 text-[10px] sm:text-xs font-semibold tracking-wider text-gray-400 uppercase">
              {signup ? "OR SIGN UP WITH E-MAIL" : "OR LOG IN WITH E-MAIL"}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={submit} noValidate className="space-y-4">
            {signup && (
              <div className="space-y-1">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="First name"
                    maxLength={60}
                    required
                    value={form.name}
                    onChange={update}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E61E50] focus:border-transparent transition-all ${
                      errors.name ? "border-rose-400" : "border-gray-200 dark:border-gray-700"
                    }`}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-rose-500 pl-1">{errors.name}</p>}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={signup ? "E-mail address" : "you@example.com"}
                  maxLength={100}
                  required
                  value={form.email}
                  onChange={update}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E61E50] focus:border-transparent transition-all ${
                    errors.email ? "border-rose-400" : "border-gray-200 dark:border-gray-700"
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-500 pl-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  placeholder={signup ? "Password (8+ chars, letters & numbers)" : "Password"}
                  maxLength={72}
                  required
                  value={form.password}
                  onChange={update}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-white dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E61E50] focus:border-transparent transition-all ${
                    errors.password ? "border-rose-400" : "border-gray-200 dark:border-gray-700"
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
              {errors.password && <p className="text-[11px] text-rose-500 pl-1">{errors.password}</p>}
            </div>

            {signup && (
              <>
                {/* Date of Birth Field */}
                <div className="space-y-1">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      id="signup-dob"
                      name="dateOfBirth"
                      type="date"
                      autoComplete="bday"
                      max={maxBirthDate}
                      required
                      value={form.dateOfBirth}
                      onChange={update}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E61E50] focus:border-transparent transition-all ${
                        errors.dateOfBirth ? "border-rose-400" : "border-gray-200 dark:border-gray-700"
                      }`}
                    />
                  </div>
                  {errors.dateOfBirth && <p className="text-[11px] text-rose-500 pl-1">{errors.dateOfBirth}</p>}
                </div>

                {/* Gender Segmented Pills (Man | Woman | Other) */}
                <div className="space-y-1 pt-1">
                  <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700">
                    {[
                      { value: "male", label: "Man" },
                      { value: "female", label: "Woman" },
                      { value: "other", label: "Other" },
                    ].map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, gender: g.value }));
                          if (errors.gender) setErrors((prev) => ({ ...prev, gender: undefined }));
                        }}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          form.gender === g.value
                            ? "bg-[#E61E50] text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  {errors.gender && <p className="text-[11px] text-rose-500 pl-1">{errors.gender}</p>}
                </div>

                {/* Terms Acceptance */}
                <div className="space-y-1 pt-1">
                  <label htmlFor="terms-accepted" className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                    <input
                      id="terms-accepted"
                      type="checkbox"
                      name="termsAccepted"
                      checked={form.termsAccepted}
                      onChange={update}
                      className="rounded border-gray-300 text-[#E61E50] focus:ring-[#E61E50] h-3.5 w-3.5 mt-0.5"
                    />
                    <span>
                      I confirm I am 18+ and accept the{" "}
                      <Link to="/terms" className="text-[#E61E50] font-semibold underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-[#E61E50] font-semibold underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p className="text-[11px] text-rose-500 pl-1">{errors.termsAccepted}</p>
                  )}
                </div>
              </>
            )}

            {/* Submit Pill Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 py-3.5 px-6 rounded-full bg-[#E61E50] hover:bg-[#D01845] active:bg-[#B9143C] text-white text-sm font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Please wait..." : signup ? "Create account" : "Sign in"}
            </button>
          </form>

          {/* Bottom Switch Link */}
          <div className="text-center pt-1 text-xs text-gray-600 dark:text-gray-400">
            <p>
              {signup ? "Already a member? " : "New to HeartLink? "}
              <Link to={signup ? "/login" : "/signup"} className="font-semibold text-[#E61E50] hover:underline">
                {signup ? "Log in" : "Create an account"}
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
