import { describe, it, expect } from 'vitest';
import {
  getDomainMeta,
  getDomainColor,
  getDomainLabel,
  matchesDomainFilter,
} from '@/lib/domain';
import type { Domain } from '@/lib/types/sim-event';

describe('getDomainMeta', () => {
  it('returns correct hex for cyber', () => {
    expect(getDomainMeta('cyber').hex).toBe('#5bc9ff');
  });

  it('returns correct hex for kinetic_limited', () => {
    expect(getDomainMeta('kinetic_limited').hex).toBe('#ff5c7a');
  });

  it('returns correct hex for economic', () => {
    expect(getDomainMeta('economic').hex).toBe('#f5a623');
  });

  it('returns correct hex for info', () => {
    expect(getDomainMeta('info').hex).toBe('#a78bfa');
  });

  it('diplomatic maps to info color', () => {
    expect(getDomainMeta('diplomatic').hex).toBe(getDomainMeta('info').hex);
  });

  it('kinetic_general maps to kinetic color', () => {
    expect(getDomainMeta('kinetic_general').hex).toBe(getDomainMeta('kinetic_limited').hex);
  });
});

describe('getDomainColor', () => {
  it('returns hex string', () => {
    const color = getDomainColor('cyber');
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('getDomainLabel', () => {
  it('returns uppercase label', () => {
    expect(getDomainLabel('cyber')).toBe('CYBER');
    expect(getDomainLabel('kinetic_limited')).toBe('KINETIC');
  });
});

describe('matchesDomainFilter', () => {
  const cases: [Domain, Parameters<typeof matchesDomainFilter>[1], boolean][] = [
    ['cyber', 'ALL', true],
    ['cyber', 'CYBER', true],
    ['cyber', 'KINETIC', false],
    ['kinetic_limited', 'KINETIC', true],
    ['kinetic_general', 'KINETIC', true],
    ['economic', 'ECONOMIC', true],
    ['info', 'INFO', true],
    ['diplomatic', 'INFO', true],
    ['diplomatic', 'CYBER', false],
  ];

  it.each(cases)('domain=%s, filter=%s → %s', (domain, filter, expected) => {
    expect(matchesDomainFilter(domain, filter)).toBe(expected);
  });
});
