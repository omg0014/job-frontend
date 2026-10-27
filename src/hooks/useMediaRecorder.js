import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Container preference, in the order the spec requires.
 *
 * Safari and iOS only produce MP4; Chrome prefers VP9; older Android needs the
 * VP8 fallback. Whatever the browser gives us is stored as-is and the real
 * mimeType recorded, because guessing wrong makes a clip unplayable later.
 */
const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1,mp4a',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export const pickMimeType = (audioOnly = false) => {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = audioOnly
    ? ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
    : MIME_CANDIDATES;
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
};

/** 720p at 20fps, ~800kbps. 1080p fills storage and overheats mid-range phones. */
export const VIDEO_CONSTRAINTS = {
  video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 20 } },
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
};

export const AUDIO_ONLY_CONSTRAINTS = {
  video: false,
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
};

/**
 * Wraps MediaRecorder with the behaviour this round needs: a 3-second chunk
 * cadence so uploads happen during the answer rather than after it, and a hard
 * stop at the question's limit.
 *
 * `onChunk` is called with each blob as it arrives. Nothing is buffered here
 * beyond the current chunk — on patchy mobile data, holding the whole answer
 * in memory and uploading at the end loses everything when the connection drops.
 */
export const useMediaRecorder = ({ onChunk, onStop, chunkMs = 3000 }) => {
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef(null);
  const chunkIndexRef = useRef(0);
  const tickRef = useRef(null);
  const hardStopRef = useRef(null);
  const onChunkRef = useRef(onChunk);
  const onStopRef = useRef(onStop);

  // Kept in refs so the recorder's handlers always call the current callbacks
  // without needing to be torn down and rebuilt each render.
  useEffect(() => {
    onChunkRef.current = onChunk;
    onStopRef.current = onStop;
  }, [onChunk, onStop]);

  const openCamera = useCallback(async (audioOnly = false) => {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia(
        audioOnly ? AUDIO_ONLY_CONSTRAINTS : VIDEO_CONSTRAINTS,
      );
      setStream(media);
      return media;
    } catch (err) {
      // These names are what the browser actually throws; the copy matters
      // because this is where candidates get stuck.
      const message =
        err.name === 'NotAllowedError'
          ? 'Camera and microphone access was blocked. Please allow it in your browser and try again.'
          : err.name === 'NotFoundError'
            ? 'No camera or microphone was found on this device.'
            : err.name === 'NotReadableError'
              ? 'Your camera is being used by another app. Please close it and try again.'
              : 'We could not start your camera. Please check your browser permissions.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const closeCamera = useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    clearInterval(tickRef.current);
    clearTimeout(hardStopRef.current);
    setIsRecording(false);
  }, []);

  const start = useCallback(
    async ({ maxSeconds, audioOnly = false, activeStream }) => {
      const media = activeStream ?? stream ?? (await openCamera(audioOnly));
      const mimeType = pickMimeType(audioOnly);

      chunkIndexRef.current = 0;
      setElapsed(0);

      const recorder = new MediaRecorder(media, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: 800000,
        audioBitsPerSecond: 64000,
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          onChunkRef.current?.(event.data, chunkIndexRef.current);
          chunkIndexRef.current += 1;
        }
      };

      recorder.onstop = () => {
        clearInterval(tickRef.current);
        clearTimeout(hardStopRef.current);
        setIsRecording(false);
        onStopRef.current?.({ mimeType: recorder.mimeType || mimeType, audioOnly });
      };

      recorder.start(chunkMs);
      setIsRecording(true);

      tickRef.current = setInterval(() => setElapsed((value) => value + 1), 1000);
      // The hard stop is a timer, not a check inside the tick, so a throttled
      // background tab cannot overrun the limit.
      hardStopRef.current = setTimeout(() => stop(), maxSeconds * 1000);

      return { mimeType: recorder.mimeType || mimeType };
    },
    [stream, openCamera, chunkMs, stop],
  );

  useEffect(
    () => () => {
      clearInterval(tickRef.current);
      clearTimeout(hardStopRef.current);
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    },
    [],
  );

  return { stream, isRecording, elapsed, error, openCamera, closeCamera, start, stop };
};
