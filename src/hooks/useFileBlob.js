import { useEffect, useState } from 'react';
import { requestBlob } from '../api/client.js';

/**
 * Fetches a file from a POST-only endpoint and exposes it as an object URL.
 *
 * A browser cannot point an <iframe src> or <a download> at a POST endpoint, so
 * the file is fetched as a blob and wrapped in a URL the DOM can consume. The
 * URL is revoked on unmount and whenever the target changes, so nothing leaks.
 */
export const useFileBlob = (endpoint, body, { enabled = true } = {}) => {
  const [state, setState] = useState({
    url: null,
    fileName: '',
    mimeType: '',
    loading: false,
    error: null,
  });

  // Serialised so an inline object literal in the caller does not re-trigger
  // the effect on every render.
  const bodyKey = JSON.stringify(body ?? {});

  useEffect(() => {
    if (!enabled || !endpoint) {
      setState({ url: null, fileName: '', mimeType: '', loading: false, error: null });
      return undefined;
    }

    let objectUrl = null;
    let cancelled = false;

    setState((previous) => ({ ...previous, loading: true, error: null }));

    requestBlob(endpoint, JSON.parse(bodyKey))
      .then(({ blob, fileName, mimeType }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ url: objectUrl, fileName, mimeType, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          url: null,
          fileName: '',
          mimeType: '',
          loading: false,
          error: error.message ?? 'Could not load the file',
        });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [endpoint, bodyKey, enabled]);

  return state;
};

/**
 * One-shot download for a POST-only file endpoint. Creates a temporary object
 * URL, clicks it, and revokes it immediately.
 */
export const downloadFile = async (endpoint, body, fallbackName = 'document') => {
  const { blob, fileName } = await requestBlob(endpoint, body);
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
};
