import { useState, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Gauge, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Button, PageHeader, BackLink, Toolbar, EmptyState } from '../../components/ui.jsx';
import { Skeleton } from '../../components/Loading.jsx';
import { RatingControl } from './ScreeningReview.jsx';
import { clsx } from '../../lib/clsx.js';

const MEDIA_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050/api').replace(
  /\/api\/?$/,
  '',
);
const SPEEDS = [1, 1.25, 1.5, 2];
const SPEED_KEY = 'yugam.playbackRate';

/**
 * One question, every candidate, back to back.
 *
 * This is what makes a round of forty reviewable. Judging twenty answers to the
 * same question is faster than opening twenty profiles, and the judgements are
 * more consistent because the comparison is direct.
 */
export const ComparePage = () => {
  const { id: jobId } = useParams();
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const questionOrder = Number(searchParams.get('q') ?? 1);
  const [playing, setPlaying] = useState(null);
  const [rate, setRate] = useState(() => {
    try {
      return Number(localStorage.getItem(SPEED_KEY)) || 1;
    } catch {
      return 1;
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['screening-compare', jobId, questionOrder],
    queryFn: () => request(endpoints.screening.compare, { jobId, questionOrder, status: 'all' }),
  });

  const playback = useMutation({
    mutationFn: (applicationId) =>
      request(endpoints.screening.playbackUrl, { applicationId, questionOrder }),
    onSuccess: (result, applicationId) =>
      setPlaying({ applicationId, url: `${MEDIA_ORIGIN}${result.url}` }),
    onError: (err) => toast.error(err.message),
  });

  const rate1to5 = useMutation({
    mutationFn: ({ applicationId, rating }) =>
      request(endpoints.screening.saveReview, {
        applicationId,
        ratings: [{ questionOrder, rating }],
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['screening-compare', jobId, questionOrder] }),
    onError: (err) => toast.error(err.message),
  });

  const applyRate = (value) => {
    setRate(value);
    try {
      localStorage.setItem(SPEED_KEY, String(value));
    } catch {
      // Preference only.
    }
    if (videoRef.current) videoRef.current.playbackRate = value;
  };

  const clips = data?.clips ?? [];

  return (
    <div>
      <PageHeader
        dense
        back={<BackLink to="/admin/jobs">Back to jobs</BackLink>}
        title="Compare answers"
        description={data?.jobTitle ? `${data.jobTitle} — one question across every candidate` : undefined}
      />

      <Toolbar>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Question">
            <span className="text-meta font-medium text-ink-soft">Question</span>
            <div className="flex items-center gap-0.5 rounded-control border border-line bg-field p-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSearchParams({ q: String(n) }, { replace: true })}
                  aria-pressed={n === questionOrder}
                  aria-label={`Question ${n}`}
                  className={clsx(
                    'tabular h-7 min-w-7 rounded-[4px] px-2 text-meta font-semibold transition-colors duration-micro',
                    n === questionOrder
                      ? 'bg-plum-600 text-white'
                      : 'text-ink-soft hover:bg-plum-50 hover:text-plum-800',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
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
                  'tabular h-7 rounded-[4px] px-2 text-meta font-semibold transition-colors duration-micro',
                  rate === speed ? 'bg-plum-50 text-plum-800' : 'text-ink-soft hover:text-ink',
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
        {data?.questionText ? (
          <p className="max-w-measure border-t border-line pt-3 font-serif text-body leading-relaxed text-ink">
            {data.questionText}
          </p>
        ) : null}
      </Toolbar>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-card" />
      ) : clips.length === 0 ? (
        <EmptyState
          icon={Play}
          title="No recordings for this question"
          description="Candidates invited to the screening round will appear here once they submit."
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line/80 bg-field shadow-card">
          {clips.map((clip) => (
            <li
              key={clip.applicationId}
              className={clsx(
                'px-4 py-3.5 transition-colors duration-base sm:px-5',
                playing?.applicationId === clip.applicationId && 'bg-plum-50/40',
              )}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/applications/${clip.applicationId}`}
                      className="rounded-control text-ui font-semibold text-ink underline-offset-4 transition-colors duration-micro hover:text-plum-700 hover:underline"
                    >
                      {clip.candidateName}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-2 text-meta text-ink-soft">
                      <span className="tabular">{clip.durationSeconds}s</span>
                      {clip.isAudioOnly ? (
                        <span className="flex items-center gap-1">
                          <MicOff className="h-3 w-3" aria-hidden="true" />
                          Audio only
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Rate while watching — never navigate away to record it. */}
                    <RatingControl
                      value={clip.myRating}
                      onChange={(rating) =>
                        rating && rate1to5.mutate({ applicationId: clip.applicationId, rating })
                      }
                      label={`Rate ${clip.candidateName}`}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => playback.mutate(clip.applicationId)}
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      Play
                    </Button>
                  </div>
                </div>

                {playing?.applicationId === clip.applicationId ? (
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
