import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/format";
import type { Finding } from "@/lib/types";

const QUALITY_LABEL = {
  MISSING_DATA: "Missing",
  INVALID_RECORD: "Unusable",
  DUPLICATE_DATE: "Duplicate",
} as const;

function labelFor(finding: Finding) {
  return QUALITY_LABEL[finding.type as keyof typeof QUALITY_LABEL] ?? "Issue";
}

export function DataQualityList({
  findings,
  onDisagree,
}: {
  findings: Finding[];
  onDisagree: (finding: Finding) => void;
}) {
  return (
    <section className="border">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b bg-muted/40 px-4 py-2.5">
        <h2 className="eyebrow">Data quality</h2>
        <p className="text-muted-foreground text-xs">
          {findings.length} {findings.length === 1 ? "row" : "rows"} never reached the analysis. A
          problem with the file, not the store.
        </p>
      </header>

      <ul className="divide-y">
        {findings.map((finding) => (
          <li key={finding.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
            <span className="eyebrow shrink-0 border px-1.5 py-0.5 text-foreground/75">
              {labelFor(finding)}
            </span>
            <span className="figure shrink-0 text-muted-foreground text-xs">
              {finding.date ? formatDay(finding.date) : "no date"}
            </span>
            <p className="min-w-40 flex-1 text-muted-foreground text-sm">{finding.explanation}</p>
            <Button
              variant="ghost"
              size="sm"
              className="-my-1 ml-auto shrink-0"
              onClick={() => onDisagree(finding)}
            >
              Disagree
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
