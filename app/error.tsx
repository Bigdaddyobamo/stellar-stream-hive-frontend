"use client";

import { useEffect } from "react";

/**
 * Root error boundary. Catches unexpected render/runtime errors anywhere in
 * the app so a bug (e.g. an RPC client throwing outside a try/catch) shows a
 * recoverable screen instead of a blank page.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted">
        An unexpected error occurred. This has been logged to the console — please try again.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
