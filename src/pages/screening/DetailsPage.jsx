import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Button, BackLink, ErrorState } from '../../components/ui.jsx';
import { ScreeningSteps } from './ScreeningSteps.jsx';
import { Skeleton } from '../../components/Loading.jsx';
import { clsx } from '../../lib/clsx.js';

/**
 * The factual half of the round. These answers are what the principal filters
 * on before opening a single video, so they are asked as plain fields rather
 * than buried in a recording.
 */
export const DetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState({});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['screening', id],
    queryFn: () => request(endpoints.screening.get, { applicationId: id }),
  });

  useEffect(() => {
    if (data?.screening?.textAnswers) setValues(data.screening.textAnswers);
  }, [data]);

  const save = useMutation({
    mutationFn: (isComplete) =>
      request(endpoints.screening.saveTextAnswers, {
        applicationId: id,
        textAnswers: values,
        isComplete,
      }),
    onSuccess: (_result, isComplete) => {
      if (isComplete) navigate(`/applications/${id}/screening/check`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-4 h-96 w-full" />
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

  const fields = data?.textFields ?? [];
  const setValue = (key, value) => setValues((previous) => ({ ...previous, [key]: value }));

  const toggleMulti = (key, option) => {
    const current = Array.isArray(values[key]) ? values[key] : [];
    setValue(key, current.includes(option) ? current.filter((v) => v !== option) : [...current, option]);
  };

  const inputClass =
    'h-11 w-full rounded-control border border-line bg-field px-3 text-ui text-ink outline-none transition-colors duration-micro hover:border-plum-200 focus:border-plum-600 focus:ring-2 focus:ring-plum-600/20';

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to={`/applications/${id}/screening/consent`} className="mb-6">
        Back
      </BackLink>

      <ScreeningSteps current={2} />

      <h1 className="font-serif text-title font-semibold text-ink">A few details</h1>
      <p className="mt-2 max-w-measure text-body leading-relaxed text-ink-soft">
        These take a minute and save you repeating them on video.
      </p>

      <Card className="mt-6 space-y-6 p-5 sm:p-7">
        {fields.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="block text-ui font-semibold text-ink"
            >
              {field.label}
              {field.required ? <span className="ml-1 text-status-rejected-ink">*</span> : null}
            </label>

            {field.type === 'multiselect' ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {field.options.map((option) => {
                  const active = (values[field.key] ?? []).includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleMulti(field.key, option)}
                      aria-pressed={active}
                      className={clsx(
                        'min-h-[40px] rounded-full border px-4 py-2 text-ui font-semibold transition-colors duration-micro',
                        active
                          ? 'border-plum-600 bg-plum-50 text-plum-800'
                          : 'border-line bg-card text-ink-soft hover:border-plum-200',
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : field.type === 'select' ? (
              <select
                id={field.key}
                value={values[field.key] ?? ''}
                onChange={(event) => setValue(field.key, event.target.value)}
                className={clsx(inputClass, 'mt-2')}
              >
                <option value="">Select…</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.key}
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                value={values[field.key] ?? ''}
                onChange={(event) => setValue(field.key, event.target.value)}
                className={clsx(inputClass, 'mt-2')}
              />
            )}
          </div>
        ))}
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => save.mutate(true)}
          disabled={save.isPending}
        >
          {save.isPending ? 'Saving…' : 'Continue'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <button
          type="button"
          onClick={() => save.mutate(false)}
          className="rounded-control px-3 py-2.5 text-ui font-semibold text-ink-soft transition-colors duration-micro hover:text-ink"
        >
          Save and finish later
        </button>
      </div>
    </div>
  );
};
