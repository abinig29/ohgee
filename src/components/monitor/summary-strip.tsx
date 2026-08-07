import { formatCurrency, formatDay, formatNumber } from "@/lib/format";
import type { Summary } from "@/lib/summary";
import { cn } from "@/lib/utils";

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="eyebrow">{label}</dt>
      <dd className="figure font-medium text-lg leading-none">
        {value}
        {note ? <span className="ml-1.5 text-muted-foreground text-xs">{note}</span> : null}
      </dd>
    </div>
  );
}

export function SummaryStrip({
  summary,
  verdict,
  needsAttention,
}: {
  summary: Summary;
  verdict: string;
  needsAttention: boolean;
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="eyebrow flex items-center gap-2">
          {needsAttention ? (
            <span aria-hidden className="size-1.5 rounded-full bg-alert-high" />
          ) : null}
          This morning
        </p>
        <h1
          className={cn(
            "text-balance font-mono font-semibold text-2xl leading-tight tracking-tight sm:text-3xl",
            needsAttention && "text-alert-high",
          )}
        >
          {verdict}
        </h1>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-5 sm:grid-cols-3">
        <Stat
          label="Orders"
          value={formatNumber(summary.totalOrders)}
          note={`over ${summary.dayCount} days`}
        />
        <Stat label="Daily average" value={formatNumber(summary.dailyAverage)} />
        <Stat
          label="Best day"
          value={summary.bestDay ? formatDay(summary.bestDay.date) : "n/a"}
          note={summary.bestDay ? `${formatNumber(summary.bestDay.orders)} orders` : undefined}
        />
      </dl>

      <p className="sr-only">Total revenue {formatCurrency(summary.totalRevenue)}.</p>
    </section>
  );
}
