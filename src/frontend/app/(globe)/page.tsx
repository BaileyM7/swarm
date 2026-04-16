'use client';

/**
 * Main globe page — the only page in the app.
 * Layout: left sidebar (ScenarioComposer 320px) | globe (fills remaining) |
 *          right drawer (360px, slide-in) | bottom dock (EventTimeline).
 */

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';
import { ScenarioComposer } from '@/components/ScenarioComposer';
import { AgentDrawer } from '@/components/AgentDrawer';
import { EventTimeline } from '@/components/EventTimeline';
import { EventDetailCard } from '@/components/EventDetailCard';
import { DecisionLogPanel } from '@/components/DecisionLogPanel';
import { ViewToggle } from '@/components/ViewToggle';
import { Loader } from '@/components/ui/Loader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useSimStore } from '@/lib/store/simStore';
import type { SimEvent, TriggeringFactor } from '@/lib/types/sim-event';

// Code-split the heavy viz; never SSR (WebGL requires browser)
const WorldView = dynamic(
  () => import('@/components/Globe/WorldView').then((m) => m.WorldView),
  {
    ssr: false,
    loading: () => <Loader message="Loading renderer…" />,
  },
);

export default function GlobePage() {
  const selectedCountry = useSimStore((s) => s.selectedCountry);
  const setSelectedCountry = useSimStore((s) => s.setSelectedCountry);
  const simStatus = useSimStore((s) => s.simStatus);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [decisionLogOpen, setDecisionLogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SimEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const events = useSimStore((s) => s.events);

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sync drawer open state with selected country
  useEffect(() => {
    setDrawerOpen(!!selectedCountry);
  }, [selectedCountry]);

  // Auto-open the Decision Log panel on the first event of a sim.  Without
  // this, live runs look visually thinner than the Taiwan demo even though
  // the data is identical — users have to find the "Decision Log" button to
  // see the "Action / Because / In hopes of" card for each decision.  A
  // ref guard prevents us from fighting a manual close: once the panel has
  // been auto-opened once in this session, subsequent events won't reopen
  // it if the user has dismissed it.
  const hasAutoOpenedLog = useRef(false);
  const hasEvents = events.length > 0;
  useEffect(() => {
    if (hasEvents && !hasAutoOpenedLog.current) {
      setDecisionLogOpen(true);
      hasAutoOpenedLog.current = true;
    }
  }, [hasEvents]);

  const handleCountryClick = useCallback(
    (iso3: string) => {
      setSelectedCountry(iso3);
      setDrawerOpen(true);
    },
    [setSelectedCountry],
  );

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setSelectedCountry(null);
  }, [setSelectedCountry]);

  const handleEventClick = useCallback((event: SimEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleEventDetailClose = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  /**
   * Factor click-through. When the user clicks a `kind=event` triggering
   * factor (in either the decision log or an open EventDetailCard), look up
   * the source event by UUID and open its detail card. Other factor kinds
   * are no-ops for now (no canonical "source object" to navigate to).
   */
  const handleFactorClick = useCallback(
    (factor: TriggeringFactor) => {
      if (factor.kind !== 'event' || !factor.verified) return;
      const source = events.find((e) => e.id === factor.ref);
      if (source) setSelectedEvent(source);
    },
    [events],
  );

  // Mobile interstitial — app is desktop-first
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="text-center space-y-4 max-w-sm">
          <p className="font-mono text-[10px] text-cyber uppercase tracking-widest">
            DISPLAY WARNING
          </p>
          <h2 className="font-mono text-xl font-bold text-on-surface tracking-tight">
            Desktop Required
          </h2>
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
            SWARM is optimized for desktop screens (1280px+). Please open on a
            larger screen for the full simulation experience.
          </p>
        </div>
      </div>
    );
  }

  // Bottom dock height when expanded
  const timelineHeight = timelineExpanded ? 256 : 64;
  // Right drawer width when open
  const drawerWidth = drawerOpen ? 360 : 0;
  // Left decision-log panel width when open (sits between sidebar and globe)
  const decisionLogWidth = decisionLogOpen ? 380 : 0;

  return (
    <div className="fixed inset-0 bg-background flex overflow-hidden">
      {/* ── Left sidebar: ScenarioComposer (320px fixed) ── */}
      <aside className="w-80 shrink-0 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col z-30">
        <ScenarioComposer />
      </aside>

      {/* ── Decision log panel (slides in from the left edge of the globe) ── */}
      <DecisionLogPanel
        isOpen={decisionLogOpen}
        onClose={() => setDecisionLogOpen(false)}
        width={decisionLogWidth}
        onFactorClick={handleFactorClick}
      />

      {/* ── Center: Globe + metadata overlays ── */}
      <main
        className="flex-1 relative overflow-hidden transition-all duration-200"
        style={{ marginBottom: timelineHeight, marginLeft: decisionLogWidth }}
        data-testid="globe-canvas"
      >
        <ErrorBoundary>
          <WorldView
            onCountryClick={handleCountryClick}
            onEventClick={handleEventClick}
          />
        </ErrorBoundary>

        {/* View toggle — top-right HUD, above turn counter */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
          <ViewToggle />
          <TurnCounterHud />
        </div>

        {/* Sim ID watermark — bottom-left */}
        <SimIdWatermark />

        {/* No full-screen loading overlay during `pending`. The globe keeps
            spinning, the TurnCounterHud flips to "PENDING", and arcs begin
            appearing naturally as the first events arrive — that feels more
            alive than a blanking loader. */}
      </main>

      {/* ── Right drawer: AgentDrawer ── */}
      <AgentDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        onEventClick={handleEventClick}
        onFactorClick={handleFactorClick}
        drawerWidth={drawerWidth}
      />

      {/* ── Bottom dock: EventTimeline ── */}
      <EventTimeline
        expanded={timelineExpanded}
        onToggle={() => setTimelineExpanded((v) => !v)}
        onEventClick={handleEventClick}
        height={timelineHeight}
      />

      {/* ── Decision log toggle (top-left HUD, next to scenario sidebar) ── */}
      <button
        type="button"
        onClick={() => setDecisionLogOpen((v) => !v)}
        className={[
          'absolute top-4 z-40 flex items-center gap-2 px-3 py-2 font-mono text-[10px] font-bold tracking-widest uppercase border transition-all',
          decisionLogOpen
            ? 'bg-cyber/15 border-cyber/60 text-cyber'
            : 'bg-background/80 backdrop-blur-lg border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:border-cyber/40',
        ].join(' ')}
        style={{ left: 320 + decisionLogWidth + 16 }}
        aria-pressed={decisionLogOpen}
        aria-label="Toggle decision log"
        data-testid="decision-log-toggle"
      >
        <BookOpen size={12} />
        Decision Log
      </button>

      {/* ── Event detail card (floating modal) ── */}
      {selectedEvent && (
        <EventDetailCard
          event={selectedEvent}
          onClose={handleEventDetailClose}
          onFactorClick={handleFactorClick}
        />
      )}
    </div>
  );
}

