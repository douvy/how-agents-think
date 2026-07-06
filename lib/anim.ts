import type { CSSProperties } from "react";
import { createSpring, presets } from "@/lib/spring";

// All motion below is a pure function of (ms - eventTimestamp) through the
// solver. Play and scrub render through the identical code path — scrubbing
// slowly is literally slow-motion.
export const snappy = createSpring(presets.snappy);
export const gentle = createSpring(presets.gentle);

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// prefers-reduced-motion collapses every spring to an instant cut — same
// states, no easing. Read once at load; `ms > since` (not >=) keeps the
// first server-rendered frame identical, so hydration never mismatches.
export const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 0 → 1 settle progress since a timestamp; 1 when settled or never fired. */
export function settle(
  ms: number,
  since: number | undefined,
  spring = snappy,
): number {
  if (since === undefined) return 1;
  if (reducedMotion) return ms > since ? 1 : 0;
  const age = (ms - since) / 1000;
  if (age <= 0) return 0;
  return 1 - spring.at(age); // may overshoot past 1 — that's the point
}

export function enterStyle(ms: number, at: number): CSSProperties {
  const p = settle(ms, at);
  return {
    opacity: clamp01(p),
    transform: `translateY(${(1 - p) * 10}px)`,
  };
}
