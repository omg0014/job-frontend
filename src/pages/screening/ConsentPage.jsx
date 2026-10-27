import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Button, BackLink, ErrorState } from '../../components/ui.jsx';
import { ScreeningSteps } from './ScreeningSteps.jsx';
import { Skeleton } from '../../components/Loading.jsx';

/**
 * Consent, before anything is recorded.
 *
 * The checkbox starts unticked and the button stays disabled until it is
 * ticked — consent has to be an affirmative act, not a default.
 */
export const ConsentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['screening', id],
    queryFn: () => request(endpoints.screening.get, { applicationId: id }),
  });

  const accept = useMutation({
    mutationFn: () => request(endpoints.screening.acceptConsent, { applicationId: id, accepted: true }),
    onSuccess: () => navigate(`/applications/${id}/screening/details`),
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  const expires = data?.screening?.expiresAt
    ? new Date(data.screening.expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to="/applications" className="mb-6">
        My applications
      </BackLink>

      <ScreeningSteps current={1} />

      <h1 className="font-serif text-title font-semibold text-ink">Before you begin</h1>
      <p className="mt-2 max-w-measure text-body leading-relaxed text-ink-soft">
        This round is recorded. Please read how your recording is handled — it matters, and it is
        short.
      </p>

      <Card className="mt-6 divide-y divide-line">
        {[
          {
            title: 'What is recorded',
            body: 'Five short video answers, and the written details you provide on the next screen. You can retake any answer once.',
          },
          {
            title: 'Who can see it',
            body: 'Only you, and the staff at Yugam International School involved in hiring for this role. Every time a staff member plays your recording, it is logged.',
          },
          {
            title: 'How long it is kept',
            body: 'Twelve months from the day you submit, after which the recordings are deleted automatically. You can ask us to delete them sooner.',
          },
          {
            title: 'What it is used for',
            body: 'Assessing this application only. Nothing is shared outside the school, and no automated system decides the outcome — a person reviews every recording.',
          },
        ].map((item) => (
          <section key={item.title} className="p-5 sm:p-6">
            <h2 className="text-ui font-semibold text-ink">{item.title}</h2>
            <p className="mt-1.5 max-w-measure text-ui leading-relaxed text-ink-soft">
              {item.body}
            </p>
          </section>
        ))}
      </Card>

      {expires ? (
        <p className="mt-4 text-meta text-ink-soft">
          You can complete this any time before <strong className="text-ink">{expires}</strong>.
        </p>
      ) : null}

      <label
        className={`mt-6 flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors duration-base sm:p-5 ${
          agreed ? 'border-plum-300 bg-plum-50' : 'border-line/80 bg-field shadow-card hover:border-plum-200'
        }`}
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-line text-plum-600 accent-plum-600 focus:ring-plum-600"
        />
        <span className="text-ui leading-relaxed text-ink">
          I have read the above and agree to record my answers for this application.
        </span>
      </label>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => accept.mutate()}
          disabled={!agreed || accept.isPending}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {accept.isPending ? 'Saving…' : 'Agree and continue'}
        </Button>
        <Link
          to="/applications"
          className="rounded-control px-3 py-2.5 text-center text-ui font-semibold text-ink-soft transition-colors duration-micro hover:text-ink"
        >
          Not now
        </Link>
      </div>
    </div>
  );
};
