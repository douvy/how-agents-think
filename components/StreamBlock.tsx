"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Terminal,
  FileText,
  Pencil,
  Search,
  Archive,
  Check,
  MessageCircle,
} from "lucide-react";
import type { Block } from "@/lib/timeline";
import { CreatureFace } from "@/components/Creature";
import { clamp01, enterStyle, gentle, settle } from "@/lib/anim";

const TOOL_ICONS: Record<string, typeof Terminal> = {
  bash: Terminal,
  read: FileText,
  edit: Pencil,
  grep: Search,
  // the everyday track's verbs — same anatomy, no code in sight
  look: Search,
  do: Pencil,
  ask: MessageCircle,
};

export function StreamBlock({
  block,
  ms,
  onPick,
  exitFactor,
  escape,
}: {
  block: Block;
  ms: number;
  onPick?: (choiceId: string, option: string) => void;
  /** Branch-rewrite exit: 1 → 0 as the old future unravels. */
  exitFactor?: number;
  /** Run-opening gates only: the other runs, as a way out for a reader
      who doesn't care about this task and hasn't found the tabs. */
  escape?: { title: string; task: string; go: () => void }[];
}) {
  // Absorption (compaction): block squeezes to nothing as the spring settles.
  const absorbedAt =
    block.kind === "thought" || block.kind === "tool" ? block.absorbedAt : undefined;
  // Measured while live so the squeeze starts from the block's real height —
  // a hard-coded cap would clip tall tool outputs the instant absorption
  // starts. Fallback only matters if you deep-link into the middle of a
  // squeeze, where the block is already near-gone. Exiting blocks render
  // naturally until their stagger slot arrives (exitFactor stays 1), so the
  // measurement lands before the collapse needs it.
  const measureRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(120);
  useEffect(() => {
    if (
      absorbedAt === undefined &&
      (exitFactor === undefined || exitFactor >= 1) &&
      measureRef.current
    ) {
      const h = measureRef.current.offsetHeight;
      if (h !== measured) setMeasured(h);
    }
  }, [absorbedAt, measured, block, exitFactor]);
  const squeeze = 1 - settle(ms, absorbedAt, gentle); // 1 → 0
  if (absorbedAt !== undefined && squeeze <= 0.001) return null;
  if (exitFactor !== undefined && exitFactor <= 0.001) return null;

  // Teleprompter: a block recedes a few seconds after its moment passes so
  // the eye always knows where "now" is. Pure function of ms — scrub back
  // and it re-brightens. The done card never recedes; choice cards stay
  // bright forever because they stay interactive forever.
  const lastActivity =
    block.kind === "tool" ? (block.resultAt ?? block.at) : block.at;
  const recede =
    block.kind === "done" || block.kind === "choice"
      ? 0
      : clamp01((ms - lastActivity - 5000) / 1200);
  const dim = 1 - 0.5 * recede;

  const wrap: CSSProperties =
    exitFactor !== undefined && exitFactor < 1
      ? {
          opacity: clamp01(exitFactor),
          maxHeight: `${clamp01(exitFactor) * measured}px`,
          overflow: "hidden",
        }
      : absorbedAt !== undefined
      ? {
          opacity: clamp01(squeeze),
          maxHeight: `${clamp01(squeeze) * measured}px`,
          overflow: "hidden",
        }
      : (() => {
          const s = enterStyle(ms, block.at);
          return { ...s, opacity: (s.opacity as number) * dim };
        })();

  if (block.kind === "thought") {
    // Inner monologue — the human register, serif italic against tool mono.
    return (
      <div
        ref={measureRef}
        style={wrap}
        className="border-l border-border py-0.5 pl-3 font-serif text-[15px] leading-relaxed text-foreground italic"
      >
        {block.text}
      </div>
    );
  }

  if (block.kind === "tool") {
    const Icon = TOOL_ICONS[block.tool] ?? Terminal;
    return (
      <div ref={measureRef} style={wrap} className="font-mono text-[12px] leading-relaxed">
        {/* Machine voice gets the second hue — blue tool names let the eye
            skip action-to-action without reading every line */}
        <div className="flex items-center gap-2 text-muted">
          <Icon size={12} className="shrink-0 text-link/70" />
          <span className="text-link">{block.tool}</span>
          <span className="truncate text-muted">{block.input}</span>
        </div>
        {/* The mascot speaking about his own action — his face in front of
            it makes it read as speech, not floating metadata, so the
            transcript reads decision → action → evidence on its own. One
            line per call: the beat's narration if it has one, else the why */}
        {(block.note ?? block.why) && (
          <div className="mt-1 flex items-center gap-1.5 pl-5 font-serif text-[13px] leading-snug text-foreground">
            <span className="shrink-0"><CreatureFace size={13} /></span>
            <span>{block.note ?? block.why}</span>
          </div>
        )}
        {block.pending ? (
          <div className="mt-1 pl-5 text-[11px] text-[#a9adb9]">running…</div>
        ) : (
          <div
            style={enterStyle(ms, block.resultAt ?? block.at)}
            className={`mt-1 ml-1.5 border-l pl-3 text-[12px] ${
              block.ok
                ? "border-border text-muted"
                : "border-accent-negative/60 text-foreground"
            }`}
          >
            {block.output}
            {/* His reaction to the evidence — captioned right under it,
                so interpretation never asks the eye to leave the column */}
            {block.resultNote && (
              <div className="mt-1 flex items-center gap-1.5 font-serif text-[13px] leading-snug text-foreground">
                <span className="shrink-0"><CreatureFace size={13} /></span>
                <span>{block.resultNote}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (block.kind === "choice") {
    // The reader's beat — rendered as the human's collaborator cursor
    // arriving in the agent's stream: cream caret on the left edge +
    // selection tint, the exact anatomy the task bar taught. Live = full
    // tint; answered = the caret stays (this block is the human's mark)
    // but the wash settles. Options are Zed inline chips; the picked one
    // carries a check. Answered cards stay clickable forever — flipping
    // the pick rewrites everything downstream.
    const pending = block.picked === undefined;
    return (
      <>
      <div
        style={enterStyle(ms, block.at)}
        className={`relative overflow-hidden rounded-sm px-3 py-2.5 ${
          pending ? "bg-human/10" : "border border-border bg-surface"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0 bottom-0 left-0 w-[2px] ${
            pending ? "bg-human" : "bg-human/40"
          }`}
        />
        <div className="mb-1.5 flex items-center justify-between">
          <span
            className={`text-[10px] font-medium tracking-[0.09em] uppercase ${
              pending ? "text-human" : "text-[#dcdfe3]"
            }`}
          >
            your call
          </span>
          {pending && (
            <span className="font-mono text-[10px] text-human">waiting on you</span>
          )}
        </div>
        <div className="mb-2.5 font-serif text-[15px] leading-snug text-header-text italic">
          {block.prompt}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {block.options.map((o) => {
            const isPicked = block.picked === o.id;
            return (
              <button
                key={o.id}
                onClick={() => onPick?.(block.choiceId, o.id)}
                className={`flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[12px] transition-colors max-md:px-2 max-md:py-1.5 ${
                  isPicked
                    ? "bg-human/25 text-[#f7f6f0]"
                    : pending
                      ? "bg-human/10 text-human hover:bg-human/20"
                      : "bg-human/10 text-[#9b998c] hover:bg-human/20 hover:text-human"
                }`}
              >
                {isPicked && <Check size={10} className="opacity-80" />}
                {o.label}
              </button>
            );
          })}
        </div>
        {!pending && (
          <div className="mt-2 font-mono text-[10px] text-[#a9adb9]">
            switch anytime — everything after rewrites
          </div>
        )}
      </div>
      {/* the escape hatch — its own block below the card, because it's a
          different thing: the card is the agent's question, this is the
          player's exit row. Product register (mono, muted); each run
          shows its task so the choice is between stories, not mystery
          titles. Enters with the card, gone once the gate is answered. */}
      {pending && escape && (
        <div
          style={enterStyle(ms, block.at)}
          className="font-mono text-[11px] text-[#a9adb9]"
        >
          <div>not interested in these tasks?</div>
          {escape.map((e) => (
            <div key={e.title} className="mt-1">
              <button
                onClick={e.go}
                className="underline decoration-white/20 underline-offset-2 hover:text-header-text hover:decoration-white"
              >
                {e.title}
              </button>
              <span className="text-[#7b7e8a]"> — “{e.task}”</span>
            </div>
          ))}
        </div>
      )}
      </>
    );
  }

  if (block.kind === "compact") {
    return (
      <div
        style={enterStyle(ms, block.at)}
        className="rounded-sm border border-border bg-surface px-3 py-2.5"
      >
        <div className="mb-1 flex items-center gap-2">
          <Archive size={11} className="text-warning" />
          <span className="label">compacted</span>
        </div>
        <div className="font-mono text-[12px] leading-relaxed text-muted">
          {block.summary}
        </div>
      </div>
    );
  }

  // The verdict — unboxed on purpose: a mint bar and the final spoken
  // line, echoing the thought blocks' anatomy so it can't be mistaken
  // for the raised buttons that follow it at the end frame.
  return (
    <div
      style={enterStyle(ms, block.at)}
      className="border-l-2 border-accent py-0.5 pl-3"
    >
      <div className="label mb-1 text-accent">done</div>
      <div className="font-serif text-[17px] text-header-text italic">
        {block.verdict}
      </div>
      {/* The recap — the run's evidence for its verdict, so the reader
          leaves with the reasoning, not just the slogan */}
      {block.takeaway && (
        <ul className="mt-2 space-y-1">
          {block.takeaway.map((t) => (
            <li
              key={t}
              className="flex gap-2 font-serif text-[13px] leading-snug text-foreground"
            >
              <span className="shrink-0 text-accent">·</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
