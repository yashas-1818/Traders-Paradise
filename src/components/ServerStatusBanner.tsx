import { useState, useEffect } from 'react';

const BACKEND = 'https://traders-paradise-3.onrender.com';

/**
 * ServerStatusBanner
 * - showWakeUp: shows an amber "server is waking up" banner that auto-dismisses after 10s.
 * - Listens for any failed fetch to the Render backend and shows an error banner.
 *
 * Usage:  <ServerStatusBanner showWakeUp />
 */
export const ServerStatusBanner = ({ showWakeUp = false }: { showWakeUp?: boolean }) => {
  const [wakeVisible, setWakeVisible] = useState(showWakeUp);
  const [errorVisible, setErrorVisible] = useState(false);

  // Auto-dismiss wake-up banner after 10s
  useEffect(() => {
    if (!showWakeUp) return;
    const t = setTimeout(() => setWakeVisible(false), 10000);
    return () => clearTimeout(t);
  }, [showWakeUp]);

  // Listen for custom 'server-error' events dispatched on fetch failures
  useEffect(() => {
    const handler = () => setErrorVisible(true);
    window.addEventListener('server-error', handler);
    return () => window.removeEventListener('server-error', handler);
  }, []);

  return (
    <>
      {wakeVisible && (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-300 animate-fade-in"
          role="alert"
        >
          <span>⏳ Please wait up to 50 seconds on first load — our free server is waking up!</span>
          <button
            onClick={() => setWakeVisible(false)}
            className="shrink-0 text-amber-400 hover:text-amber-200 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {errorVisible && (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-300 animate-fade-in"
          role="alert"
        >
          <span>🔄 Server is starting up, please refresh in 30 seconds</span>
          <button
            onClick={() => setErrorVisible(false)}
            className="shrink-0 text-red-400 hover:text-red-200 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

/**
 * Call this after any fetch to the Render backend fails.
 * It dispatches a custom event that ServerStatusBanner listens for.
 */
export function notifyServerError() {
  window.dispatchEvent(new Event('server-error'));
}

export { BACKEND };
