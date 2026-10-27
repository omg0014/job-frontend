import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Check, Video, Sun, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Button, BackLink } from '../../components/ui.jsx';
import { ScreeningSteps } from './ScreeningSteps.jsx';
import { useMediaRecorder } from '../../hooks/useMediaRecorder.js';
import { clsx } from '../../lib/clsx.js';

const TEST_SECONDS = 5;

/**
 * The device check. Camera preview, a live mic meter, and a five-second test
 * clip the candidate plays back before the round can start.
 *
 * The playback requirement is the point: a silent microphone or a covered lens
 * looks fine in preview and ruins every answer.
 */
export const DeviceCheckPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const playbackRef = useRef(null);
  const chunksRef = useRef([]);
  const [testUrl, setTestUrl] = useState(null);
  const [played, setPlayed] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const { stream, isRecording, error, openCamera, closeCamera, start, stop } = useMediaRecorder({
    onChunk: (blob) => chunksRef.current.push(blob),
    onStop: ({ mimeType }) => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setTestUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(blob);
      });
      setPlayed(false);
    },
  });

  const saveCheck = useMutation({
    mutationFn: () => request(endpoints.screening.deviceCheck, { applicationId: id, passed: true }),
    onSuccess: () => navigate(`/applications/${id}/screening`),
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(
    () => () => {
      closeCamera();
      if (testUrl) URL.revokeObjectURL(testUrl);
    },
    // Intentionally on unmount only — testUrl is revoked as it is replaced.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const enable = useCallback(
    async (useAudioOnly) => {
      try {
        setAudioOnly(useAudioOnly);
        await openCamera(useAudioOnly);
      } catch {
        // The hook surfaces the message; nothing to add here.
      }
    },
    [openCamera],
  );

  const recordTest = async () => {
    chunksRef.current = [];
    setTestUrl(null);
    setPlayed(false);
    await start({ maxSeconds: TEST_SECONDS, audioOnly, activeStream: stream });
    setCountdown(TEST_SECONDS);
    const timer = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          clearInterval(timer);
          return null;
        }
        return value - 1;
      });
    }, 1000);
  };

  const checklist = [
    { icon: Video, label: audioOnly ? 'Microphone is on' : 'I can see myself', done: Boolean(stream) },
    { icon: Sun, label: 'I played my test clip back', done: played },
  ];
  const ready = checklist.every((item) => item.done);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to={`/applications/${id}/screening/details`} className="mb-6">
        Back
      </BackLink>

      <ScreeningSteps current={3} />

      <h1 className="font-serif text-title font-semibold text-ink">Check your camera and mic</h1>
      <p className="mt-2 max-w-measure text-body leading-relaxed text-ink-soft">
        Record five seconds and play it back. It is worth the minute — a muted microphone is only
        obvious afterwards.
      </p>

      <Card className="mt-6 overflow-hidden">
        <div className="relative aspect-video w-full bg-plum-900">
          {!audioOnly ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Mic className="h-10 w-10 text-white/40" aria-hidden="true" />
            </div>
          )}

          {isRecording ? (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1">
              {/* The only red in the product outside the rejected state. */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
              </span>
              <span className="tabular text-meta font-semibold text-white">
                {countdown ?? 0}s
              </span>
            </div>
          ) : null}

          {!stream ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-ui text-white/80">
                {error ?? 'We need your camera and microphone for this round.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={() => enable(false)}>
                  <Video className="h-4 w-4" aria-hidden="true" />
                  Turn on camera
                </Button>
                <button
                  type="button"
                  onClick={() => enable(true)}
                  className="rounded-control px-3 py-2 text-ui font-semibold text-white/75 transition-colors duration-micro hover:text-white"
                >
                  Use audio only
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {testUrl ? (
            <div>
              <p className="text-ui font-semibold text-ink">Your test clip</p>
              <video
                ref={playbackRef}
                src={testUrl}
                controls
                onPlay={() => setPlayed(true)}
                className="mt-2 w-full rounded-card bg-plum-900"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={testUrl ? 'secondary' : 'primary'}
              onClick={recordTest}
              disabled={!stream || isRecording}
            >
              {testUrl ? (
                <>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Record again
                </>
              ) : (
                `Record ${TEST_SECONDS} seconds`
              )}
            </Button>
          </div>
        </div>
      </Card>

      <ul className="mt-6 divide-y divide-line rounded-card border border-line/80 bg-field shadow-card">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-3 px-4 py-3">
            <span
              className={clsx(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-base',
                item.done ? 'bg-status-short-ink text-white' : 'border border-line bg-field text-ink-soft',
              )}
            >
              {item.done ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : null}
            </span>
            <span className={clsx('text-ui', item.done ? 'font-semibold text-ink' : 'text-ink-soft')}>
              {item.label}
              <span className="sr-only">{item.done ? ' — done' : ' — not yet'}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => saveCheck.mutate()}
          disabled={!ready || saveCheck.isPending}
        >
          {saveCheck.isPending ? 'Starting…' : 'Start the questions'}
        </Button>
        {!ready ? (
          <p className="mt-2 text-meta text-ink-soft">
            Finish the two checks above to continue.
          </p>
        ) : null}
      </div>
    </div>
  );
};
