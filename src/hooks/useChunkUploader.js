import { useRef, useCallback, useState } from 'react';
import { endpoints } from '../api/endpoints.js';
import { tokenStore } from '../api/client.js';

// Chunks go through fetch rather than the axios client because they are
// multipart, not JSON — but the base URL and token come from the same place,
// so there is one source of truth for both.
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050/api';
const MAX_ATTEMPTS = 4;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Uploads recording chunks as they arrive, one at a time, in order.
 *
 * Chunks queue rather than upload in parallel: the server appends them to a
 * single file, so order matters. A failed chunk is retried with backoff — on
 * 3G a transient failure is normal and must not cost the candidate their answer.
 */
export const useChunkUploader = () => {
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(false);
  const queueRef = useRef(Promise.resolve());
  const abortedRef = useRef(false);

  const reset = useCallback(() => {
    abortedRef.current = false;
    setFailed(false);
    setPending(0);
    queueRef.current = Promise.resolve();
  }, []);

  const sendOne = useCallback(async (blob, index, { applicationId, questionOrder, isLast }) => {
    const form = new FormData();
    form.append('applicationId', applicationId);
    form.append('questionOrder', String(questionOrder));
    form.append('chunkIndex', String(index));
    form.append('isLast', String(Boolean(isLast)));
    form.append('chunk', blob, `chunk-${index}.bin`);

    const token = tokenStore.get();

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      if (abortedRef.current) return false;
      try {
        const response = await fetch(`${BASE}${endpoints.screening.uploadChunk}`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        if (response.ok) return true;
        // A rejected chunk will be rejected again — only retry transport and
        // server faults, not a 4xx.
        if (response.status < 500) return false;
      } catch {
        // Network failure: fall through to the backoff below.
      }
      if (attempt < MAX_ATTEMPTS) await sleep(attempt * 800);
    }
    return false;
  }, []);

  /** Enqueues a chunk. Returns immediately; recording is never blocked on I/O. */
  const push = useCallback(
    (blob, index, meta) => {
      setPending((count) => count + 1);
      queueRef.current = queueRef.current.then(async () => {
        const okay = await sendOne(blob, index, meta);
        if (!okay) setFailed(true);
        setPending((count) => Math.max(0, count - 1));
      });
      return queueRef.current;
    },
    [sendOne],
  );

  /** Resolves once every queued chunk has been attempted. */
  const flush = useCallback(async () => {
    await queueRef.current;
    return !abortedRef.current;
  }, []);

  const abort = useCallback(() => {
    abortedRef.current = true;
  }, []);

  return { push, flush, abort, reset, pending, failed };
};
