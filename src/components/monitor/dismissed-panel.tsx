import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { DismissedEntry } from "@/lib/analysis";
import { formatDay } from "@/lib/format";

const STAMP = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function stamp(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : STAMP.format(parsed);
}

export function DismissedPanel({
  entries,
  onRestore,
  onClearAll,
}: {
  entries: DismissedEntry[];
  onRestore: (id: string) => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <section className="border border-dashed">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={open}
          className="-mx-2"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Hide" : "Show"} dismissed ({entries.length})
        </Button>
        {open ? (
          <Button variant="ghost" size="sm" className="-mx-2" onClick={onClearAll}>
            Clear all dismissals
          </Button>
        ) : null}
      </div>

      {open ? (
        <ul className="space-y-2 border-t px-4 py-3">
          {entries.map(({ finding, dismissal }) => (
            <li key={finding.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="figure text-muted-foreground">
                    {finding.date ? formatDay(finding.date) : "no date"}
                  </span>{" "}
                  {finding.headline}
                </p>
                <p className="text-muted-foreground text-xs">
                  {dismissal.reason} · dismissed {stamp(dismissal.dismissedAt)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onRestore(finding.id)}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
