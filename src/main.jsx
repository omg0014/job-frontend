import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { App } from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

/**
 * POST responses are never cached by the browser, so TanStack Query's
 * client-side cache is the only caching layer this app has. staleTime is set
 * per-query where it matters (job lists especially).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Never retry a client error — the request itself is the problem.
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* Every framer-motion animation honours the OS reduced-motion
              setting — sliding nav markers and drawers become instant. */}
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
          {/* sonner: better stacking than react-hot-toast, and its defaults
              already match the tokens once the surface colours are set. */}
          <Toaster
            position="top-right"
            duration={4000}
            toastOptions={{
              style: {
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontSize: '14px',
                borderRadius: '8px',
                // Toasts float above the page, so they take the raised
                // surface rather than the card colour.
                background: '#FFFFFF',
                border: '1px solid #E7E3DE',
                color: '#241F2E',
                boxShadow: '0 12px 28px -12px rgb(36 31 46 / 0.22)',
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
