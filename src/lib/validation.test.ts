import { describe, expect, it } from "vitest";

import { validateDataset } from "./validation";

describe("validateDataset", () => {
  it("keeps a well-formed record", () => {
    const result = validateDataset([{ date: "2026-03-01", orders: 120, revenue: 3600 }]);

    expect(result.clean).toEqual([{ date: "2026-03-01", orders: 120, revenue: 3600 }]);
    expect(result.issues).toEqual([]);
  });

  it("rejects a record with a missing date", () => {
    const result = validateDataset([{ orders: 120, revenue: 3600 }]);

    expect(result.clean).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe("INVALID_RECORD");
  });

  it("rejects a record with an unparseable date", () => {
    const result = validateDataset([{ date: "2026-13-45", orders: 120, revenue: 3600 }]);

    expect(result.clean).toEqual([]);
    expect(result.issues[0].type).toBe("INVALID_RECORD");
    expect(result.issues[0].date).toBe("2026-13-45");
  });

  it("keeps the first of a duplicated date and reports the second", () => {
    const result = validateDataset([
      { date: "2026-03-01", orders: 120, revenue: 3600 },
      { date: "2026-03-01", orders: 129, revenue: 3860 },
    ]);

    expect(result.clean).toEqual([{ date: "2026-03-01", orders: 120, revenue: 3600 }]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe("DUPLICATE_DATE");
    expect(result.issues[0].date).toBe("2026-03-01");
  });

  it("reports a null orders value as missing data", () => {
    const result = validateDataset([{ date: "2026-03-01", orders: null, revenue: 3600 }]);

    expect(result.clean).toEqual([]);
    expect(result.issues[0].type).toBe("MISSING_DATA");
  });

  it("rejects a negative orders value", () => {
    const result = validateDataset([{ date: "2026-03-01", orders: -45, revenue: 3600 }]);

    expect(result.clean).toEqual([]);
    expect(result.issues[0].type).toBe("INVALID_RECORD");
  });

  it("coerces a numeric string orders value", () => {
    const result = validateDataset([{ date: "2026-03-01", orders: "132", revenue: 3600 }]);

    expect(result.clean).toEqual([{ date: "2026-03-01", orders: 132, revenue: 3600 }]);
    expect(result.issues).toEqual([]);
  });

  it("coerces a numeric string containing a comma", () => {
    const result = validateDataset([{ date: "2026-03-01", orders: 120, revenue: "1,204" }]);

    expect(result.clean[0].revenue).toBe(1204);
    expect(result.issues).toEqual([]);
  });

  it("rejects a non-numeric orders value", () => {
    const result = validateDataset([{ date: "2026-03-01", orders: "many", revenue: 3600 }]);

    expect(result.clean).toEqual([]);
    expect(result.issues[0].type).toBe("INVALID_RECORD");
  });

  it("keeps the record but nulls an unusable revenue value", () => {
    const result = validateDataset([{ date: "2026-03-01", orders: 120, revenue: null }]);

    expect(result.clean).toEqual([{ date: "2026-03-01", orders: 120, revenue: null }]);
    expect(result.issues[0].type).toBe("MISSING_DATA");
  });

  it("returns empty results for a dataset that is not an array", () => {
    const result = validateDataset({ rows: [] });

    expect(result.clean).toEqual([]);
    expect(result.issues).toEqual([]);
    expect(result.datasetMalformed).toBe(true);
  });

  it("sorts clean records by date ascending", () => {
    const result = validateDataset([
      { date: "2026-03-03", orders: 130, revenue: 3900 },
      { date: "2026-03-01", orders: 120, revenue: 3600 },
      { date: "2026-03-02", orders: 125, revenue: 3750 },
    ]);

    expect(result.clean.map((record) => record.date)).toEqual([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
    ]);
  });
});
