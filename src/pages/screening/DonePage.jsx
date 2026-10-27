import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, Play } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Button, ButtonLink } from '../../components/ui.jsx';
import { ScreeningSteps } from './ScreeningSteps.jsx';

const MEDIA_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050/api').replace(
  /\/api\/?$/,
  '',
);

/** Confirmation, plus playback of the candidate's own answers. */
export const DonePage = () => {
  const { id } = useParams();
  const [playing, setPlaying] = useState(null);

  const { data } = useQuery({
    queryKey: ['screening', id],
    queryFn: () => request(endpoints.screening.get, { applicationId: id }),
  });

  const playback = useMutation({
    mutationFn: (questionOrder) =>
      request(endpoints.screening.playbackUrl, { applicationId: id, questionOrder }),
    onSuccess: (result, questionOrder) =>
      setPlaying({ questionOrder, url: `${MEDIA_ORIGIN}${result.url}` }),
  });

  const questions = data?.questions ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <ScreeningSteps current={5} />

      <div className="rounded-card border border-line/80 bg-field shadow-card px-5 py-10 text-center sm:px-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-review ring-8 ring-status-review/40">
          <CheckCircle2 className="h-7 w-7 text-status-short-ink" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-serif text-title font-semibold text-ink">
          Your screening is in
        </h1>
        <p className="mx-auto mt-2 max-w-measure text-body leading-relaxed text-ink-soft">
          Thank you for taking the time. The school will review your answers and be in touch about
          the next step — there is nothing else for you to do right now.
        </p>
      </div>

      {questions.length > 0 ? (
        <>
        <h2 className="mt-10 font-serif text-heading font-semibold text-ink">Your answers</h2>
        <Card className="mt-3 divide-y divide-line">
          {questions.map((question) => (
            <div key={question.order} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-ui text-ink">
                  <span className="font-semibold">{question.order}.</span> {question.text}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() => playback.mutate(question.order)}
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  Play
                </Button>
              </div>
              {playing?.questionOrder === question.order ? (
                <video
                  src={playing.url}
                  controls
                  autoPlay
                  className="mt-3 w-full rounded-card bg-plum-900"
                />
              ) : null}
            </div>
          ))}
        </Card>
        </>
      ) : null}

      <div className="mt-8 text-center">
        <ButtonLink to="/applications" variant="secondary" size="lg" className="w-full sm:w-auto">
          Back to my applications
        </ButtonLink>
      </div>
    </div>
  );
};
