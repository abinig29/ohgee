import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/format";
import type { Finding } from "@/lib/types";
import { cn } from "@/lib/utils";

import { DeviationBar } from "./deviation-bar";
import { EvidenceTable } from "./evidence-table";
import { SeverityTag, severityStyle } from "./severity";

export function FindingCard({
  finding,
  onSelect,
  onDisagree,
}: {
  finding: Finding;
  onSelect: (date: string | null) => void;
  onDisagree: (finding: Finding) => void;
}) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const style = severityStyle(finding.severity);
  const isHigh = finding.severity === "high";

  return (
    <article
      className={cn(
        "border transition-colors",
        isHigh ? "border-alert-high/35 bg-alert-high/6" : "bg-card",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(finding.date)}
        className="block w-full px-4 pt-3.5 pb-1 text-left focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
      >
        <div className="flex items-center justify-between gap-3">
          <SeverityTag severity={finding.severity} />
          <span className="figure text-muted-foreground text-xs">
            {finding.date ? formatDay(finding.date) : "no date"}
          </span>
        </div>
        <h3 className={cn("mt-1.5 font-medium tracking-tight", isHigh && style.text)}>
          {finding.headline}
        </h3>
      </button>

      <div className="space-y-3 px-4 pt-1 pb-4">
        <p className="text-muted-foreground text-sm leading-relaxed">{finding.explanation}</p>

        {finding.evidence ? (
          <DeviationBar deviation={finding.evidence.deviation} severity={finding.severity} />
        ) : null}

        <div className="flex flex-wrap gap-2">
          {finding.evidence ? (
            <Button
              variant="outline"
              size="sm"
              aria-expanded={evidenceOpen}
              onClick={() => setEvidenceOpen((open) => !open)}
            >
              {evidenceOpen ? "Hide the seven days" : "Show the seven days"}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => onDisagree(finding)}>
            Disagree
          </Button>
        </div>

        {evidenceOpen && finding.evidence && finding.date ? (
          <EvidenceTable
            evidence={finding.evidence}
            date={finding.date}
            severity={finding.severity}
          />
        ) : null}
      </div>
    </article>
  );
}
