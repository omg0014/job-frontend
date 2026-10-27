import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Star } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';
import { Card, Button } from './ui.jsx';
import { Field, Input, Select, Textarea } from './form.jsx';
import { Spinner } from './Loading.jsx';
import { OutcomeBadge } from './StatusBadge.jsx';
import { formatDateTime, toDateTimeLocal } from '../lib/format.js';
import { clsx } from '../lib/clsx.js';

const scheduleSchema = z.object({
  scheduledAt: z.string().min(1, 'Pick a date and time'),
  mode: z.enum(['online', 'offline']),
  locationOrLink: z.string().trim().min(1, 'Add a meeting link or an address'),
  interviewerName: z.string().trim().max(120).default(''),
});

/** 1–5 rating, stored on the interview alongside the notes. */
const RatingInput = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star === value ? null : star)}
        className="rounded p-0.5 transition-transform duration-micro ease-out-soft hover:scale-110 hover:bg-paper active:scale-95"
        aria-label={`Rate ${star} out of 5`}
        aria-pressed={Boolean(value && star <= value)}
      >
        <Star
          className={clsx(
            'h-5 w-5',
            value && star <= value ? 'fill-gold-500 text-gold-500' : 'text-line',
          )}
          aria-hidden="true"
        />
      </button>
    ))}
    {value ? <span className="ml-1 text-meta text-ink-soft">{value} / 5</span> : null}
  </div>
);

export const InterviewPanel = ({ applicationId, interview }) => {
  const queryClient = useQueryClient();
  // `editing` starts true only when there is no interview yet. The component is
  // remounted via a key on `interview?._id` by the parent, so these initial
  // values are re-read whenever an interview is created or replaced.
  const [editing, setEditing] = useState(!interview);
  const [notes, setNotes] = useState(interview?.notes ?? '');
  const [rating, setRating] = useState(interview?.rating ?? null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      scheduledAt: toDateTimeLocal(interview?.scheduledAt) || '',
      mode: interview?.mode ?? 'offline',
      locationOrLink: interview?.locationOrLink ?? '',
      interviewerName: interview?.interviewerName ?? '',
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    queryClient.invalidateQueries({ queryKey: ['interviews'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['applications'] });
  };

  const schedule = useMutation({
    mutationFn: (values) =>
      request(endpoints.interviews.create, {
        applicationId,
        ...values,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
      }),
    onSuccess: () => {
      invalidate();
      setEditing(false);
      toast.success('Interview scheduled and the candidate has been notified');
    },
    onError: (error) => toast.error(error.message),
  });

  const saveFeedback = useMutation({
    mutationFn: (values) =>
      request(endpoints.interviews.update, { interviewId: interview._id, ...values }),
    onSuccess: () => {
      invalidate();
      toast.success('Interview notes saved');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-serif text-body font-semibold text-ink">
          <CalendarClock className="h-4 w-4 text-plum-500" aria-hidden="true" />
          Interview
        </h2>
        {interview && !editing ? (
          <div className="flex items-center gap-2">
            <OutcomeBadge outcome={interview.outcome} />
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Reschedule
            </Button>
          </div>
        ) : null}
      </div>

      {editing || !interview ? (
        <form
          onSubmit={handleSubmit((values) => schedule.mutate(values))}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Date and time"
              htmlFor="scheduledAt"
              required
              error={errors.scheduledAt?.message}
            >
              <Input
                id="scheduledAt"
                type="datetime-local"
                error={errors.scheduledAt}
                {...register('scheduledAt')}
              />
            </Field>

            <Field label="Mode" htmlFor="mode">
              <Select id="mode" {...register('mode')}>
                <option value="offline">In person</option>
                <option value="online">Online</option>
              </Select>
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Meeting link or venue"
                htmlFor="locationOrLink"
                required
                error={errors.locationOrLink?.message}
              >
                <Input
                  id="locationOrLink"
                  placeholder="https://meet.google.com/… or the school address"
                  error={errors.locationOrLink}
                  {...register('locationOrLink')}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Interviewer" htmlFor="interviewerName">
                <Input
                  id="interviewerName"
                  placeholder="Mrs. Latha Raman (Principal)"
                  {...register('interviewerName')}
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            {interview ? (
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={schedule.isPending}>
              {schedule.isPending ? <Spinner /> : null}
              {interview ? 'Reschedule' : 'Schedule interview'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-control bg-plum-50 p-3.5 ring-1 ring-inset ring-plum-200">
            <p className="text-ui font-semibold text-plum-900">
              {formatDateTime(interview.scheduledAt)}
            </p>
            <p className="mt-1 break-words text-ui text-plum-800">
              {interview.mode === 'online' ? 'Online · ' : 'In person · '}
              {interview.locationOrLink}
            </p>
            {interview.interviewerName ? (
              <p className="mt-1 text-meta text-plum-600">With {interview.interviewerName}</p>
            ) : null}
          </div>

          <Field label="Rating">
            <RatingInput value={rating} onChange={setRating} />
          </Field>

          <Field label="Interview notes" htmlFor="interview-notes">
            <Textarea
              id="interview-notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Subject knowledge, classroom approach, communication…"
            />
          </Field>

          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
            <Field label="Outcome" htmlFor="interview-outcome">
              <Select
                id="interview-outcome"
                value={interview.outcome}
                onChange={(event) =>
                  saveFeedback.mutate({ notes, rating, outcome: event.target.value })
                }
              >
                <option value="pending">Pending</option>
                <option value="passed">Passed</option>
                <option value="failed">Did not pass</option>
              </Select>
            </Field>

            <Button
              onClick={() => saveFeedback.mutate({ notes, rating })}
              disabled={saveFeedback.isPending}
            >
              {saveFeedback.isPending ? <Spinner /> : null}
              Save notes
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
