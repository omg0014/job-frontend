import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Gauge, Star, Trash2, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Button, EmptyState } from '../../components/ui.jsx';
import { Skeleton } from '../../components/Loading.jsx';
import { clsx } from '../../lib/clsx.js';

const MEDIA_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050/api').replace(
  /\/api\/?$/,
  '',
);

const SPEEDS = [1, 1.25, 1.5, 2];

/** Card headings match the section cards on the application page. */
const CARD_TITLE = 'font-serif text-body font-semibold text-ink';
const SPEED_KEY = 'yugam.playbackRate';

/** Five stars, saving on change — never make someone navigate to record a view. */
export const RatingControl = ({ value, onChange, label }) => (
  <div className="flex items-center gap-1" role="group" aria-label={label}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n === value ? null : n)}
        aria-label={`${n} out of 5`}
        aria-pressed={n === value}
        className="rounded p-0.5 transition-transform duration-micro ease-out-soft hover:scale-110 active:scale-95"
      >
        <Star
          className={clsx(
            'h-4 w-4',
            value && n <= value ? 'fill-gold-700 text-gold-700' : 'text-line',
          )}
          aria-hidden="true"
        />
      </button>
    ))}
  </div>
);

/**
 * The reviewer's view of one screening.
 *
 * Text answers sit at the top because most decisions are made there, in
 * seconds, without a video ever loading.
 */
