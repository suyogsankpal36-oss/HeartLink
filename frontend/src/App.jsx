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

const MemberDashboardPage = lazy(() =>
  import("./pages/MemberDashboardPage.jsx").then((pages) => ({ default: pages.MemberDashboardPage }))
);
const DiscoverPage = lazy(() => import("./pages/DiscoveryPages.jsx").then((pages) => ({ default: pages.DiscoverPage })));
const LikesPage = lazy(() => import("./pages/DiscoveryPages.jsx").then((pages) => ({ default: pages.LikesPage })));
const MatchesPage = lazy(() => import("./pages/DiscoveryPages.jsx").then((pages) => ({ default: pages.MatchesPage })));
const ProfilePage = lazy(() => import("./pages/DiscoveryPages.jsx").then((pages) => ({ default: pages.ProfilePage })));
const EditProfilePage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.EditProfilePage })));
const FiltersPage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.FiltersPage })));
const NotificationsPage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.NotificationsPage })));
const PremiumPage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.PremiumPage })));
const SettingsPage = lazy(() => import("./pages/AccountPages.jsx").then((pages) => ({ default: pages.SettingsPage })));
const MessagesPage = lazy(() => import("./pages/MessagesPage.jsx").then((pages) => ({ default: pages.MessagesPage })));

// Admin & Moderation console lazy imports (directly by chunk so charts only load on dashboard/analytics)
const RequireAdmin = lazy(() => import("./pages/admin/AdminLayout.jsx").then((m) => ({ default: m.RequireAdmin })));
const AdminLogin = lazy(() => import("./pages/admin/AdminLayout.jsx").then((m) => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.jsx").then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx").then((m) => ({ default: m.AdminDashboard })));
const UserManagement = lazy(() => import("./pages/admin/UserManagement.jsx").then((m) => ({ default: m.UserManagement })));
const UserDetails = lazy(() => import("./pages/admin/UserManagement.jsx").then((m) => ({ default: m.UserDetails })));
const Analytics = lazy(() => import("./pages/admin/AnalyticsPage.jsx").then((m) => ({ default: m.Analytics })));
const RoleManagement = lazy(() => import("./pages/admin/MonitoringPages.jsx").then((m) => ({ default: m.RoleManagement })));
const ActivityMonitoring = lazy(() => import("./pages/admin/MonitoringPages.jsx").then((m) => ({ default: m.ActivityMonitoring })));
const SecurityCenter = lazy(() => import("./pages/admin/MonitoringPages.jsx").then((m) => ({ default: m.SecurityCenter })));
const AdminAuditLogs = lazy(() => import("./pages/admin/MonitoringPages.jsx").then((m) => ({ default: m.AdminAuditLogs })));
const DatabaseMonitoring = lazy(() => import("./pages/admin/MonitoringPages.jsx").then((m) => ({ default: m.DatabaseMonitoring })));
const SystemHealth = lazy(() => import("./pages/admin/MonitoringPages.jsx").then((m) => ({ default: m.SystemHealth })));
const AdminNotifications = lazy(() => import("./pages/admin/MonitoringPages.jsx").then((m) => ({ default: m.AdminNotifications })));
const AdminSettings = lazy(() => import("./pages/admin/MonitoringPages.jsx").then((m) => ({ default: m.AdminSettings })));
const ModeratorDashboardPage = lazy(() => import("./pages/admin/ModerationPages.jsx").then((m) => ({ default: m.ModeratorDashboardPage })));
const ReportQueuePage = lazy(() => import("./pages/admin/ModerationPages.jsx").then((m) => ({ default: m.ReportQueuePage })));
const SupportQueuePage = lazy(() => import("./pages/admin/ModerationPages.jsx").then((m) => ({ default: m.SupportQueuePage })));

function FullPageLoader({ label = "Opening HeartLink" }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-base-200">
      <PageSpinner label={label} />
    </div>
  );
}

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

function AuthRedirect({ mode }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <FullPageLoader label="Getting HeartLink ready" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <AuthPage mode={mode} />;
}

function HelpRoute() {
  const { user, authLoading } = useAuth();
  if (authLoading) return <FullPageLoader label="Getting HeartLink ready" />;
  return user ? (
    <RequireMember>
      <HelpPage />
    </RequireMember>
  ) : (
    <HelpPage />
  );
}

function AdminIndexRedirect() {
  const { user } = useAuth();
  if (user?.role === "moderator") {
    return <Navigate to="/admin/moderation" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
}

function LegacyChatRedirect() {
  const { matchId } = useParams();
  return <Navigate to={`/messages/${encodeURIComponent(matchId || "")}`} replace />;
}

function App() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={<FullPageLoader label="Opening HeartLink" />}>
        <Routes>
          {/* Public */}
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

          {/* Member workspace */}
          <Route path="/dashboard" element={<MemberRoute><MemberDashboardPage /></MemberRoute>} />
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

          {/* Enterprise Admin / Moderation Console */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin minRole="moderator">
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminIndexRedirect />} />
            <Route path="moderation" element={<ModeratorDashboardPage />} />
            <Route path="reports" element={<ReportQueuePage />} />
            <Route path="support" element={<SupportQueuePage />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="users/:id" element={<UserDetails />} />

            <Route
              path="dashboard"
              element={
                <RequireAdmin minRole="admin">
                  <AdminDashboard />
                </RequireAdmin>
              }
            />
            <Route
              path="users"
              element={
                <RequireAdmin minRole="admin">
                  <UserManagement />
                </RequireAdmin>
              }
            />
            <Route
              path="activity"
              element={
                <RequireAdmin minRole="admin">
                  <ActivityMonitoring />
                </RequireAdmin>
              }
            />
            <Route
              path="analytics"
              element={
                <RequireAdmin minRole="admin">
                  <Analytics />
                </RequireAdmin>
              }
            />
            <Route
              path="security"
              element={
                <RequireAdmin minRole="admin">
                  <SecurityCenter />
                </RequireAdmin>
              }
            />
            <Route
              path="audit-logs"
              element={
                <RequireAdmin minRole="admin">
                  <AdminAuditLogs />
                </RequireAdmin>
              }
            />
            <Route
              path="system"
              element={
                <RequireAdmin minRole="admin">
                  <SystemHealth />
                </RequireAdmin>
              }
            />

            <Route
              path="roles"
              element={
                <RequireAdmin minRole="superadmin">
                  <RoleManagement />
                </RequireAdmin>
              }
            />
            <Route
              path="database"
              element={
                <RequireAdmin minRole="superadmin">
                  <DatabaseMonitoring />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<AdminIndexRedirect />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
