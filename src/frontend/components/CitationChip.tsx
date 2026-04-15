'use client';

import { useState } from 'react';
import type { Citation } from '@/lib/types/sim-event';

export interface CitationChipProps {
  citation: Citation;
}

const SOURCE_COLORS: Record<string, string> = {
  gdelt: '#5bc9ff',
  acled: '#5bc9ff',
  worldbank: '#f5a623',
  'world bank': '#f5a623',
  fred: '#f5a623',
  'un comtrade': '#f5a623',
  imf: '#f5a623',
  default: '#a78bfa',
};

export function CitationChip({ citation }: CitationChipProps) {
  const [copied, setCopied] = useState(false);

  const color =
    SOURCE_COLORS[citation.source.toLowerCase()] ?? SOURCE_COLORS.default;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(citation.ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable in some test environments
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy citation: ${citation.ref}`}
      className="inline-flex items-center gap-1.5 font-mono text-[9px] bg-surface-container-highest border border-outline-variant/50 px-2 py-1 hover:border-cyber/40 transition-colors"
    >
      <span
        className="font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {citation.source.toUpperCase()}
      </span>
      <span className="text-on-surface-variant truncate max-w-[120px]">
        {copied ? 'COPIED' : citation.ref}
      </span>
    </button>
  );
}
