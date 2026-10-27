import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050/api';

const TOKEN_KEY = 'yugam.token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // A blocked localStorage only costs session persistence, not function.
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Auth rides in the Authorization header rather than a cookie — that is what
// keeps this POST-only API immune to CSRF.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // An expired or invalid session logs the user out once, centrally.
    if (status === 401 && tokenStore.get()) {
      tokenStore.clear();
      onUnauthorized?.();
    }

    // Every backend error uses the same envelope, so normalise to its message.
    const message =
      error.response?.data?.message ??
      (error.code === 'ECONNABORTED'
        ? 'The request timed out. Please try again.'
        : 'Could not reach the server. Please check your connection.');

    return Promise.reject(
      Object.assign(new Error(message), {
        status,
        details: error.response?.data?.data ?? null,
        original: error,
      }),
    );
  },
);

/**
 * Every endpoint in this API is a POST with its parameters in the body — there
 * are no GETs, no route params and no query strings. `request` is the single
 * call shape the whole app uses, and it unwraps the response envelope.
 */
export const request = async (path, body = {}) => {
  const response = await api.post(path, body);
  return response.data.data;
};

/**
 * POST variant for the two file endpoints. A <iframe> or <a download> cannot
 * issue a POST, so files are fetched as blobs and turned into object URLs.
 */
export const requestBlob = async (path, body = {}) => {
  const response = await api.post(path, body, { responseType: 'blob' });

  // An error response arrives as a JSON blob even when responseType is blob.
  if (response.data.type?.includes('application/json')) {
    const text = await response.data.text();
    throw new Error(JSON.parse(text).message ?? 'Could not load the file');
  }

  const disposition = response.headers['content-disposition'] ?? '';
  const match = disposition.match(/filename="?([^";]+)"?/);

  return {
    blob: response.data,
    fileName: match ? decodeURIComponent(match[1]) : 'document',
    mimeType: response.data.type,
  };
};

/** multipart/form-data — the only non-JSON request in the API. */
export const requestUpload = async (path, formData, onProgress) => {
  const response = await api.post(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  return response.data.data;
};
