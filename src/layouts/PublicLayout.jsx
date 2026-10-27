import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo } from '../components/Logo.jsx';
import { SiteHeader, BarNavLink } from '../components/SiteHeader.jsx';
import { PublicFooter } from '../components/SiteFooter.jsx';
import { ButtonLink } from '../components/ui.jsx';
import { isStaff } from '../lib/roles.js';

export const PublicLayout = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const home = user ? (isStaff(user.role) ? '/admin' : '/dashboard') : null;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Deep purple bar with gold type — the pairing at its best. */}
      <SiteHeader innerClassName="mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          to="/"
          aria-label="Yugam International School Job Portal, home"
          className="group/logo rounded-control"
        >
          <Logo onDark />
        </Link>

        <nav aria-label="Main" className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          <BarNavLink to="/jobs" group="public" className="px-2 sm:px-3">
            Open roles
          </BarNavLink>

          {user ? (
            <ButtonLink to={home} size="sm" className="ml-2">
              {isStaff(user.role) ? 'Staff area' : 'My dashboard'}
            </ButtonLink>
          ) : (
            <>
              {/* Below `xs` the text link is dropped — the button still
                  reaches the same flow, and three items will not fit. */}
              <BarNavLink to="/login" group="public" className="hidden px-2 xs:inline-block sm:px-3">
                Sign in
              </BarNavLink>
              <ButtonLink to="/register" size="sm" className="ml-1 sm:ml-2">
                {/* The label shortens below `xs` so the three nav items
                    still fit the spec's 360px floor. */}
                <span className="hidden xs:inline">Create account</span>
                <span className="xs:hidden">Sign up</span>
              </ButtonLink>
            </>
          )}
        </nav>
      </SiteHeader>

      <main className="flex-1">
        {/* Keyed by path so the short settle plays on navigation only. */}
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <PublicFooter
        columns={[
          {
            title: 'Explore',
            links: [
              { to: '/', label: 'Home' },
              { to: '/jobs', label: 'Open roles' },
            ],
          },
          {
            title: 'Your account',
            links: user
              ? [{ to: home, label: isStaff(user.role) ? 'Staff area' : 'My dashboard' }]
              : [
                  { to: '/login', label: 'Sign in' },
                  { to: '/register', label: 'Create account' },
                ],
          },
        ]}
      />
    </div>
  );
};
