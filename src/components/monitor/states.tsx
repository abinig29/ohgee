import type { DataIssue } from "@/lib/types";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border bg-card px-5 py-6">
      <h2 className="font-mono font-semibold text-lg tracking-tight">{title}</h2>
      <div className="mt-2 space-y-3 text-muted-foreground text-sm">{children}</div>
    </section>
  );
}

export function DatasetError({ issues }: { issues: DataIssue[] }) {
  return (
    <Panel title="The dataset cannot be read">
      <p>
        Nothing in <code className="figure text-foreground">src/data/orders.json</code> survived
        validation, so there is nothing to measure. Every row was rejected for one of the reasons
        below. Fix the file and reload.
      </p>
      {issues.length > 0 ? (
        <ul className="space-y-1">
          {issues.slice(0, 8).map((issue) => (
            <li key={`${issue.index}-${issue.type}`} className="flex gap-2">
              <span className="eyebrow w-20 shrink-0 pt-0.5">Row {issue.index + 1}</span>
              <span>{issue.reason}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          The file did not parse as a list of daily records. It must be a JSON array of objects with{" "}
          <code className="figure text-foreground">date</code>,{" "}
          <code className="figure text-foreground">orders</code> and{" "}
          <code className="figure text-foreground">revenue</code>.
        </p>
      )}
    </Panel>
  );
}

export function EmptyDataset() {
  return (
    <Panel title="No days to monitor yet">
      <p>
        The dataset is empty. Add daily records to{" "}
        <code className="figure text-foreground">src/data/orders.json</code> and the monitor will
        start comparing each day against the seven before it.
      </p>
      <p>It needs at least eight days before it can flag anything.</p>
    </Panel>
  );
}

export function AllClear({ dayCount }: { dayCount: number }) {
  return (
    <section className="border bg-card px-5 py-6">
      <h2 className="font-mono font-semibold text-lg tracking-tight">Nothing to look at</h2>
      <p className="mt-2 text-muted-foreground text-sm">
        Every one of the last {dayCount} days sits within 50% of its own 7-day average, and every
        row in the file read cleanly. There is no finding to show. That is the result, not a gap.
      </p>
    </section>
  );
}