export const ScreeningReview = ({ applicationId }) => {
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(null);
  const [rate, setRate] = useState(() => {
    try {
      return Number(localStorage.getItem(SPEED_KEY)) || 1;
    } catch {
      return 1;
    }
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['screening-review', applicationId],
    queryFn: () => request(endpoints.screening.review, { applicationId }),
    retry: false,
  });

  const [draft, setDraft] = useState(null);
  const review = draft ?? data?.myReview ?? { ratings: [], overallRating: null, notes: '' };

  const save = useMutation({
    mutationFn: (payload) => request(endpoints.screening.saveReview, { applicationId, ...payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['screening-review', applicationId] }),
    onError: (err) => toast.error(err.message),
  });

  const playback = useMutation({
    mutationFn: (questionOrder) =>
      request(endpoints.screening.playbackUrl, { applicationId, questionOrder }),
    onSuccess: (result, questionOrder) => {
      setPlaying({ questionOrder, url: `${MEDIA_ORIGIN}${result.url}` });
    },
    onError: (err) => toast.error(err.message),
  });

  const invite = useMutation({
    mutationFn: () => request(endpoints.screening.invite, { applicationId }),
    onSuccess: () => {
      toast.success('Invitation sent');
      queryClient.invalidateQueries({ queryKey: ['screening-review', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
    onError: (err) => toast.error(err.message),
  });

  const removeRecordings = useMutation({
    mutationFn: () => request(endpoints.screening.deleteRecordings, { applicationId }),
    onSuccess: (result) => {
      toast.success(`Deleted ${result.removed} recording(s)`);
      queryClient.invalidateQueries({ queryKey: ['screening-review', applicationId] });
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-card" />;

  // Not yet invited. The invite is the action a reviewer wants here, so it is
  // offered in place rather than hidden behind the status dropdown.
  if (isError) {
    return (
      <EmptyState
        icon={Play}
        title="No screening round yet"
        description="Invite this candidate to record five short video answers and a few details about their current role."
        action={
          <Button onClick={() => invite.mutate()} disabled={invite.isPending}>
            {invite.isPending ? 'Inviting…' : 'Invite to video screening'}
          </Button>
        }
      />
    );
  }

  const { screening, questions, textFields, otherReviews } = data;
  const ratingFor = (order) =>
    review.ratings?.find((item) => item.questionOrder === order)?.rating ?? null;

  const setRating = (order, rating) => {
    const others = (review.ratings ?? []).filter((item) => item.questionOrder !== order);
    const next = {
      ...review,
      ratings: rating ? [...others, { questionOrder: order, rating }] : others,
    };
    setDraft(next);
    save.mutate({ ratings: next.ratings, overallRating: next.overallRating, notes: next.notes });
  };

  const applyRate = (value) => {
    setRate(value);
    try {
      localStorage.setItem(SPEED_KEY, String(value));
    } catch {
      // Speed preference is a convenience, not state worth failing over.
    }
    if (videoRef.current) videoRef.current.playbackRate = value;
  };

  return (
    <div className="space-y-4">
      {/* Text answers first: the principal filters here before any video. */}
      <Card className="p-5">
        <h3 className={CARD_TITLE}>Their details</h3>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {textFields.map((field) => {
            const value = screening.textAnswers?.[field.key];
            const display = Array.isArray(value) ? value.join(', ') : value;
            if (display === undefined || display === '') return null;
            return (
              <div key={field.key} className="min-w-0">
                <dt className="text-meta font-medium text-ink-soft">{field.label}</dt>
                <dd className="mt-0.5 text-ui font-semibold text-ink">{String(display)}</dd>
              </div>
            );
          })}
        </dl>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <h3 className={CARD_TITLE}>Recorded answers</h3>
            <div
              className="flex items-center gap-0.5 rounded-control border border-line bg-field p-0.5"
              role="group"
              aria-label="Playback speed"
            >
              <Gauge className="mx-1 h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
              {SPEEDS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => applyRate(speed)}
                  aria-pressed={rate === speed}
                  className={clsx(
                    'tabular rounded-[4px] px-2 py-0.5 text-meta font-semibold transition-colors duration-micro',
                    rate === speed ? 'bg-plum-50 text-plum-800' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <ul className="divide-y divide-line">
            {questions.map((question) => {
              const answer = screening.answers?.find((a) => a.questionOrder === question.order);
              const isPlaying = playing?.questionOrder === question.order;
              return (
                <li
                  key={question.order}
                  className={clsx('px-5 py-4 transition-colors duration-base', isPlaying && 'bg-plum-50/40')}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <p className="min-w-0 text-ui text-ink">
                      <span className="tabular mr-1 font-semibold text-plum-700">{question.order}.</span>{' '}
                      {question.text}
                    </p>
                    <RatingControl
                      value={ratingFor(question.order)}
                      onChange={(value) => setRating(question.order, value)}
                      label={`Rate answer ${question.order}`}
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-3">
                    {answer?.storageKey ? (
                      <Button size="sm" variant="secondary" onClick={() => playback.mutate(question.order)}>
                        <Play className="h-3.5 w-3.5" aria-hidden="true" />
                        Play
                      </Button>
                    ) : (
                      <span className="text-meta text-ink-soft">No recording</span>
                    )}
                    {answer ? (
                      <span className="tabular text-meta text-ink-soft">
                        {answer.durationSeconds}s
                        {answer.retakeCount > 0 ? ' · retaken' : ''}
                      </span>
                    ) : null}
                    {answer?.isAudioOnly ? (
                      <span className="flex items-center gap-1 text-meta text-ink-soft">
                        <MicOff className="h-3 w-3" aria-hidden="true" />
                        Audio only
                      </span>
                    ) : null}
                  </div>

                  {isPlaying ? (
                    <video
                      ref={videoRef}
                      src={playing.url}
                      controls
                      autoPlay
                      onLoadedMetadata={(event) => {
                        event.currentTarget.playbackRate = rate;
                      }}
                      className="fade-in mt-3 w-full rounded-card bg-plum-900"
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 lg:sticky lg:top-24">
          <h3 className={CARD_TITLE}>Your assessment</h3>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-meta text-ink-soft">Overall</span>
            <RatingControl
              value={review.overallRating}
              onChange={(value) => {
                const next = { ...review, overallRating: value };
                setDraft(next);
                save.mutate({ ratings: next.ratings, overallRating: value, notes: next.notes });
              }}
              label="Overall rating"
            />
          </div>
          <textarea
            value={review.notes ?? ''}
            onChange={(event) => setDraft({ ...review, notes: event.target.value })}
            onBlur={() =>
              save.mutate({
                ratings: review.ratings,
                overallRating: review.overallRating,
                notes: review.notes,
              })
            }
            rows={5}
            aria-label="Your notes on this screening"
            placeholder="What stood out? What would you want to probe in a live round?"
            className="mt-4 w-full rounded-control border border-line bg-field px-3 py-2 text-ui text-ink outline-none transition-colors duration-micro placeholder:text-ink-soft/60 hover:border-plum-200 focus:border-plum-600 focus:ring-2 focus:ring-plum-600/20"
          />
          <p className="mt-1.5 text-meta text-ink-soft">Ratings save as you click; notes save when you leave the box.</p>

          {otherReviews?.length > 0 ? (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-meta font-semibold text-ink-soft">Other reviewers</p>
              <ul className="mt-2 space-y-2">
                {otherReviews.map((other) => (
                  <li key={String(other.reviewerId?._id ?? other.reviewerId)} className="text-meta text-ink-soft">
                    <span className="font-semibold text-ink">
                      {other.reviewerId?.name ?? 'A reviewer'}
                    </span>
                    {other.overallRating ? ` rated ${other.overallRating}/5` : ''}
                    {other.notes ? ` — ${other.notes}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Permanently delete this candidate’s recordings?')) {
              removeRecordings.mutate();
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-meta font-semibold text-ink-soft transition-colors hover:bg-status-rejected hover:text-status-rejected-ink"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete recordings
        </button>
      </div>
    </div>
  );
};
