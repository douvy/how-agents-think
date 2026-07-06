import { clamp01, gentle, reducedMotion, settle } from "@/lib/anim";

// The trilogy landing: a window-wide mint flash and a two-second rain of
// pixel confetti when the set-completing done fires. Pure f(ms) like all
// motion here — pieces step down a coarse grid (discrete frames, no
// easing), their positions hashed from their index, so scrubbing back
// un-confettis. Renders only during the burst; the parked end frame
// afterward belongs to the trophy card.
const CONFETTI = Array.from({ length: 26 }, (_, i) => {
  const h = (n: number) => {
    const s = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  return {
    x: 3 + h(1) * 94, // % across the window
    delay: h(2) * 500,
    fall: 1100 + h(3) * 500,
    drift: (h(4) - 0.5) * 26, // px of sideways wander over the fall
    size: 3 + Math.round(h(5) * 3),
    color: ["#84f0a1", "#ffffc9", "#eceae0"][i % 3],
  };
});

export function FinaleBurst({ ms, at }: { ms: number; at: number }) {
  const t = ms - at;
  if (t <= 0 || t >= 2200) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
    >
      {/* the tab ceremony's flash at window scale — the biggest wash in
          the app, reserved for the biggest moment */}
      <div
        className="absolute inset-0 bg-accent"
        style={{ opacity: 0.09 * (1 - clamp01(settle(ms, at + 150, gentle))) }}
      />
      {!reducedMotion &&
        CONFETTI.map((c, i) => {
          const p = (t - c.delay) / c.fall;
          if (p <= 0 || p >= 1) return null;
          const f = Math.floor(p * 16) / 16; // stepped, pixel-frame fall
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: `${f * 104}%`,
                width: c.size,
                height: c.size,
                background: c.color,
                transform: `translateX(${f * c.drift}px)`,
              }}
            />
          );
        })}
    </div>
  );
}
