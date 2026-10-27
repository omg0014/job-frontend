import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { UserPlus, Search, Users, ShieldCheck, ShieldOff, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import {
  Card,
  Button,
  Badge,
  Toolbar,
  PageHeader,
  EmptyState,
  ErrorState,
  Pagination,
} from '../../components/ui.jsx';
import { TableSkeleton } from '../../components/Loading.jsx';
import { Field, Input, Select } from '../../components/form.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { StaffDetailPanel } from './StaffDetailPanel.jsx';
import { AppointDialog } from './AppointDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDebounced } from '../../hooks/useDebounced.js';
import { ROLES, ROLE_LABELS, ROLE_BADGES, appointableBy } from '../../lib/roles.js';
import { formatRelative } from '../../lib/format.js';
import { clsx } from '../../lib/clsx.js';
import { initialsOf } from '../../components/NavDrawer.jsx';

/** The divided-list surface from ui.jsx, as a plain class so auto-animate can hold the ref. */
const LIST_CLASS = 'divide-y divide-line overflow-hidden rounded-card border border-line/80 bg-field shadow-card';

export const TeamPage = () => {
  // One line: rows reposition smoothly on filter instead of jumping.
  const [listRef] = useAutoAnimate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [openStaffId, setOpenStaffId] = useState(null);
  const [appointOpen, setAppointOpen] = useState(false);
  const [pendingSuspend, setPendingSuspend] = useState(null);

  const debouncedSearch = useDebounced(search, 400);
  const filters = {
    page,
    limit: 20,
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['team', filters],
    queryFn: () => request(endpoints.team.list, filters),
    placeholderData: keepPreviousData,
  });

  const setActive = useMutation({
    mutationFn: (body) => request(endpoints.team.setActive, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setPendingSuspend(null);
      toast.success(variables.isActive ? 'Access restored' : 'Access suspended');
    },
    onError: (mutationError) => {
      setPendingSuspend(null);
      toast.error(mutationError.message);
    },
  });

  const canAppoint = appointableBy(user?.role).length > 0;
  const members = data?.items ?? [];

  const description =
    user?.role === ROLES.ADMIN
      ? 'Everyone with staff access, and what they have been doing.'
      : user?.role === ROLES.PRINCIPAL
        ? 'The recruiters you appointed, and their activity.'
        : 'Your account and activity.';

  return (
    <div>
      <PageHeader
        title="Team"
        description={description}
        actions={
          canAppoint ? (
            <Button onClick={() => setAppointOpen(true)}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Appoint {user?.role === ROLES.ADMIN ? 'staff' : 'recruiter'}
            </Button>
          ) : null
        }
      />

      <Toolbar className="sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Field label="Search" htmlFor="team-search">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/70"
              aria-hidden="true"
            />
            <Input
              id="team-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name, email, department…"
              className="pl-9"
            />
          </div>
        </Field>

        <Field label="Role" htmlFor="team-role">
          <Select
            id="team-role"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            <option value={ROLES.ADMIN}>Administrators</option>
            <option value={ROLES.PRINCIPAL}>Principals</option>
            <option value={ROLES.RECRUITER}>Recruiters</option>
          </Select>
        </Field>
      </Toolbar>

      {isLoading ? (
        <Card className="p-4 sm:p-5">
          <TableSkeleton rows={5} />
        </Card>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff found"
          description={
            canAppoint
              ? 'Appoint someone to give them access to the portal.'
              : 'Nobody has been appointed under you yet.'
          }
          action={
            canAppoint ? (
              <Button size="sm" onClick={() => setAppointOpen(true)}>
                Appoint {user?.role === ROLES.ADMIN ? 'a principal' : 'a recruiter'}
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <ul ref={listRef} className={LIST_CLASS}>
            {members.map((member) => {
              const isSelf = member.id === user?.id;
              const stats = [
                { label: 'Jobs posted', value: member.activity?.jobsPosted ?? 0 },
                { label: 'Open now', value: member.jobs?.open ?? 0 },
                { label: 'Applicants moved', value: member.activity?.applicationsReviewed ?? 0 },
                { label: 'Interviews set', value: member.activity?.interviewsScheduled ?? 0 },
              ];

              return (
                <li
                  key={member.id}
                  className={clsx(
                    'grid gap-x-6 gap-y-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_340px_210px] lg:items-center',
                    !member.isActive && 'bg-paper/60',
                  )}
                >
                  {/* Who: the whole block opens their activity panel. */}
                  <button
                    type="button"
                    onClick={() => setOpenStaffId(member.id)}
                    className="group flex min-w-0 items-start gap-3 rounded-control text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={clsx(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-meta font-semibold',
                        member.isActive ? 'bg-plum-50 text-plum-800' : 'bg-line/70 text-ink-soft',
                      )}
                    >
                      {initialsOf(member.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-ui font-semibold text-ink transition-colors duration-micro group-hover:text-plum-700">
                          {member.name}
                          {isSelf ? <span className="font-normal text-ink-soft"> (you)</span> : null}
                        </span>
                        <Badge className={ROLE_BADGES[member.role]}>{ROLE_LABELS[member.role]}</Badge>
                        {!member.isActive ? (
                          <Badge className="bg-status-rejected text-status-rejected-ink">Suspended</Badge>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-meta text-ink-soft">
                        {member.email}
                        {member.department ? ` · ${member.department}` : ''}
                      </span>
                      <span className="mt-0.5 block text-meta text-ink-soft/80">
                        {member.lastLoginAt
                          ? `Last signed in ${formatRelative(member.lastLoginAt)}`
                          : 'Has not signed in yet'}
                        {member.activity?.logins
                          ? ` · ${member.activity.logins} sign-in${member.activity.logins === 1 ? '' : 's'}`
                          : ''}
                      </span>
                    </span>
                  </button>

                  {/* How much: four counters, compact and aligned. */}
                  <dl className="grid grid-cols-4 gap-2 pl-[52px] lg:pl-0">
                    {stats.map((stat) => (
                      // Label first in the markup for screen readers, figure
                      // first on screen for scanning.
                      <div key={stat.label} className="flex min-w-0 flex-col-reverse justify-end">
                        <dt className="mt-1 text-[11px] leading-tight text-ink-soft">{stat.label}</dt>
                        <dd data-stat className="text-heading leading-none text-ink">
                          {stat.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Actions: quiet until wanted. */}
                  <div className="flex items-center gap-1 pl-[52px] lg:justify-end lg:pl-0">
                    {!isSelf ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={member.isActive ? 'hover:!bg-status-rejected hover:!text-status-rejected-ink' : ''}
                        onClick={() =>
                          member.isActive
                            ? setPendingSuspend(member)
                            : setActive.mutate({ userId: member.id, isActive: true })
                        }
                      >
                        {member.isActive ? (
                          <>
                            <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Restore
                          </>
                        )}
                      </Button>
                    ) : null}
                    <Button variant="secondary" size="sm" onClick={() => setOpenStaffId(member.id)}>
                      Activity
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onChange={setPage}
          />
        </>
      )}

      {appointOpen ? <AppointDialog onClose={() => setAppointOpen(false)} /> : null}

      {openStaffId ? (
        <StaffDetailPanel staffId={openStaffId} onClose={() => setOpenStaffId(null)} />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingSuspend)}
        title="Suspend this account?"
        message={`${pendingSuspend?.name} will lose access to the portal immediately. Their jobs and activity history are kept.`}
        confirmLabel="Suspend access"
        destructive
        loading={setActive.isPending}
        onCancel={() => setPendingSuspend(null)}
        onConfirm={() => setActive.mutate({ userId: pendingSuspend.id, isActive: false })}
      />
    </div>
  );
};
