import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { RequireMember } from "./components/Layout.jsx";
import { PageSpinner } from "./components/ui.jsx";

const LandingPage = lazy(() => import("./pages/PublicPages.jsx").then((pages) => ({ default: pages.LandingPage })));
const AboutPage = lazy(() => import("./pages/PublicPages.jsx").then((pages) => ({ default: pages.AboutPage })));
const AuthPage = lazy(() => import("./pages/PublicPages.jsx").then((pages) => ({ default: pages.AuthPage })));
const FAQPage = lazy(() => import("./pages/PublicPages.jsx").then((pages) => ({ default: pages.FAQPage })));
const ForgotPasswordPage = lazy(() => import("./pages/PublicPages.jsx").then((pages) => ({ default: pages.ForgotPasswordPage })));
const HelpPage = lazy(() => import("./pages/PublicPages.jsx").then((pages) => ({ default: pages.HelpPage })));
const LegalPage = lazy(() => import("./pages/PublicPages.jsx").then((pages) => ({ default: pages.LegalPage })));
const NotFoundPage = lazy(() => import("./pages/PublicPages.jsx").then((pages) => ({ default: pages.NotFoundPage })));
const ResetPasswordPage = lazy(() => import("./pages/PublicPages.jsx").then((pages) => ({ default: pages.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import("./pages/PublicPages.jsx").then((pages) => ({ default: pages.VerifyEmailPage })));
const DiscoverPage = lazy(() => import("./pages/DiscoveryPages.jsx").then((pages) => ({ default: pages.DiscoverPage })));
const LikesPage = lazy(() => import("./pages/DiscoveryPages.jsx").then((pages) => ({ default: pages.LikesPage })));
const MatchesPage = lazy(() => import("./pages/DiscoveryPages.jsx").then((pages) => ({ default: pages.MatchesPage })));
const ProfilePage = lazy(() => import("./pages/DiscoveryPages.jsx").then((pages) => ({ default: pages.ProfilePage })));
const EditProfilePage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.EditProfilePage })));
const FiltersPage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.FiltersPage })));
const NotificationsPage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.NotificationsPage })));
const PremiumPage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.PremiumPage })));
const ReportQueuePage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.ReportQueuePage })));
const SettingsPage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.SettingsPage })));
const SupportQueuePage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.SupportQueuePage })));
const MessagesPage = lazy(() => import("./pages/MessagesPage.jsx").then((pages) => ({ default: pages.MessagesPage })));

// Admin lazy imports
const AdminLogin = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.AdminLayout })));
const ProtectedAdminRoute = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.ProtectedAdminRoute })));
const RequireAdminRoles = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.RequireAdminRoles })));
const AdminIndexRedirect = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.AdminIndexRedirect })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.AdminDashboard })));
const UserManagement = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.UserManagement })));
const UserDetails = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.UserDetails })));
const ActivityMonitoring = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.ActivityMonitoring })));
const Analytics = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.Analytics })));
const SecurityCenter = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.SecurityCenter })));
const AuditLogs = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.AuditLogs })));
const DatabaseMonitor = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.DatabaseMonitor })));
const SystemHealth = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.SystemHealth })));
const AdminNotifications = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.AdminNotifications })));
const RoleManagement = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.RoleManagement })));
const AdminSettings = lazy(() => import("./pages/admin/AdminPages.jsx").then((m) => ({ default: m.AdminSettings })));


function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname, hash]);
  return null;
}

function MemberRoute({ children }) {
  return <RequireMember>{children}</RequireMember>;
}

function StaffRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <PageSpinner label="Checking staff access" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!["superadmin", "admin", "moderator"].includes(user.role)) return <Navigate to="/discover" replace />;
  return <MemberRoute>{children}</MemberRoute>;
}

function AuthRedirect({ mode }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <PageSpinner label="Getting HeartLink ready" />;
  if (user) return <Navigate to="/discover" replace />;
  return <AuthPage mode={mode} />;
}

