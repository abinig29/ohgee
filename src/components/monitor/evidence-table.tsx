import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFullDay, formatNumber } from "@/lib/format";
import type { FindingEvidence, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

import { severityStyle } from "./severity";

export function EvidenceTable({
  evidence,
  date,
  severity,
}: {
  evidence: FindingEvidence;
  date: string;
  severity: Severity;
}) {
  const heading = evidence.metric === "orders" ? "Orders" : "Per order";
  const style = severityStyle(severity);

  return (
    <div className="border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="eyebrow h-8">Baseline day</TableHead>
            <TableHead className="eyebrow h-8 text-right">{heading}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evidence.window.map((day) => (
            <TableRow key={day.date} className="border-0">
              <TableCell className="py-1.5 text-muted-foreground">
                {formatFullDay(day.date)}
              </TableCell>
              <TableCell className="figure py-1.5 text-right">{formatNumber(day.value)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t bg-muted/40 hover:bg-muted/40">
            <TableCell className="py-1.5 font-medium">Average of those 7</TableCell>
            <TableCell className="figure py-1.5 text-right font-medium">
              {formatNumber(evidence.baseline)}
            </TableCell>
          </TableRow>
          <TableRow className="border-t hover:bg-transparent">
            <TableCell className={cn("py-1.5 font-medium", style.text)}>
              {formatFullDay(date)}, the flagged day
            </TableCell>
            <TableCell className={cn("figure py-1.5 text-right font-medium", style.text)}>
              {formatNumber(evidence.actual)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
