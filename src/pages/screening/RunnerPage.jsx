import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RotateCcw, Loader2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Button, ErrorState } from '../../components/ui.jsx';
import { ScreeningSteps } from './ScreeningSteps.jsx';
import { Skeleton } from '../../components/Loading.jsx';
import { useMediaRecorder } from '../../hooks/useMediaRecorder.js';
import { useChunkUploader } from '../../hooks/useChunkUploader.js';
import { clsx } from '../../lib/clsx.js';

const PHASES = { PREP: 'prep', RECORDING: 'recording', SAVING: 'saving', DONE: 'done' };

/** Ring that depletes over the prep window — entering recording feels inevitable. */
const PrepRing = ({ remaining, total }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? remaining / total : 0;

  return (
    <div className="relative h-20 w-20">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={radius} className="fill-none stroke-line" strokeWidth="5" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="fill-none stroke-plum-600 transition-[stroke-dashoffset] duration-1000 ease-linear"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <span className="tabular absolute inset-0 flex items-center justify-center text-title font-semibold text-ink">
        {remaining}
      </span>
    </div>
  );
};

export const RunnerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [phase, setPhase] = useState(PHASES.PREP);
  const [current, setCurrent] = useState(null);
  const [prepLeft, setPrepLeft] = useState(0);
  const [isRetake, setIsRetake] = useState(false);
  const mimeRef = useRef('video/webm');
  const audioOnlyRef = useRef(false);

  const uploader = useChunkUploader();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['screening', id],
    queryFn: () => request(endpoints.screening.get, { applicationId: id }),
  });

  const { stream, isRecording, elapsed, openCamera, closeCamera, start, stop } = useMediaRecorder({
    onChunk: (blob, index) => {
      if (!current) return;
      uploader.push(blob, index, {
        applicationId: id,
        questionOrder: current.order,
        isLast: false,
      });
    },
    onStop: ({ mimeType, audioOnly }) => {
      mimeRef.current = mimeType;
      audioOnlyRef.current = audioOnly;
      setPhase(PHASES.SAVING);
    },
  });

  const finish = useMutation({
    mutationFn: () =>
      request(endpoints.screening.finishAnswer, {
        applicationId: id,
        questionOrder: current.order,
        durationSeconds: elapsed,
        mimeType: mimeRef.current,
        retake: isRetake,
        isAudioOnly: audioOnlyRef.current,
      }),
    onSuccess: (result) => {
      const next = result.progress?.nextQuestionOrder;
      setIsRetake(false);
      uploader.reset();
      if (next) {
        const question = data.questions.find((q) => q.order === next);
        setCurrent(question);
        setPrepLeft(question.prepSeconds);
        setPhase(PHASES.PREP);
      } else {
        setPhase(PHASES.DONE);
      }
    },
    onError: (err) => {
      toast.error(err.message);
      setPhase(PHASES.DONE);
    },
  });

  const submit = useMutation({
    mutationFn: () => request(endpoints.screening.submit, { applicationId: id }),
    onSuccess: () => {
      closeCamera();
      navigate(`/applications/${id}/screening/done`);
    },
    onError: (err) => toast.error(err.message),
  });

  // Resume where the candidate left off: the server is the source of truth for
  // which questions are already answered, so a closed browser costs nothing.
  useEffect(() => {
    if (!data || current) return;
    const next = data.progress?.nextQuestionOrder;
    if (!next) {
      setPhase(PHASES.DONE);
      return;
    }
    const question = data.questions.find((q) => q.order === next);
    setCurrent(question);
    setPrepLeft(question?.prepSeconds ?? 30);
    openCamera(false).catch(() => {});
  }, [data, current, openCamera]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const beginRecording = useCallback(async () => {
    if (!current) return;
    uploader.reset();
    setPhase(PHASES.RECORDING);
    await start({
      maxSeconds: current.maxAnswerSeconds,
      audioOnly: audioOnlyRef.current,
      activeStream: stream,
    });
  }, [current, start, stream, uploader]);

  // Prep countdown, then recording starts on its own.
  useEffect(() => {
    if (phase !== PHASES.PREP || !current) return undefined;
    if (prepLeft <= 0) {
      beginRecording();
      return undefined;
    }
    const timer = setTimeout(() => setPrepLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, prepLeft, current, beginRecording]);

  // Once recording stops, drain the upload queue before sealing the answer.
  useEffect(() => {
    if (phase !== PHASES.SAVING) return;
    let cancelled = false;
    (async () => {
      await uploader.flush();
      if (!cancelled) finish.mutate();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => closeCamera(), [closeCamera]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-8 w-2/3" />
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

  const questions = data?.questions ?? [];
  const answered = new Set(data?.progress?.answered ?? []);
  const secondsLeft = current ? Math.max(0, current.maxAnswerSeconds - elapsed) : 0;
  const isLastStretch = secondsLeft <= 15;

  if (phase === PHASES.DONE) {
    return (
      <div className="mx-auto max-w-2xl">
        <ScreeningSteps current={4} />
        <div className="rounded-card border border-line/80 bg-field shadow-card px-5 py-10 text-center sm:px-8">
        <h1 className="font-serif text-title font-semibold text-ink">That is every question</h1>
        <p className="mx-auto mt-2 max-w-measure text-body leading-relaxed text-ink-soft">
          Submit when you are ready. Once submitted, your answers go to the school for review.
        </p>
        <div className="mt-6">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => submit.mutate()}
            disabled={submit.isPending}
          >
            {submit.isPending ? 'Submitting…' : 'Submit my screening'}
          </Button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ScreeningSteps current={4} />

      {/* Progress dots — "3 of 5" is legible at a glance in a way a percentage
          bar is not. */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5" aria-label={`Question ${current?.order} of ${questions.length}`}>
          {questions.map((question) => (
            <span
              key={question.order}
              className={clsx(
                'h-2 rounded-full transition-[width,background-color] duration-panel ease-out-soft',
                question.order === current?.order
                  ? 'w-6 bg-plum-600'
                  : answered.has(question.order)
                    ? 'w-2 bg-status-short-ink'
                    : 'w-2 bg-line',
              )}
            />
          ))}
        </div>
        <span className="tabular text-meta font-semibold text-ink-soft">
          Question {current?.order} of {questions.length}
        </span>
      </div>

      {/* 24px, never truncated — candidates read this while composing. */}
      <h1 className="mt-5 font-serif text-[24px] leading-snug text-ink">{current?.text}</h1>

      <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-card bg-plum-900">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

        {phase === PHASES.RECORDING ? (
          <>
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
              </span>
              <span className="text-meta font-semibold text-white">Recording</span>
            </div>
            <div
              className={clsx(
                'tabular absolute right-3 top-3 rounded-full px-2.5 py-1 text-meta font-semibold',
                isLastStretch ? 'bg-amber-400 text-plum-900' : 'bg-black/55 text-white',
              )}
            >
              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </div>
          </>
        ) : null}

        {phase === PHASES.PREP ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-plum-900/70">
            <PrepRing remaining={prepLeft} total={current?.prepSeconds ?? 30} />
            <p className="text-ui font-semibold text-white">Recording starts automatically</p>
            <button
              type="button"
              onClick={() => setPrepLeft(0)}
              className="rounded-control border border-white/30 px-4 py-2 text-ui font-semibold text-white transition-colors duration-micro hover:bg-white/10"
            >
              I am ready now
            </button>
          </div>
        ) : null}

        {phase === PHASES.SAVING ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-plum-900/75">
            <Loader2 className="h-6 w-6 animate-spin text-white" aria-hidden="true" />
            <p className="text-ui font-semibold text-white">
              Saving your answer{uploader.pending > 0 ? `… ${uploader.pending} left` : '…'}
            </p>
          </div>
        ) : null}
      </div>

      {uploader.failed ? (
        <p className="mt-3 flex items-center gap-2 text-meta text-status-rejected-ink">
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          Your connection dropped. We saved what we could — you can retake this answer.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {phase === PHASES.RECORDING ? (
          <Button size="lg" className="w-full sm:w-auto" onClick={stop}>
            Stop and save
          </Button>
        ) : null}

        {phase === PHASES.PREP && answered.has(current?.order) ? (
          <button
            type="button"
            onClick={() => {
              setIsRetake(true);
              setPrepLeft(0);
            }}
            className="inline-flex items-center gap-1.5 rounded-control px-2 py-2 text-ui font-semibold text-ink-soft transition-colors duration-micro hover:text-ink"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Use my one retake
          </button>
        ) : null}
      </div>

      <p className="mt-4 text-meta leading-relaxed text-ink-soft">
        You have up to {Math.round((current?.maxAnswerSeconds ?? 0) / 60)} minute
        {(current?.maxAnswerSeconds ?? 0) >= 120 ? 's' : ''} for this answer, and one retake if you
        need it.
      </p>
    </div>
  );
};
