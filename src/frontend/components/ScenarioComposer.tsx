'use client';

/**
 * ScenarioComposer — left sidebar.
 * Controls: textarea, preset picker, Simulate button, playback controls,
 *           turn scrubber, status indicator.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Terminal, Play, Square } from 'lucide-react';
import { Button } from './ui/Button';
import { PresetCard } from './PresetCard';
import { PlaybackControls } from './PlaybackControls';
import { TurnScrubber } from './TurnScrubber';
import { useSimStore } from '@/lib/store/simStore';
import { useSimStream } from '@/hooks/useSimStream';
import { createScenario, createSimulation } from '@/lib/api/client';
import { runTaiwanDemo } from '@/lib/demo/taiwanDemo';
import type { Domain } from '@/lib/types/sim-event';

const MAX_CHARS = 2000;

/**
 * DemoButton — plays the scripted Taiwan 2027 quarantine sequence locally.
 * Doesn't touch the backend, doesn't burn API tokens — pure frontend event
 * dispatch so the globe arcs/timeline/drawer all animate as if a real sim
 * were running. Useful for reliable demos and for verifying the viz when
 * the real sim is rate-limited.
 */
function DemoButton() {
  const cancelRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);

  // Cancel any pending dispatches on unmount so we don't fire into a stale store.
  useEffect(() => {
    return () => cancelRef.current?.();
  }, []);

  const handleClick = useCallback(() => {
    if (playing) {
      cancelRef.current?.();
      cancelRef.current = null;
      setPlaying(false);
      useSimStore.getState().setSimStatus('aborted');
      return;
    }
    cancelRef.current = runTaiwanDemo();
    setPlaying(true);
    // Auto-clear the playing flag when the sim transitions to completed.
    const unsub = useSimStore.subscribe((s) => {
      if (s.simStatus === 'completed' || s.simStatus === 'aborted') {
        setPlaying(false);
        unsub();
      }
    });
  }, [playing]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full"
      onClick={handleClick}
    >
      {playing ? <Square size={12} /> : <Play size={12} />}
      {playing ? 'STOP DEMO' : 'PLAY DEMO (SCRIPTED)'}
    </Button>
  );
}

interface Preset {
  id: string;
  title: string;
  subtitle: string;
  domains: Domain[];
  description: string;
  country_ids: string[];
  max_turns: number;
  isComingSoon: boolean;
}

const PRESETS: Preset[] = [
  {
    id: 'taiwan-2027',
    title: 'China–Taiwan 2027',
    subtitle: '7 agents · 5 turns · ~40s',
    domains: ['kinetic_limited', 'cyber', 'economic'],
    description:
      'China announces a maritime quarantine of Taiwan\'s shipping lanes under the pretext of anti-smuggling enforcement. PLA Navy deploys Type 055 flotilla and coast-guard cutters; 7th Fleet surges to the Philippine Sea. Taiwan\'s semiconductor supply chain is at immediate risk. How do regional actors respond over 90 days?',
    country_ids: ['CHN', 'TWN', 'USA', 'JPN', 'KOR', 'PHL', 'AUS'],
    max_turns: 5,
    isComingSoon: false,
  },
  {
    id: 'korean-peninsula',
    title: 'Korean Peninsula Crisis',
    subtitle: '6 agents · 5 turns · ~35s',
    domains: ['kinetic_limited', 'info', 'diplomatic'],
    description:
      'North Korea conducts a 7th underground nuclear test (claimed yield 150 kt) and announces a "sea-based Hwasan-19" ICBM test over the Sea of Japan within 30 days. Pyongyang demands lifting of sanctions and recognition as a nuclear state. US strategic bombers deploy to Osan; Seoul elevates Jindogae-3 readiness. How do Washington, Seoul, Tokyo, Beijing, and Moscow navigate the dual-track escalation?',
    country_ids: ['PRK', 'KOR', 'USA', 'JPN', 'CHN', 'RUS'],
    max_turns: 5,
    isComingSoon: false,
  },
  {
    id: 'south-china-sea',
    title: 'South China Sea Standoff',
    subtitle: '5 agents · 5 turns · ~30s',
    domains: ['kinetic_limited', 'diplomatic', 'economic'],
    description:
      'China unilaterally declares an Air Defense Identification Zone (ADIZ) covering the Spratly Islands and parts of Philippine EEZ. J-20 fighters scramble to intercept a Philippine P-3C maritime patrol; a US destroyer conducts a FONOP within 12 nm of Mischief Reef. BRP Sierra Madre resupply at Second Thomas Shoal is blocked by CCG water cannons. How do the parties negotiate between escalation and strategic patience?',
    country_ids: ['CHN', 'PHL', 'USA', 'JPN', 'AUS'],
    max_turns: 5,
    isComingSoon: false,
  },
];

const STATUS_DOT: Record<string, string> = {
  idle: 'bg-outline',
  pending: 'bg-economic animate-pulse',
  running: 'bg-cyber animate-pulse',
  paused: 'bg-economic',
  completed: 'bg-info',
  aborted: 'bg-kinetic',
  error: 'bg-kinetic animate-pulse',
};

