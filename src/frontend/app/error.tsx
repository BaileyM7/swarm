'use client';

/** Root error boundary page — rendered when an unhandled error bubbles to the root. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="w-[480px] border border-kinetic/30 bg-surface-container-low p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-kinetic text-[10px] font-mono px-2 py-0.5 font-bold text-background">
            SYSTEM ERROR
          </span>
          {error.digest && (
            <span className="font-mono text-[10px] text-on-surface-variant">
              {error.digest}
            </span>
          )}
        </div>
        <p className="font-mono text-xs text-on-surface leading-relaxed">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="w-full h-10 bg-cyber text-on-primary font-mono text-xs font-bold tracking-widest hover:brightness-110 transition-all"
        >
          RETRY
        </button>
      </div>
    </div>
  );
}
