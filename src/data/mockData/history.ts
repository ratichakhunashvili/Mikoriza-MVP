import type { Point, SectionHistory, SectionId } from '../../types';
import { HOUR, MIN, DAY } from '../../lib/format';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SeriesOpts {
  seed: number;
  now: number;
  count: number;
  stepMs: number;
  base: number;
  amp: number;
  periodMs: number;
  noise: number;
  min: number;
  max: number;
  dip?: { at: number; depth: number; widthMs: number };
}

function series(o: SeriesOpts): Point[] {
  const rnd = mulberry32(o.seed);
  const pts: Point[] = [];
  for (let i = o.count - 1; i >= 1; i--) {
    const t = o.now - i * o.stepMs;
    let v = o.base + o.amp * Math.sin((2 * Math.PI * (t % o.periodMs)) / o.periodMs);
    v += (rnd() - 0.5) * 2 * o.noise;
    if (o.dip) v -= o.dip.depth * Math.exp(-(((t - o.dip.at) / o.dip.widthMs) ** 2));
    pts.push({ t, v: Math.min(o.max, Math.max(o.min, +v.toFixed(2))) });
  }
  return pts;
}

const SEEDS: Record<SectionId, number> = { A: 11, B: 23, C: 37 };

/** სატესტო ისტორია: საბოლოო წერტილი (ახლანდელი მნიშვნელობა) გრაფიკში ცალკე ემატება */
export function buildHistory(id: SectionId, now: number, base: { ph: number; temperature: number; humidity: number }): SectionHistory {
  const seed = SEEDS[id];
  return {
    humidity: series({
      seed,
      now,
      count: 49,
      stepMs: 30 * MIN,
      base: base.humidity,
      amp: 1.8,
      periodMs: DAY,
      noise: 0.7,
      min: 40,
      max: 90,
      dip: id === 'A' ? { at: now - 3 * HOUR, depth: 8, widthMs: 35 * MIN } : undefined,
    }),
    temperature: series({
      seed: seed + 1,
      now,
      count: 49,
      stepMs: 30 * MIN,
      base: base.temperature,
      amp: 0.9,
      periodMs: DAY,
      noise: 0.25,
      min: 10,
      max: 40,
    }),
    ph: series({
      seed: seed + 2,
      now,
      count: 57,
      stepMs: 3 * HOUR,
      base: base.ph,
      amp: 0.08,
      periodMs: 2 * DAY,
      noise: 0.04,
      min: 4,
      max: 9,
    }),
  };
}
