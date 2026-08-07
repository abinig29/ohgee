import { describe, expect, it } from "vitest";

import { buildFindings, detectAnomalies } from "./detection";
import type { CleanRecord, DataIssue } from "./types";

function series(orders: number[], aov = 30): CleanRecord[] {
  return orders.map((count, index) => ({
    date: `2026-03-${String(index + 1).padStart(2, "0")}`,
    orders: count,
    revenue: Math.round(count * aov * 100) / 100,
  }));
}

const steady = [120, 118, 122, 119, 121, 120, 120];

describe("detectAnomalies", () => {
  it("flags a day far above the 7-day baseline as a spike", () => {
    const findings = detectAnomalies(series([...steady, 340]));

    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("SPIKE");
    expect(findings[0].date).toBe("2026-03-08");
  });

  it("flags a day far below the 7-day baseline as a collapse", () => {
    const findings = detectAnomalies(series([...steady, 12]));

    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("COLLAPSE");
  });

  it("leaves quiet data unflagged", () => {
    expect(detectAnomalies(series([...steady, 130]))).toEqual([]);
  });

  it("does not flag a day sitting exactly on the threshold", () => {
    const findings = detectAnomalies(series([100, 100, 100, 100, 100, 100, 100, 150]));

    expect(findings).toEqual([]);
  });

  it("never flags the first seven days, because no baseline exists yet", () => {
    expect(detectAnomalies(series([120, 400, 12, 380, 9, 300, 118]))).toEqual([]);
  });

  it("records the actual, baseline and deviation behind a finding", () => {
    const findings = detectAnomalies(series([...steady, 340]));
    const evidence = findings[0].evidence;

    expect(evidence?.metric).toBe("orders");
    expect(evidence?.actual).toBe(340);
    expect(evidence?.baseline).toBeCloseTo(120, 5);
    expect(evidence?.deviation).toBeCloseTo(340 / 120 - 1, 5);
  });

  it("carries the seven baseline days as the evidence window", () => {
    const findings = detectAnomalies(series([...steady, 340]));

    expect(findings[0].evidence?.window.map((day) => day.date)).toEqual([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
    ]);
  });

  it("rates a deviation of 100% or more as high severity", () => {
    expect(detectAnomalies(series([...steady, 340]))[0].severity).toBe("high");
  });

  it("flags a fall in revenue per order while order count holds", () => {
    const records = series(steady);
    records.push({ date: "2026-03-08", orders: 121, revenue: Math.round(121 * 13.4 * 100) / 100 });

    const findings = detectAnomalies(records);

    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("AOV_DROP");
  });

  it("does not report an AOV drop when the order count itself collapsed", () => {
    const records = series(steady);
    records.push({ date: "2026-03-08", orders: 12, revenue: Math.round(12 * 13.4 * 100) / 100 });

    const findings = detectAnomalies(records);

    expect(findings.map((finding) => finding.type)).toEqual(["COLLAPSE"]);
  });

  it("survives a baseline of zero without dividing by it", () => {
    const records = series([0, 0, 0, 0, 0, 0, 0, 140]);

    expect(() => detectAnomalies(records)).not.toThrow();
    expect(detectAnomalies(records)).toEqual([]);
  });
});

describe("buildFindings", () => {
  const issue: DataIssue = {
    type: "DUPLICATE_DATE",
    date: "2026-03-02",
    index: 3,
    reason: "This date was already recorded.",
  };

  it("turns data-quality issues into low-severity findings", () => {
    const findings = buildFindings({ clean: [], issues: [issue], datasetMalformed: false });

    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("low");
    expect(findings[0].kind).toBe("data-quality");
  });

  it("sorts by severity, then by recency", () => {
    const records = series([...steady, 190, 118, 119, 121, 120, 122, 120, 340]);
    const findings = buildFindings({ clean: records, issues: [issue], datasetMalformed: false });

    expect(findings.map((finding) => finding.severity)).toEqual(["high", "medium", "low"]);
    expect(findings[0].type).toBe("SPIKE");
  });
});
