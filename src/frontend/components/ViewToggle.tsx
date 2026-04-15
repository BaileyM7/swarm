'use client';

/**
 * ViewToggle — pill with GLOBE / MAP segments.
 *
 * Design rules (DESIGN.md §5, §6):
 * - 0px border radius throughout
 * - Active: cyber (#5bc9ff) text, surface-container-highest bg, 1px cyber top-border (terminal cursor)
 * - Inactive: muted text on surface-container-low
 * - Geist Mono, uppercase, tracking-wide
 * - role="radiogroup" for keyboard a11y (Tab / Enter / Space)
 */

import { Globe2, Map } from 'lucide-react';
import { useSimStore } from '@/lib/store/simStore';

type ViewMode = 'globe' | 'map';

interface Segment {
  mode: ViewMode;
  label: string;
  Icon: typeof Globe2;
}

const SEGMENTS: Segment[] = [
  { mode: 'globe', label: 'GLOBE', Icon: Globe2 },
  { mode: 'map',   label: 'MAP',   Icon: Map },
];

export function ViewToggle() {
  const viewMode = useSimStore((s) => s.viewMode);
  const setViewMode = useSimStore((s) => s.setViewMode);

  return (
    <div
      role="radiogroup"
      aria-label="Visualization mode"
      className="flex"
      style={{ borderRadius: 0 }}
    >
      {SEGMENTS.map(({ mode, label, Icon }) => {
        const isActive = viewMode === mode;
        return (
          <button
            key={mode}
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setViewMode(mode)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setViewMode(mode);
              }
              // Arrow-key navigation between segments
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const next = mode === 'globe' ? 'map' : 'globe';
                setViewMode(next);
                // Focus the sibling button
                const sibling = e.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
                  `[data-mode="${next}"]`,
                );
                sibling?.focus();
              }
            }}
            data-mode={mode}
            className={[
              // Base — zero border-radius, mono font, uppercase
              'flex items-center gap-1.5 px-3 py-1.5',
              'font-mono text-[11px] tracking-widest uppercase',
              'select-none outline-none',
              // Border treatment: ghost border all sides + active top accent
              'border border-[rgba(62,72,79,0.12)]',
              // Tonal surface
              isActive
                ? 'bg-[var(--color-surface-container-highest,#1e2533)] text-[#5bc9ff] border-t-[#5bc9ff]'
                : 'bg-[var(--color-surface-container-low,#12161f)] text-[rgba(191,200,208,0.55)]',
              // Focus ring for a11y — use cyber glow, not rounded
              'focus-visible:ring-1 focus-visible:ring-[#5bc9ff]',
              // Remove double border between segments
              mode === 'map' ? '-ml-px' : '',
            ].join(' ')}
            style={{ borderRadius: 0 }}
          >
            <Icon
              size={13}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
