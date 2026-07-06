import { Check } from "lucide-react";
import type { PlanView } from "@/lib/timeline";
import { clamp01, enterStyle, gentle, settle } from "@/lib/anim";

export function Plan({ plan, label, ms }: { plan: PlanView; label: string; ms: number }) {
  const death = 1 - settle(ms, plan.deadAt, gentle); // 1 → 0 as death settles
  const dead = plan.deadAt !== undefined;
  return (
    <div
      style={{
        ...enterStyle(ms, plan.at),
        ...(dead
          ? {
              opacity: 0.35 + 0.65 * clamp01(death),
              transform: `scale(${0.97 + 0.03 * clamp01(death)})`,
              transformOrigin: "top left",
            }
          : {}),
      }}
    >
      <div className="mb-2 flex items-baseline gap-2">
        <span className="label">{label}</span>
        {dead && (
          <span
            className="font-mono text-[10px] text-accent-negative"
            style={{ opacity: clamp01(settle(ms, plan.deadAt)) }}
          >
            † {plan.deadReason}
          </span>
        )}
      </div>
      <ol className="space-y-1.5">
        {plan.steps.map((step, i) => {
          const st = plan.status[i];
          return (
            <li
              key={i}
              className={`flex items-start gap-2 font-mono text-[12px] leading-snug ${
                st === "active" && !dead
                  ? "text-header-text"
                  : st === "done"
                    ? "text-muted"
                    : "text-[#636a76]"
              }`}
            >
              <span className="mt-px w-3 shrink-0">
                {st === "done" ? (
                  <Check size={11} className="text-accent" strokeWidth={2.5} />
                ) : st === "active" && !dead ? (
                  <span className="text-accent">▸</span>
                ) : (
                  <span>·</span>
                )}
              </span>
              <span className={st === "done" ? "line-through decoration-[#4d525e]" : ""}>
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
