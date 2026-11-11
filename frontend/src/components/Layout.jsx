import { useMemo, useState } from "react";
import { Link, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Avatar, Icon, Logo, PageSpinner } from "./ui.jsx";

const publicLinks = [
  ["Home", "/"], ["About", "/about"], ["Features", "/#features"],
  ["How it works", "/#how-it-works"], ["FAQ", "/faq"],
];

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="public-header">
      <Logo />
      <nav id="public-navigation" className={`public-links ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
        {publicLinks.map(([label, path]) => <Link key={label} to={path} onClick={() => setMenuOpen(false)}>{label}</Link>)}
        <Link className="mobile-login-link" to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
      </nav>
      <div className="public-actions"><Link className="login-link" to="/login">Log in</Link><Link to="/signup" className="button button-primary button-small">Create account <Icon name="arrowRight" size={15} /></Link></div>
      <button className={`menu-toggle ${menuOpen ? "is-open" : ""}`} type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="public-navigation" onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="footer-brand"><Logo /><p>Good people. Better connections.</p></div>
      <div className="footer-links"><Link to="/about">About</Link><Link to="/help">Support</Link><Link to="/faq">FAQ</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
      <small>© {new Date().getFullYear()} HeartLink. Meet with meaning.</small>
    </footer>
  );
}

function SideLink({ item, close }) {
  return <NavLink to={item.to} onClick={close} className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.badge > 0 && <b>{item.badge}</b>}</NavLink>;
}

export function AppShell({ children }) {
  const { user, stats, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMore, setMobileMore] = useState(false);
  const [search, setSearch] = useState(new URLSearchParams(location.search).get("search") || "");
  const isStaff = ["superadmin", "admin", "moderator"].includes(user?.role);
  const adminHome = user?.role === "moderator" ? "/admin/notifications" : "/admin/dashboard";

  const navigationItems = useMemo(() => [
    { label: "Discover", to: "/discover", icon: "compass" },
    { label: "Likes", to: "/likes", icon: "heart", badge: stats?.likesReceivedCount || 0 },
    { label: "Matches", to: "/matches", icon: "users", badge: stats?.matchesCount || 0 },
    { label: "Messages", to: "/messages", icon: "message" },
  ], [stats]);

  function submitSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/discover?search=${encodeURIComponent(query)}` : "/discover");
  }

  async function signOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="member-app">
      <aside className="sidebar" aria-label="Member navigation">
        <Logo />
        <div className="side-section"><span className="side-label">YOUR HEARTLINK</span><nav className="side-nav">{navigationItems.map((item) => <SideLink key={item.to} item={item} />)}<SideLink item={{ label: "My profile", to: "/profile/edit", icon: "user" }} /></nav></div>
        <div className="side-section"><span className="side-label">YOUR SPACE</span><nav className="side-nav"><SideLink item={{ label: "Premium", to: "/premium", icon: "star" }} /><SideLink item={{ label: "Settings", to: "/settings", icon: "settings" }} /><SideLink item={{ label: "Help & support", to: "/help", icon: "help" }} /></nav></div>
        {isStaff && <div className="side-section"><span className="side-label">TEAM TOOLS</span><nav className="side-nav"><SideLink item={{ label: user?.role === "superadmin" ? "Super Admin" : "Admin panel", to: adminHome, icon: "star" }} /><SideLink item={{ label: "Reports", to: "/admin/reports", icon: "shield" }} /><SideLink item={{ label: "Support queue", to: "/admin/support", icon: "message" }} /></nav></div>}
        <Link to="/premium" className="sidebar-promo"><span><Icon name="star" size={16} /> A little more discovery</span><strong>Meet people who fit <i>your way.</i></strong><span className="promo-link">Explore Premium <Icon name="arrowRight" size={14} /></span></Link>
        <button className="sidebar-account" type="button" onClick={() => navigate("/profile/edit")}><Avatar person={user} size="sm" /><span><strong>{user?.name || "Your account"}</strong><small>View your profile</small></span><Icon name="chevronRight" size={16} /></button>
      </aside>

      <div className="member-workspace">
        <header className="member-topbar">
          <form className="global-search" onSubmit={submitSearch} role="search"><Icon name="search" size={17} /><input aria-label="Search people, interests, or locations" placeholder="Search people, interests, or places" value={search} onChange={(event) => setSearch(event.target.value)} /><button type="submit" aria-label="Search"><Icon name="arrowRight" size={16} /></button></form>
          <div className="topbar-actions"><Link to="/premium" className="top-premium"><Icon name="star" size={15} /> Upgrade</Link><Link to="/notifications" className={`top-icon ${location.pathname === "/notifications" ? "active" : ""}`} aria-label="Notifications"><Icon name="bell" size={19} />{stats?.unreadNotificationsCount > 0 && <span className="notification-badge">{stats.unreadNotificationsCount > 99 ? "99+" : stats.unreadNotificationsCount}</span>}</Link><Link to="/profile/edit" className="top-user" aria-label="Edit your profile"><Avatar person={user} size="sm" /></Link></div>
        </header>
        <main className="member-content" key={location.pathname}>{children}</main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Member navigation">
        {navigationItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}><Icon name={item.icon} size={19} /><span>{item.label}</span></NavLink>)}
        <button className={`mobile-nav-link ${mobileMore ? "active" : ""}`} type="button" aria-expanded={mobileMore} onClick={() => setMobileMore((open) => !open)}><Icon name="more" size={20} /><span>More</span></button>
      </nav>
      {mobileMore && <div className="mobile-more-menu"><Link to="/profile/edit" onClick={() => setMobileMore(false)}><Icon name="user" /> My profile</Link><Link to="/premium" onClick={() => setMobileMore(false)}><Icon name="star" /> Premium</Link><Link to="/settings" onClick={() => setMobileMore(false)}><Icon name="settings" /> Settings</Link><Link to="/help" onClick={() => setMobileMore(false)}><Icon name="help" /> Help & support</Link>{isStaff && <Link to={adminHome} onClick={() => setMobileMore(false)}><Icon name="shield" /> Admin panel</Link>}<button type="button" onClick={signOut}><Icon name="logout" /> Log out</button></div>}
    </div>
  );
}

export function RequireMember({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();
  if (authLoading) return <PageSpinner label="Checking your account" />;
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <AppShell>{children}</AppShell>;
}

export function PublicPage({ children, className = "" }) {
  return <div className={`public-page ${className}`}><PublicHeader />{children}<PublicFooter /></div>;
}