// ── Sub-components for HUD overlays ────────────────────────────────────────

function TurnCounterHud() {
  const currentTurn = useSimStore((s) => s.currentTurn);
  const maxTurns = useSimStore((s) => s.maxTurns);
  const simStatus = useSimStore((s) => s.simStatus);

  // null = no simulation started; hide HUD until backend sends a status
  if (simStatus === null) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="bg-background/80 backdrop-blur-lg border-l-4 border-cyber px-4 py-2">
        <span className="font-mono text-xl font-bold text-cyber tracking-tight">
          {/* turns are 0-indexed in the store; display 1-based for humans */}
          Turn {Math.min(currentTurn + 1, maxTurns)} / {maxTurns}
        </span>
      </div>
      <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
        {simStatus === 'running' ? 'LIVE' : simStatus.toUpperCase()}
      </span>
    </div>
  );
}

function SimIdWatermark() {
  const simId = useSimStore((s) => s.currentSimId);
  if (!simId) return null;
  const short = `SIM-${simId.slice(0, 8).toUpperCase()}`;
  return (
    <div className="absolute bottom-4 left-4 z-10">
      <span className="font-mono text-[10px] text-outline/60 tracking-[0.2em]">
        {short} // SECURE_LINE_GAMMA
      </span>
    </div>
  );
}
