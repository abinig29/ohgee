import { formatPercent } from "@/lib/format";
import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

import { severityStyle } from "./severity";

const FLOOR = -1;
const CEILING = 2;
const QUIET = 0.5;

function positionOf(deviation: number) {
  const clamped = Math.min(CEILING, Math.max(FLOOR, deviation));
  return ((clamped - FLOOR) / (CEILING - FLOOR)) * 100;
}

const BASELINE = positionOf(0);
const QUIET_START = positionOf(-QUIET);
const QUIET_END = positionOf(QUIET);

const TICKS = [-1, -0.5, 0, 0.5, 1, 2];

function tickLabel(value: number) {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : "−"}${Math.abs(value) * 100}%`;
}

export function DeviationBar({ deviation, severity }: { deviation: number; severity: Severity }) {
  const position = positionOf(deviation);
  const style = severityStyle(severity);
  const labelPosition = Math.min(88, Math.max(12, position));

  return (
    <div className="pt-1">
      <div className="relative h-4">
        <span
          className={cn("figure absolute -translate-x-1/2 font-medium text-xs", style.text)}
          style={{ left: `${labelPosition}%` }}
        >
          {formatPercent(deviation)}
        </span>
      </div>

      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        <div
          className="absolute inset-y-0 bg-muted"
          style={{ left: `${QUIET_START}%`, width: `${QUIET_END - QUIET_START}%` }}
        />
        <div
          className="absolute inset-y-1 w-px bg-foreground/45"
          style={{ left: `${BASELINE}%` }}
        />
        <div
          className={cn("absolute inset-y-0 w-[3px] -translate-x-1/2 rounded-full", style.rule)}
          style={{ left: `${position}%` }}
        />
      </div>

      <div className="relative h-1.5">
        {TICKS.map((value) => (
          <span
            key={value}
            aria-hidden
            className="absolute top-0 h-1.5 w-px bg-border"
            style={{ left: `${positionOf(value)}%` }}
          />
        ))}
      </div>

      <div className="relative mt-1 h-4">
        {TICKS.map((value) => {
          const left = positionOf(value);
          const edge = left === 0 ? "left-0" : left === 100 ? "right-0" : undefined;

          return (
            <span
              key={value}
              className={cn("figure absolute top-0 text-[0.62rem] text-muted-foreground", edge)}
              style={edge ? undefined : { left: `${left}%`, transform: "translateX(-50%)" }}
            >
              {tickLabel(value)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
