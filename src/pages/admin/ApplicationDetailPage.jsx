import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Bookmark,
  BookmarkCheck,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Button, Badge, ErrorState, PageHeader, BackLink } from '../../components/ui.jsx';
import { FullPageSpinner, Spinner } from '../../components/Loading.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { CvViewer } from '../../components/CvViewer.jsx';
import { InterviewPanel } from '../../components/InterviewPanel.jsx';
import { ScreeningReview } from './ScreeningReview.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { Textarea, Field, Input } from '../../components/form.jsx';
import { APPLICATION_STATUS } from '../../lib/constants.js';
import { formatDate, formatDateTime } from '../../lib/format.js';

/** Status actions offered at each stage, in the order HR would use them. */
const NEXT_ACTIONS = {
  applied: ['under_review', 'shortlisted', 'rejected'],
  under_review: ['shortlisted', 'rejected'],
  shortlisted: ['interview_scheduled', 'selected', 'rejected'],
  interview_scheduled: ['selected', 'rejected'],
  selected: ['rejected'],
  rejected: ['under_review'],
};

/** A titled card on the profile side — one heading style for every block. */
const Section = ({ title, icon: Icon, children }) => (
  <Card className="p-5">
    <h2 className="mb-4 flex items-center gap-2 font-serif text-body font-semibold text-ink">
      {Icon ? <Icon className="h-4 w-4 text-plum-500" aria-hidden="true" /> : null}
      {title}
    </h2>
    {children}
  </Card>
);

const TagGroup = ({ label, children }) => (
  <div>
    <h3 className="mb-2 font-sans text-meta font-medium text-ink-soft">{label}</h3>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
);

/** Roles and degrees as a quiet vertical timeline: a hairline with a dot per entry. */
const Timeline = ({ children }) => (
  <ol className="relative space-y-5 before:absolute before:bottom-1 before:left-[3px] before:top-2 before:w-px before:bg-line">
    {children}
  </ol>
);

const TimelineItem = ({ children }) => (
  <li className="relative pl-6">
    <span
      aria-hidden="true"
      className="absolute left-0 top-[7px] h-[7px] w-[7px] rounded-full border border-plum-300 bg-card"
    />
    {children}
  </li>
);