export function ScenarioComposer() {
  const [text, setText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const simStatus = useSimStore((s) => s.simStatus);
  const currentTurn = useSimStore((s) => s.currentTurn);
  const maxTurns = useSimStore((s) => s.maxTurns);
  const currentSimId = useSimStore((s) => s.currentSimId);
  const events = useSimStore((s) => s.events);
  const scrubberTurn = useSimStore((s) => s.scrubberTurn);

  const setCurrentScenario = useSimStore((s) => s.setCurrentScenario);
  const setCurrentSimId = useSimStore((s) => s.setCurrentSimId);
  const setSimStatus = useSimStore((s) => s.setSimStatus);
  const setMaxTurns = useSimStore((s) => s.setMaxTurns);
  const setScrubberTurn = useSimStore((s) => s.setScrubberTurn);
  const reset = useSimStore((s) => s.reset);

  const { control } = useSimStream(currentSimId);

  const handlePresetClick = useCallback((preset: Preset) => {
    setSelectedPreset(preset.id);
    setText(preset.description);
    setError(null);
  }, []);

  const doSimulate = useCallback(async () => {
    if (!text.trim()) {
      setError('Please enter a scenario description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    reset();
    setSimStatus('pending');

    try {
      const preset = PRESETS.find((p) => p.id === selectedPreset);
      const scenario = await createScenario({
        title: preset?.title ?? 'Custom Scenario',
        description: text.trim(),
        country_ids: preset?.country_ids?.length
          ? preset.country_ids
          : ['CHN', 'TWN', 'USA', 'JPN', 'KOR', 'PHL', 'AUS', 'PRK', 'RUS', 'IND'],
      });
      setCurrentScenario(scenario);

      const sim = await createSimulation({
        scenario_id: scenario.id,
        max_turns: preset?.max_turns ?? 5,
      });
      setMaxTurns(sim.max_turns);
      setCurrentSimId(sim.id);
      setSimStatus(sim.status);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start simulation.';
      setError(msg);
      setSimStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    text, selectedPreset, reset, setSimStatus, setCurrentScenario,
    setCurrentSimId, setMaxTurns,
  ]);

  const handleSimulateClick = useCallback(() => {
    if (simStatus !== 'idle' && simStatus !== 'completed' && simStatus !== 'aborted') {
      setShowConfirm(true);
    } else {
      doSimulate();
    }
  }, [simStatus, doSimulate]);

  const completedTurns = Math.min(currentTurn, maxTurns);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-outline-variant/30">
        <h1 className="font-mono font-black text-cyber text-lg uppercase tracking-tight">
          SCENARIO_COMPOSER
        </h1>
        <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.2em]">
          V_0.1.0-ALPHA
        </p>
      </div>

      {/* Body (scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Status row */}
        <div className="flex items-center gap-2">
          <span
            className={['w-2 h-2 shrink-0', STATUS_DOT[simStatus] ?? 'bg-outline'].join(' ')}
          />
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
            {simStatus}
          </span>
          {(simStatus === 'running' || simStatus === 'paused' || simStatus === 'completed') && (
            <span className="font-mono text-[10px] text-cyber ml-auto">
              T{currentTurn}/{maxTurns} · {events.length} events
            </span>
          )}
        </div>

        {/* Scenario textarea */}
        <div className="space-y-1.5">
          <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
            Scenario Initialization
          </label>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX_CHARS));
                setError(null);
              }}
              placeholder="China initiates a naval quarantine of Taiwan. How do regional actors respond over 90 days?"
              rows={5}
              disabled={isSubmitting || simStatus === 'running'}
              className={[
                'w-full bg-surface-container-lowest',
                'border-0 border-t border-cyber/60',
                'p-3 font-mono text-xs text-on-surface',
                'focus:outline-none focus:border-cyber',
                'placeholder:text-on-surface-variant/40',
                'resize-none transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              ].join(' ')}
            />
            <span className="absolute bottom-2 right-2 font-mono text-[10px] text-on-surface-variant/50">
              {text.length}/{MAX_CHARS}
            </span>
          </div>
          {error && (
            <p className="font-mono text-[10px] text-kinetic">{error}</p>
          )}
        </div>

        {/* Preset cards */}
        <div className="space-y-2">
          <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
            Global Presets
          </label>
          {PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              title={preset.title}
              subtitle={preset.subtitle}
              domains={preset.domains}
              isComingSoon={preset.isComingSoon}
              isSelected={selectedPreset === preset.id}
              onClick={() => handlePresetClick(preset)}
            />
          ))}
        </div>

        {/* Turn scrubber — only visible when there's a sim */}
        {completedTurns > 0 && (
          <TurnScrubber
            currentTurn={scrubberTurn || currentTurn}
            totalTurns={maxTurns}
            completedTurns={completedTurns}
            onChange={setScrubberTurn}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 space-y-3 border-t border-outline-variant/30">
        {/* Playback controls */}
        <PlaybackControls
          simStatus={simStatus}
          onPause={() => control('pause')}
          onResume={() => control('resume')}
          onAbort={() => control('abort')}
        />

        {/* Simulate button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          disabled={isSubmitting || simStatus === 'running' || simStatus === 'pending'}
          onClick={handleSimulateClick}
        >
          <Terminal size={14} />
          EXECUTE SIMULATION
        </Button>

        {/* Demo button — offline scripted playback, no backend / LLM needed */}
        <DemoButton />
      </div>

      {/* Confirm-resimulate dialog */}
      {showConfirm && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-xs bg-surface-container-high border border-outline-variant p-5 space-y-4">
            <p className="font-mono text-xs text-on-surface">
              This will replace the current simulation. Continue?
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowConfirm(false);
                  doSimulate();
                }}
              >
                Simulate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
