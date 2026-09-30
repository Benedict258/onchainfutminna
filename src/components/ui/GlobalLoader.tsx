import { useEffect, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

// Styles live in src/styles.css (.bcf-loader-overlay / .bcf-spinner) so the loader is
// visible on first paint, before any JavaScript runs.

// A query that starts just after a page mounts shouldn't make the loader flicker off/on.
const SETTLE_MS = 150;
// Never block the page for longer than this, even if a request hangs.
const MAX_WAIT_MS = 8000;

function Spinner() {
  return (
    <div className="bcf-spinner" aria-hidden="true">
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}

interface GlobalLoaderProps {
  show?: boolean;
  /** Render only the spinner, in place, instead of the full-screen overlay. */
  inline?: boolean;
}

export function GlobalLoader({ show = true, inline = false }: GlobalLoaderProps) {
  if (inline) {
    if (!show) return null;
    return (
      <div className="flex justify-center py-10" role="status" aria-label="Loading">
        <Spinner />
      </div>
    );
  }
  return (
    <div
      className="bcf-loader-overlay"
      data-hidden={!show}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      aria-hidden={!show}
    >
      <Spinner />
    </div>
  );
}

/**
 * Site-wide loader. Server-rendered visible, so it is the first thing on screen; the page
 * shows faintly underneath. It stays up until the app has started and the current page's
 * data has loaded, and comes back on every page change.
 */
export function PageLoader() {
  const [hydrated, setHydrated] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const fetching = useIsFetching();
  const routePending = useRouterState({ select: (s) => s.status === "pending" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setHydrated(true), []);

  // New page: wait for its data again. (Search-param changes like filters don't count.)
  useEffect(() => setWaiting(true), [pathname]);

  useEffect(() => {
    if (!hydrated || !waiting || fetching > 0) return;
    const t = setTimeout(() => setWaiting(false), SETTLE_MS);
    return () => clearTimeout(t);
  }, [hydrated, waiting, fetching]);

  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => setWaiting(false), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [waiting]);

  return <GlobalLoader show={!hydrated || routePending || waiting} />;
}
