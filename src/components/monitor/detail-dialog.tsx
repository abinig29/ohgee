import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDay, formatFullDay, formatNumber } from "@/lib/format";
import type { CleanRecord, Finding } from "@/lib/types";
import { cn } from "@/lib/utils";

import { severityStyle } from "./severity";

function perOrder(record: CleanRecord) {
  if (record.revenue === null || record.orders === 0) return null;
  return record.revenue / record.orders;
}

export function DetailDialog({
  date,
  neighbours,
  finding,
  onOpenChange,
}: {
  date: string | null;
  neighbours: CleanRecord[];
  finding: Finding | null;
  onOpenChange: (open: boolean) => void;
}) {
  const record = neighbours.find((entry) => entry.date === date) ?? null;

  return (
    <Dialog open={record !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {record === null ? null : (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono tracking-tight">
                {formatFullDay(record.date)}
              </DialogTitle>
              <DialogDescription
                className={cn(finding ? severityStyle(finding.severity).text : undefined)}
              >
                {finding ? finding.headline : "Nothing flagged on this day."}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-3 gap-3 border-y py-4">
              <div>
                <dt className="eyebrow">Orders</dt>
                <dd className="figure mt-1 font-medium text-lg">{formatNumber(record.orders)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Revenue</dt>
                <dd className="figure mt-1 font-medium text-lg">
                  {record.revenue === null ? "n/a" : formatCurrency(record.revenue)}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Per order</dt>
                <dd className="figure mt-1 font-medium text-lg">
                  {perOrder(record) === null ? "n/a" : formatNumber(perOrder(record) as number)}
                </dd>
              </div>
            </dl>

            <div>
              <p className="eyebrow mb-2">The days either side</p>
              <div className="space-y-0.5">
                {neighbours.map((entry) => {
                  const isSelected = entry.date === record.date;
                  return (
                    <div
                      key={entry.date}
                      className={cn(
                        "flex items-center justify-between gap-3 px-2 py-1 text-sm",
                        isSelected
                          ? "bg-alert-high/10 font-medium text-alert-high"
                          : "text-muted-foreground",
                      )}
                    >
                      <span className="figure">{formatFullDay(entry.date)}</span>
                      <span className="figure">{formatNumber(entry.orders)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-muted-foreground text-xs">
                {formatDay(record.date)} sits in the middle. Days rejected by validation are not
                shown. They carry no numbers to compare.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
