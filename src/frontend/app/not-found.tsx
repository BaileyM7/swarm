import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
          404 // ROUTE_NOT_FOUND
        </p>
        <h1 className="font-mono text-3xl font-bold text-cyber tracking-tight">
          PAGE NOT FOUND
        </h1>
        <Link
          href="/"
          className="block mt-4 font-mono text-xs text-cyber/70 hover:text-cyber transition-colors"
        >
          ← Return to Globe
        </Link>
      </div>
    </div>
  );
}