export const ApplicationDetailPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [pendingStatus, setPendingStatus] = useState(null);
  const [poolNote, setPoolNote] = useState('');
  const [showPoolForm, setShowPoolForm] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['application', id],
    queryFn: () => request(endpoints.applications.get, { applicationId: id }),
  });

  const updateStatus = useMutation({
    mutationFn: (body) => request(endpoints.applications.updateStatus, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setNote('');
      setPendingStatus(null);
      toast.success(
        `Marked as ${APPLICATION_STATUS[variables.status]?.label ?? variables.status}. The candidate has been notified.`,
      );
    },
    onError: (mutationError) => {
      setPendingStatus(null);
      toast.error(mutationError.message);
    },
  });

  const addToPool = useMutation({
    mutationFn: (body) => request(endpoints.talentPool.add, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pool'] });
      setShowPoolForm(false);
      setPoolNote('');
      toast.success('Saved to the talent pool');
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;

  const { application, profile, interview } = data;
  const snapshot = application.profileSnapshot ?? {};
  const job = application.jobId;

  const handleStatusClick = (status) => {
    // Rejection is the one status worth a confirmation step.
    if (status === 'rejected') {
      setPendingStatus(status);
      return;
    }
    updateStatus.mutate({ applicationId: id, status, note });
  };

  const nextActions = NEXT_ACTIONS[application.status] ?? [];

  return (
    <div>
      <PageHeader
        dense
        back={
          <BackLink to={job ? `/admin/jobs/${job._id}/applicants` : '/admin/jobs'}>
            Back to applicants
          </BackLink>
        }
        title={snapshot.fullName || 'Candidate'}
        description={
          <>
            Applied for <span className="font-semibold text-ink">{job?.title ?? 'a role'}</span>{' '}
            on <span className="tabular">{formatDate(application.appliedAt)}</span>
          </>
        }
        actions={<StatusBadge status={application.status} className="text-ui" />}
      />

      {/* Split layout: structured profile on the left, original CV on the right. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
        <div className="space-y-4">
          <Section title="Contact">
            <dl className="grid gap-x-6 gap-y-2.5 text-ui sm:grid-cols-2">
              {snapshot.email ? (
                <div className="flex min-w-0 items-center gap-2.5">
                  <dt className="sr-only">Email</dt>
                  <Mail className="h-4 w-4 shrink-0 text-ink-soft/70" aria-hidden="true" />
                  <dd className="min-w-0 truncate">
                    <a
                      href={`mailto:${snapshot.email}`}
                      className="text-plum-600 underline-offset-4 hover:text-plum-800 hover:underline"
                    >
                      {snapshot.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {snapshot.phone ? (
                <div className="flex items-center gap-2.5">
                  <dt className="sr-only">Phone</dt>
                  <Phone className="h-4 w-4 shrink-0 text-ink-soft/70" aria-hidden="true" />
                  <dd>
                    <a
                      href={`tel:${snapshot.phone}`}
                      className="tabular text-plum-600 underline-offset-4 hover:text-plum-800 hover:underline"
                    >
                      {snapshot.phone}
                    </a>
                  </dd>
                </div>
              ) : null}
              {snapshot.location ? (
                <div className="flex items-center gap-2.5">
                  <dt className="sr-only">Location</dt>
                  <MapPin className="h-4 w-4 shrink-0 text-ink-soft/70" aria-hidden="true" />
                  <dd className="text-ink">{snapshot.location}</dd>
                </div>
              ) : null}
              <div className="flex items-center gap-2.5">
                <dt className="sr-only">Experience</dt>
                <Briefcase className="h-4 w-4 shrink-0 text-ink-soft/70" aria-hidden="true" />
                <dd className="tabular text-ink">
                  {snapshot.totalExperienceYears ?? 0} years of experience
                </dd>
              </div>
            </dl>

            {snapshot.headline ? (
              <p className="mt-4 border-t border-line pt-4 text-ui text-ink">
                {snapshot.headline}
              </p>
            ) : null}
          </Section>

          {snapshot.subjects?.length > 0 || snapshot.skills?.length > 0 ? (
            <Section title="Qualifications">
              <div className="space-y-4">
                {snapshot.subjects?.length > 0 ? (
                  <TagGroup label="Subjects">
                    {snapshot.subjects.map((subject) => (
                      <Badge key={subject} className="bg-plum-50 text-plum-800">
                        {subject}
                      </Badge>
                    ))}
                  </TagGroup>
                ) : null}

                {snapshot.skills?.length > 0 ? (
                  <TagGroup label="Skills">
                    {snapshot.skills.map((skill) => (
                      <Badge key={skill} className="border border-line bg-paper text-ink">
                        {skill}
                      </Badge>
                    ))}
                  </TagGroup>
                ) : null}

                {snapshot.certifications?.length > 0 ? (
                  <TagGroup label="Certifications">
                    {snapshot.certifications.map((certification) => (
                      <Badge
                        key={certification}
                        className="bg-status-selected text-status-selected-ink"
                      >
                        {certification}
                      </Badge>
                    ))}
                  </TagGroup>
                ) : null}

                {snapshot.languages?.length > 0 ? (
                  <TagGroup label="Languages">
                    <p className="text-ui text-ink">{snapshot.languages.join(', ')}</p>
                  </TagGroup>
                ) : null}
              </div>
            </Section>
          ) : null}

          {snapshot.experience?.length > 0 ? (
            <Section title="Experience" icon={Briefcase}>
              <Timeline>
                {snapshot.experience.map((role, index) => (
                  // eslint-disable-next-line react/no-array-index-key -- snapshot is immutable
                  <TimelineItem key={index}>
                    <p className="text-ui font-semibold text-ink">
                      {role.designation || 'Role'}
                    </p>
                    <p className="text-ui text-ink-soft">{role.organization}</p>
                    <p className="tabular mt-0.5 text-meta text-ink-soft">
                      {role.startDate}
                      {role.startDate || role.endDate || role.isCurrent ? ' – ' : ''}
                      {role.isCurrent ? 'Present' : role.endDate}
                    </p>
                    {role.subjectsTaught?.length > 0 ? (
                      <p className="mt-1 text-meta text-ink-soft">
                        Taught: {role.subjectsTaught.join(', ')}
                      </p>
                    ) : null}
                    {role.description ? (
                      <p className="mt-1.5 text-ui text-ink-soft">{role.description}</p>
                    ) : null}
                  </TimelineItem>
                ))}
              </Timeline>
            </Section>
          ) : null}

          {snapshot.education?.length > 0 ? (
            <Section title="Education" icon={GraduationCap}>
              <Timeline>
                {snapshot.education.map((entry, index) => (
                  // eslint-disable-next-line react/no-array-index-key -- snapshot is immutable
                  <TimelineItem key={index}>
                    <p className="text-ui font-semibold text-ink">
                      {entry.degree}
                      {entry.specialization ? ` · ${entry.specialization}` : ''}
                    </p>
                    <p className="text-ui text-ink-soft">
                      {entry.institution}
                      {entry.boardOrUniversity && entry.boardOrUniversity !== entry.institution
                        ? `, ${entry.boardOrUniversity}`
                        : ''}
                    </p>
                    <p className="tabular mt-0.5 text-meta text-ink-soft">
                      {entry.yearOfPassing}
                      {entry.percentageOrCgpa ? ` · ${entry.percentageOrCgpa}` : ''}
                    </p>
                  </TimelineItem>
                ))}
              </Timeline>
            </Section>
          ) : null}

          {application.statusHistory?.length > 0 ? (
            <Section title="History" icon={History}>
              <ol className="divide-y divide-line">
                {[...application.statusHistory].reverse().map((entry, index) => (
                  // eslint-disable-next-line react/no-array-index-key -- history is append-only
                  <li key={index} className="py-2.5 text-ui first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="font-semibold text-ink">
                        {APPLICATION_STATUS[entry.status]?.label ?? entry.status}
                      </span>
                      <span className="tabular text-meta text-ink-soft">
                        {formatDateTime(entry.changedAt)}
                      </span>
                    </div>
                    {entry.note ? (
                      <p className="mt-0.5 text-meta italic text-ink-soft">{entry.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-24">
          <CvViewer applicationId={id} fileName={application.cvSnapshot?.originalName} />
        </div>
      </div>

      {/* The screening round, once the candidate has been invited to one.
          Summary-style details sit at the top of it, video below. */}
      <section className="mt-10" aria-labelledby="screening-heading">
        <h2
          id="screening-heading"
          className="mb-3 font-serif text-heading font-semibold text-ink"
        >
          Video screening
        </h2>
        <ScreeningReview applicationId={id} />
      </section>

      <div className="mt-10 grid gap-4 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
        {/* Keyed so the panel remounts with fresh state once an interview
            is created, replacing the scheduling form with the feedback view. */}
        <InterviewPanel
          key={interview?._id ?? 'new'}
          applicationId={id}
          interview={interview}
        />

        <Section title="Talent pool" icon={Bookmark}>
          {showPoolForm ? (
            <div className="space-y-3">
              <Field label="Why keep this candidate on file?" htmlFor="pool-note">
                <Textarea
                  id="pool-note"
                  rows={3}
                  value={poolNote}
                  onChange={(event) => setPoolNote(event.target.value)}
                  placeholder="Strong primary candidate — consider for the next opening."
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowPoolForm(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={addToPool.isPending}
                  onClick={() =>
                    addToPool.mutate({
                      candidateId: application.candidateId?._id ?? application.candidateId,
                      tags: snapshot.subjects ?? [],
                      note: poolNote,
                    })
                  }
                >
                  {addToPool.isPending ? <Spinner /> : <BookmarkCheck className="h-3.5 w-3.5" />}
                  Save to pool
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-ui text-ink-soft">
                Keep this candidate on file for future openings, even if they are not selected
                for this role.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setShowPoolForm(true)}>
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                Save to talent pool
              </Button>
            </>
          )}
        </Section>
      </div>

      {/* Spacer so the fixed action bar never covers the last card. */}
      <div className="h-36 sm:h-28" aria-hidden="true" />

      {/* Action bar pinned to the viewport so status changes are always within
          reach. It starts beside the 240px rail on desktop, and its contents
          line up with the page column. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 shadow-[0_-4px_16px_-8px_rgb(36_31_46/0.12)] backdrop-blur-sm lg:left-60">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2.5 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-4 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <p className="hidden shrink-0 text-meta text-ink-soft sm:block">
              Now{' '}
              <span className="font-semibold text-ink">
                {APPLICATION_STATUS[application.status]?.label}
              </span>
            </p>
            <label htmlFor="status-note" className="sr-only">
              Note to include with this status change (optional)
            </label>
            <Input
              id="status-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional note — shared with the candidate"
              className="min-w-0 flex-1"
            />
          </div>

          <div className="flex gap-2">
            {nextActions.map((status) => (
              <Button
                key={status}
                size="md"
                variant={
                  status === 'rejected'
                    ? 'danger'
                    : status === 'selected'
                      ? 'primary'
                      : 'secondary'
                }
                className="min-w-0 flex-1 px-3 sm:flex-none sm:px-4"
                disabled={updateStatus.isPending}
                onClick={() => handleStatusClick(status)}
              >
                {updateStatus.isPending && updateStatus.variables?.status === status ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : null}
                {status === 'interview_scheduled' ? (
                  <>
                    {/* Shorter on a phone so every action fits on one row. */}
                    <span className="sm:hidden">Interview</span>
                    <span className="hidden sm:inline">Move to interview</span>
                  </>
                ) : (
                  APPLICATION_STATUS[status]?.label
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title="Reject this application?"
        message={`${snapshot.fullName || 'The candidate'} will be notified that their application was not taken forward.`}
        confirmLabel="Reject application"
        destructive
        loading={updateStatus.isPending}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() =>
          updateStatus.mutate({ applicationId: id, status: pendingStatus, note })
        }
      />
    </div>
  );
};
