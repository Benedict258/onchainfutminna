import { Link } from "@tanstack/react-router";

export function PageStub({
  eyebrow,
  title,
  blurb,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16">
      <p className="text-label-bold text-primary">{eyebrow}</p>
      <h1 className="mt-3 text-display-lg">{title}</h1>
      <p className="mt-4 max-w-2xl text-body-lg text-muted-foreground">{blurb}</p>

      <div className="mt-10 rounded-xl border border-dashed border-border bg-surface-low p-12 text-center">
        <div className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-high text-on-surface-variant">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <p className="text-label-bold text-outline">Coming next in the build</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          This page will be wired up in Phase 2 when the backend is enabled.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-low px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-high hover:border-primary hover:text-primary"
        >
          ← Back home
        </Link>
      </div>
    </div>
  );
}


