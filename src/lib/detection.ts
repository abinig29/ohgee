import { formatDay, formatNumber, formatPercent } from "./format";
import type {
  BaselineDay,
  CleanRecord,
  DataIssue,
  Finding,
  Severity,
  ValidationResult,
} from "./types";

export const BASELINE_WINDOW = 7;
export const DEVIATION_THRESHOLD = 0.5;
export const HIGH_SEVERITY_DEVIATION = 1;

const ISSUE_HEADLINES = {
  MISSING_DATA: "Missing data",
  INVALID_RECORD: "Unusable record",
  DUPLICATE_DATE: "Duplicate date",
} as const;

function averageOrders(window: CleanRecord[]): number {
  return window.reduce((sum, record) => sum + record.orders, 0) / window.length;
}

function valuePerOrder(record: CleanRecord): number | null {
  if (record.revenue === null || record.orders <= 0) return null;
  return record.revenue / record.orders;
}

function severityFor(deviation: number): Severity {
  return Math.abs(deviation) >= HIGH_SEVERITY_DEVIATION ? "high" : "medium";
}

function toWindow(records: CleanRecord[], value: (record: CleanRecord) => number): BaselineDay[] {
  return records.map((record) => ({ date: record.date, value: value(record) }));
}

function ordersFinding(record: CleanRecord, window: CleanRecord[]): Finding | null {
  const baseline = averageOrders(window);
  if (baseline <= 0) return null;

  const deviation = (record.orders - baseline) / baseline;
  if (Math.abs(deviation) <= DEVIATION_THRESHOLD) return null;

  const type = deviation > 0 ? "SPIKE" : "COLLAPSE";

  return {
    id: `${type}:${record.date}`,
    date: record.date,
    type,
    severity: severityFor(deviation),
    kind: "business",
    headline: type === "SPIKE" ? "Orders spiked" : "Orders collapsed",
    explanation: `${formatDay(record.date)} had ${formatNumber(record.orders)} orders. The previous ${BASELINE_WINDOW} days averaged ${formatNumber(baseline)}. That is ${formatPercent(deviation)}, past the ±50% threshold.`,
    evidence: {
      metric: "orders",
      actual: record.orders,
      baseline,
      deviation,
      window: toWindow(window, (day) => day.orders),
    },
  };
}

function aovFinding(record: CleanRecord, window: CleanRecord[]): Finding | null {
  const actual = valuePerOrder(record);
  if (actual === null) return null;

  const comparable = window.filter((day) => valuePerOrder(day) !== null);
  if (comparable.length < BASELINE_WINDOW) return null;

  const baseline =
    comparable.reduce((sum, day) => sum + (valuePerOrder(day) as number), 0) / comparable.length;
  if (baseline <= 0) return null;

  const deviation = (actual - baseline) / baseline;
  if (deviation >= -DEVIATION_THRESHOLD) return null;

  return {
    id: `AOV_DROP:${record.date}`,
    date: record.date,
    type: "AOV_DROP",
    severity: severityFor(deviation),
    kind: "business",
    headline: "Value per order fell",
    explanation: `${formatDay(record.date)} took ${formatNumber(actual)} per order against a ${BASELINE_WINDOW}-day average of ${formatNumber(baseline)}, a change of ${formatPercent(deviation)}, while the order count held steady. Same customers, each spending less.`,
    evidence: {
      metric: "aov",
      actual,
      baseline,
      deviation,
      window: toWindow(comparable, (day) => valuePerOrder(day) as number),
    },
  };
}

export function detectAnomalies(records: CleanRecord[]): Finding[] {
  const findings: Finding[] = [];

  records.forEach((record, index) => {
    if (index < BASELINE_WINDOW) return;

    const window = records.slice(index - BASELINE_WINDOW, index);
    const orders = ordersFinding(record, window);

    if (orders) {
      findings.push(orders);
      return;
    }

    const aov = aovFinding(record, window);
    if (aov) findings.push(aov);
  });

  return findings;
}

function issueFinding(issue: DataIssue): Finding {
  return {
    id: `${issue.type}:${issue.date ?? `row-${issue.index}`}`,
    date: issue.date,
    type: issue.type,
    severity: "low",
    kind: "data-quality",
    headline: ISSUE_HEADLINES[issue.type],
    explanation: issue.date ? issue.reason : `Row ${issue.index + 1}. ${issue.reason}`,
    evidence: null,
  };
}

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

function withUniqueIds(findings: Finding[]): Finding[] {
  const seen = new Map<string, number>();

  return findings.map((finding) => {
    const count = seen.get(finding.id) ?? 0;
    seen.set(finding.id, count + 1);
    return count === 0 ? finding : { ...finding, id: `${finding.id}#${count}` };
  });
}

export function buildFindings(validation: ValidationResult): Finding[] {
  const findings = [
    ...detectAnomalies(validation.clean),
    ...validation.issues.map(issueFinding),
  ].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return (b.date ?? "").localeCompare(a.date ?? "");
  });

  return withUniqueIds(findings);
}
