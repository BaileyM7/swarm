'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';

export interface DecisionRowProps {
  turn: number;
  actionLabel: string;
  reasoningTrace: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function DecisionRow({
  turn,
  actionLabel,
  reasoningTrace,
  isExpanded,
  onToggle,
}: DecisionRowProps) {
  return (
    <div className="bg-surface-container-high border border-outline-variant/30 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-3 flex justify-between items-center text-left hover:bg-surface-container-highest/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-cyber px-1.5 py-0.5 bg-cyber/10">
            T_{String(turn).padStart(2, '0')}
          </span>
          <span className="text-xs font-medium text-on-surface">{actionLabel}</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-on-surface-variant shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-on-surface-variant shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 animate-expand-down">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">
            Reasoning Analysis
          </span>
          <p className="font-sans text-xs text-on-surface leading-relaxed">
            {reasoningTrace}
          </p>
        </div>
      )}
    </div>
  );
}
