import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Toolbar, PageHeader, EmptyState, ErrorState, Pagination } from '../../components/ui.jsx';
import { TableSkeleton } from '../../components/Loading.jsx';
import { ActivityFeed } from '../../components/ActivityFeed.jsx';
import { Field, Select, Input } from '../../components/form.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES, activityScopeLabel, ACTIVITY_CATEGORY_LABELS } from '../../lib/roles.js';

export const ActivityLogPage = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [page, setPage] = useState(1);

  // The people this viewer may filter by — the server enforces the same rule.
  const { data: team } = useQuery({
    queryKey: ['team', { page: 1, limit: 100 }],
    queryFn: () => request(endpoints.team.list, { page: 1, limit: 100 }),
  });

  const filters = {
    page,
    limit: 25,
    ...(category ? { category } : {}),
    ...(actorId ? { actorId } : {}),
    ...(from ? { from: new Date(from).toISOString() } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['activity', filters],
    queryFn: () => request(endpoints.team.activity, filters),
    placeholderData: keepPreviousData,
  });

  const entries = data?.items ?? [];
  const scopeNote =
    user?.role === ROLES.ADMIN
      ? 'Every action taken by principals and recruiters.'
      : user?.role === ROLES.PRINCIPAL
        ? 'Everything you and your recruiters have done.'
        : 'Everything you have done in the portal.';

  return (
    <div>
      <PageHeader title={activityScopeLabel(user?.role)} description={scopeNote} />

      <Toolbar className="sm:grid-cols-3">
        <Field label="Category" htmlFor="category">
          <Select
            id="category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All activity</option>
            {Object.entries(ACTIVITY_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        {user?.role !== ROLES.RECRUITER ? (
          <Field label="Person" htmlFor="actor">
            <Select
              id="actor"
              value={actorId}
              onChange={(event) => {
                setActorId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Everyone</option>
              {(team?.items ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.roleLabel})
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <Field label="Since" htmlFor="from">
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
        </Field>
      </Toolbar>

      {isLoading ? (
        <Card className="p-4 sm:p-5">
          <TableSkeleton rows={6} />
        </Card>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity recorded"
          description={
            category || actorId || from
              ? 'Try a different filter or a wider date range.'
              : 'Actions will appear here as your team uses the portal.'
          }
        />
      ) : (
        <>
          <ActivityFeed
            entries={entries}
            showActor={user?.role !== ROLES.RECRUITER}
            variant="grouped"
          />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
};
