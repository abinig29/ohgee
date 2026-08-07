import { buildFindings } from "./detection";
import type { Summary } from "./summary";
import { summarize } from "./summary";
import type {
  CleanRecord,
  Dismissal,
  DismissalMap,
  Finding,
  Severity,
  ValidationResult,
} from "./types";
import { validateDataset } from "./validation";

export type ChartPoint = {
  date: string;
  orders: number;
  aov: number | null;
  severity: Severity | null;
  findingId: string | null;
};

export type Analysis = {
  validation: ValidationResult;
  findings: Finding[];
  summary: Summary;
  points: ChartPoint[];
};

export type DismissedEntry = { finding: Finding; dismissal: Dismissal };

export type Partitioned = {
  business: Finding[];
  dataQuality: Finding[];
  dismissed: DismissedEntry[];
  activeCount: number;
};

export function analyze(raw: unknown): Analysis {
  const validation = validateDataset(raw);
  const findings = buildFindings(validation);
  const summary = summarize(validation.clean);

  const flagged = new Map(
    findings
      .filter((finding) => finding.kind === "business" && finding.date !== null)
      .map((finding) => [finding.date as string, finding]),
  );

  const points = validation.clean.map<ChartPoint>((record) => {
    const finding = flagged.get(record.date);
    return {
      date: record.date,
      orders: record.orders,
      aov: record.revenue === null || record.orders === 0 ? null : record.revenue / record.orders,
      severity: finding?.severity ?? null,
      findingId: finding?.id ?? null,
    };
  });

  return { validation, findings, summary, points };
}

export function neighboursOf(records: CleanRecord[], date: string, span: number): CleanRecord[] {
  const index = records.findIndex((record) => record.date === date);
  if (index === -1) return [];
  return records.slice(Math.max(0, index - span), index + span + 1);
}

export function partitionFindings(findings: Finding[], dismissals: DismissalMap): Partitioned {
  const business: Finding[] = [];
  const dataQuality: Finding[] = [];
  const dismissed: DismissedEntry[] = [];

  for (const finding of findings) {
    const dismissal = dismissals[finding.id];
    if (dismissal) {
      dismissed.push({ finding, dismissal });
    } else if (finding.kind === "business") {
      business.push(finding);
    } else {
      dataQuality.push(finding);
    }
  }

  dismissed.sort((a, b) => b.dismissal.dismissedAt.localeCompare(a.dismissal.dismissedAt));

  return {
    business,
    dataQuality,
    dismissed,
    activeCount: business.length + dataQuality.length,
  };
}
