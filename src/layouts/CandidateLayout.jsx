import { useState, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import { request } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';
import { Logo } from '../components/Logo.jsx';
import { SiteHeader, BarNavLink, MenuButton } from '../components/SiteHeader.jsx';
import { AppFooter } from '../components/SiteFooter.jsx';
import { NotificationBell } from '../components/NotificationBell.jsx';
import { NavDrawer, AccountMenu, AccountMenuLink, RailNavLink } from '../components/NavDrawer.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Browse jobs', icon: Briefcase },
  { to: '/applications', label: 'My applications', icon: FileText },
  { to: '/profile', label: 'My profile', icon: User },
];

export const CandidateLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // The badge also sits on the phone menu button, so the count is read here
  // as well as inside the bell. Same query key — one request.
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

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader innerClassName="mx-auto max-w-6xl px-4 sm:px-6">
        <Link to="/dashboard" aria-label="Dashboard" className="group/logo rounded-control">
          <Logo onDark />
        </Link>

        {/* Desktop: the four destinations sit in the bar, always one click
            away, with one gold marker that glides to the current page. */}
        <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
          {links.map((link) => (
            <BarNavLink key={link.to} to={link.to} end={link.to === '/jobs'} group="candidate">
              {link.label}
            </BarNavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden md:block">
            <NotificationBell onDark />
          </div>
          <div className="hidden md:block">
            <AccountMenu name={user?.name} detail={user?.email} onSignOut={handleLogout}>
              <AccountMenuLink as={Link} to="/profile" icon={User}>
                My profile
              </AccountMenuLink>
            </AccountMenu>
          </div>

          <MenuButton
            onClick={() => setMenuOpen(true)}
            expanded={menuOpen}
            unreadCount={unreadCount}
            className="md:hidden"
          />
        </div>
      </SiteHeader>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* Keyed by path so the short settle plays on navigation only. */}
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <AppFooter
        email={user?.email}
        links={links.map(({ to, label }) => ({ to, label }))}
        innerClassName="mx-auto max-w-6xl px-4 sm:px-6"
      />

      <NavDrawer
        open={menuOpen}
        onClose={closeMenu}
        title={user?.name}
        subtitle={user?.email}
        onSignOut={handleLogout}
      >
        <nav aria-label="Main" className="space-y-0.5">
          {links.map((link, index) => (
            <RailNavLink
              key={link.to}
              to={link.to}
              end={link.to === '/jobs'}
              icon={link.icon}
              onClick={closeMenu}
              group="candidate-drawer"
              index={index}
            >
              {link.label}
            </RailNavLink>
          ))}
        </nav>
        <div className="my-3 border-t border-line" />
        <NotificationBell variant="menu" onNavigate={closeMenu} />
      </NavDrawer>
    </div>
  );
};
