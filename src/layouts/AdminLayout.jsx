import { useState, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  CalendarClock,
  Bookmark,
  Users,
  UserSearch,
  Activity,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import { request } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';
import { Logo } from '../components/Logo.jsx';
import { SiteHeader, MenuButton } from '../components/SiteHeader.jsx';
import { AppFooter } from '../components/SiteFooter.jsx';
import { NotificationBell } from '../components/NotificationBell.jsx';
import { NavDrawer, AccountMenu, RailNavLink } from '../components/NavDrawer.jsx';
import { ROLES, ROLE_LABELS } from '../lib/roles.js';

/**
 * Navigation by role. Everyone gets the hiring pages; Team and Activity are
 * where the hierarchy shows — a recruiter still sees their own activity, but
 * has no team to manage.
 */
const linksFor = (role) => {
  const base = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/admin/interviews', label: 'Interviews', icon: CalendarClock },
    { to: '/admin/talent-pool', label: 'Talent pool', icon: Bookmark },
  ];

  if (role === ROLES.ADMIN || role === ROLES.PRINCIPAL) {
    // Candidates sits above Team: it is a hiring tool, not staff admin.
    base.push({ to: '/admin/candidates', label: 'Candidates', icon: UserSearch });
    base.push({ to: '/admin/team', label: 'Team', icon: Users });
  }

  base.push({
    to: '/admin/activity',
    label: role === ROLES.RECRUITER ? 'My activity' : 'Activity log',
    icon: Activity,
  });

  return base;
};

const Navigation = ({ links, onNavigate, group = 'rail', stagger = false }) => (
  <nav aria-label="Staff" className="space-y-0.5">
    {links.map((link, index) => (
      <RailNavLink
        key={link.to}
        to={link.to}
        end={link.end}
        icon={link.icon}
        onClick={onNavigate}
        group={group}
        index={stagger ? index : undefined}
      >
        {link.label}
      </RailNavLink>
    ))}
  </nav>
);

/**
 * The staff shell. HR lives here for hours at a stretch, so on a desktop the
 * navigation is always in view: a fixed 240px rail under the plum bar, per
 * ui.md. Below 1024px the rail folds into the same slide-in drawer the
 * candidate side uses.
 */
export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // The badge also shows on the narrow-screen menu button, so the count is
  // read here as well as inside the bell. Same query key — one request.
  const { data: notifications } = useQuery({
    queryKey: ['notifications', { page: 1, limit: 8 }],
    queryFn: () => request(endpoints.notifications.list, { page: 1, limit: 8 }),
    refetchInterval: 60000,
    staleTime: 30000,
  });
  const unreadCount = notifications?.unreadCount ?? 0;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const links = linksFor(user?.role);
  const roleLabel = ROLE_LABELS[user?.role] ?? 'Staff';

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader innerClassName="px-4 sm:px-6">
        <Link to="/admin" aria-label="Staff dashboard" className="group/logo rounded-control">
          <Logo onDark />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Gold type is only legal on deep purple, so the chip carries an
              explicit plum-900 fill rather than a translucent white one. */}
          <span className="mr-1 hidden rounded-full border border-gold-500/40 bg-plum-900 px-2.5 py-0.5 text-meta font-semibold text-gold-500 sm:inline">
            {roleLabel}
          </span>

          <div className="hidden lg:block">
            <NotificationBell onDark />
          </div>

          <div className="hidden lg:block">
            <AccountMenu name={user?.name} detail={user?.email} onSignOut={handleLogout} />
          </div>

          <MenuButton
            onClick={() => setDrawerOpen(true)}
            expanded={drawerOpen}
            unreadCount={unreadCount}
            className="lg:hidden"
          />
        </div>
      </SiteHeader>

      <div className="flex flex-1">
        {/* The rail: sticky under the bar, its own scroll if the list grows. */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-line bg-field/80 backdrop-blur lg:flex">
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
            <Navigation links={links} />
          </div>
          <div className="flex items-center gap-3 border-t border-line px-4 py-4">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-plum-900 text-meta font-semibold text-gold-500"
            >
              {(user?.name ?? '?')
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('')}
            </span>
            <div className="min-w-0">
              <p className="truncate text-ui font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-meta text-ink-soft">{roleLabel}</p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {/* Keyed by path so the short settle plays on navigation only. */}
            <div key={pathname} className="page-enter">
              <Outlet />
            </div>
          </main>

          <AppFooter
            email={user?.email}
            innerClassName="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8"
          />
        </div>
      </div>

      <NavDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={user?.name}
        subtitle={roleLabel}
        onSignOut={handleLogout}
      >
        <Navigation links={links} onNavigate={closeDrawer} group="staff-drawer" stagger />
        <div className="my-3 border-t border-line" />
        <NotificationBell variant="menu" onNavigate={closeDrawer} />
      </NavDrawer>
    </div>
  );
};
