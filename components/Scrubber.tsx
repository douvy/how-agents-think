"use client";

import { useRef } from "react";
import { clamp01 } from "@/lib/anim";

export function Scrubber({
  ms,
  duration,
  ticks,
  onScrub,
}: {
  ms: number;
  duration: number;
  ticks: number[];
  onScrub: (ms: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const toMs = (clientX: number) => {
    const rect = ref.current!.getBoundingClientRect();
    return clamp01((clientX - rect.left) / rect.width) * duration;
  };

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="timeline"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration / 1000)}
      aria-valuenow={Math.round(ms / 1000)}
      aria-valuetext={`${(ms / 1000).toFixed(1)} of ${Math.round(duration / 1000)} seconds`}
      className="group relative h-8 flex-1 cursor-pointer touch-none select-none max-md:h-11"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onScrub(toMs(e.clientX));
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) onScrub(toMs(e.clientX));
      }}
    >
      {/* track */}
      <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-border" />
      {/* event ticks — consumed ticks warm to mint, so the strip itself
          records what you've already watched */}
      {ticks.map((t, i) => (
        <div
          key={i}
          className={`absolute top-1/2 h-[5px] w-px -translate-y-1/2 ${
            t <= ms ? "bg-accent/40" : "bg-[#4d525e]"
          }`}
          style={{ left: `${(t / duration) * 100}%` }}
        />
      ))}
      {/* progress */}
      <div
        className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-accent"
        style={{ width: `${(ms / duration) * 100}%` }}
      />
      {/* playhead — a real grabbable handle, not a hairline; grows on hover */}
      <div
        className="absolute top-1/2 h-3 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-header-text group-hover:h-4"
        style={{ left: `${(ms / duration) * 100}%` }}
      />
    </div>
  );
}
