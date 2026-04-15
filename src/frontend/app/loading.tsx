/** Root-level loading.tsx — shown by Next.js during initial navigation. */
export default function Loading() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Three concentric pulse rings */}
        <div className="relative w-16 h-16">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute inset-0 border border-cyber"
              style={{
                animation: `pulse-ring 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) ${i * 0.4}s infinite`,
                opacity: 0,
              }}
            />
          ))}
          <span className="absolute inset-2 bg-cyber/20 flex items-center justify-center">
            <span className="w-2 h-2 bg-cyber" />
          </span>
        </div>
        <p className="font-mono text-[10px] text-cyber/70 uppercase tracking-widest">
          Initializing…
        </p>
      </div>
    </div>
  );
}