function HelpRoute() {
  const { user, authLoading } = useAuth();
  if (authLoading) return <PageSpinner label="Getting HeartLink ready" />;
  return user ? <RequireMember><HelpPage /></RequireMember> : <HelpPage />;
}

function LegacyChatRedirect() {
  const { matchId } = useParams();
  return <Navigate to={`/messages/${encodeURIComponent(matchId || "")}`} replace />;
}

function App() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={<PageSpinner label="Opening HeartLink" />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<AuthRedirect mode="signup" />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route path="/auth/register" element={<Navigate to="/signup" replace />} />
          <Route path="/auth/signup" element={<Navigate to="/signup" replace />} />
          <Route path="/login" element={<AuthRedirect mode="login" />} />
          <Route path="/auth/login" element={<Navigate to="/login" replace />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/help" element={<HelpRoute />} />

          <Route path="/discover" element={<MemberRoute><DiscoverPage /></MemberRoute>} />
          <Route path="/profile/edit" element={<MemberRoute><EditProfilePage /></MemberRoute>} />
          <Route path="/edit-profile" element={<Navigate to="/profile/edit" replace />} />
          <Route path="/profile/:profileId" element={<MemberRoute><ProfilePage /></MemberRoute>} />
          <Route path="/likes" element={<MemberRoute><LikesPage /></MemberRoute>} />
          <Route path="/matches" element={<MemberRoute><MatchesPage /></MemberRoute>} />
          <Route path="/messages" element={<MemberRoute><MessagesPage /></MemberRoute>} />
          <Route path="/messages/:conversationId" element={<MemberRoute><MessagesPage /></MemberRoute>} />
          <Route path="/chat/:matchId" element={<LegacyChatRedirect />} />
          <Route path="/settings" element={<MemberRoute><SettingsPage /></MemberRoute>} />
          <Route path="/premium" element={<MemberRoute><PremiumPage /></MemberRoute>} />
          <Route path="/search" element={<MemberRoute><FiltersPage /></MemberRoute>} />
          <Route path="/filters" element={<Navigate to="/search" replace />} />
          <Route path="/notifications" element={<MemberRoute><NotificationsPage /></MemberRoute>} />
          <Route path="/admin/support" element={<StaffRoute><SupportQueuePage /></StaffRoute>} />
          <Route path="/admin/reports" element={<StaffRoute><ReportQueuePage /></StaffRoute>} />

          {/* ── Admin Panel ── */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedAdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="dashboard" element={<RequireAdminRoles roles={["admin", "superadmin"]}><AdminDashboard /></RequireAdminRoles>} />
              <Route path="users" element={<RequireAdminRoles roles={["admin", "superadmin"]}><UserManagement /></RequireAdminRoles>} />
              <Route path="users/:id" element={<UserDetails />} />
              <Route path="roles" element={<RequireAdminRoles roles={["superadmin"]}><RoleManagement /></RequireAdminRoles>} />
              <Route path="activity" element={<RequireAdminRoles roles={["admin", "superadmin"]}><ActivityMonitoring /></RequireAdminRoles>} />
              <Route path="analytics" element={<RequireAdminRoles roles={["admin", "superadmin"]}><Analytics /></RequireAdminRoles>} />
              <Route path="security" element={<RequireAdminRoles roles={["admin", "superadmin"]}><SecurityCenter /></RequireAdminRoles>} />
              <Route path="audit-logs" element={<RequireAdminRoles roles={["admin", "superadmin"]}><AuditLogs /></RequireAdminRoles>} />
              <Route path="database" element={<RequireAdminRoles roles={["superadmin"]}><DatabaseMonitor /></RequireAdminRoles>} />
              <Route path="system" element={<RequireAdminRoles roles={["admin", "superadmin"]}><SystemHealth /></RequireAdminRoles>} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<RequireAdminRoles roles={["admin", "superadmin"]}><AdminSettings /></RequireAdminRoles>} />
              <Route index element={<AdminIndexRedirect />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
