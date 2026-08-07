import type { CleanRecord, DataIssue, ValidationResult } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getUTCFullYear() !== year) return null;
  if (parsed.getUTCMonth() !== month - 1) return null;
  if (parsed.getUTCDate() !== day) return null;
  return value;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const stripped = value.replace(/,/g, "").trim();
  if (stripped === "") return null;
  const parsed = Number(stripped);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateDataset(raw: unknown): ValidationResult {
  if (!Array.isArray(raw)) {
    return { clean: [], issues: [], datasetMalformed: true };
  }

  const clean: CleanRecord[] = [];
  const issues: DataIssue[] = [];
  const seenDates = new Set<string>();

  raw.forEach((row, index) => {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      issues.push({
        type: "INVALID_RECORD",
        date: null,
        index,
        reason: "Row is not a record object.",
      });
      return;
    }

    const candidate = row as Record<string, unknown>;
    const rawDate = candidate.date;
    const date = parseDate(rawDate);

    if (date === null) {
      issues.push({
        type: "INVALID_RECORD",
        date: typeof rawDate === "string" ? rawDate : null,
        index,
        reason:
          rawDate === undefined || rawDate === null
            ? "Row has no date, so it cannot be placed on the timeline."
            : `"${String(rawDate)}" is not a real calendar date.`,
      });
      return;
    }

    if (seenDates.has(date)) {
      issues.push({
        type: "DUPLICATE_DATE",
        date,
        index,
        reason: "This date was already recorded. The first row was kept and this one ignored.",
      });
      return;
    }

    const rawOrders = candidate.orders;

    if (rawOrders === undefined || rawOrders === null) {
      seenDates.add(date);
      issues.push({
        type: "MISSING_DATA",
        date,
        index,
        reason: "No order count was recorded for this day.",
      });
      return;
    }

    const orders = coerceNumber(rawOrders);

    if (orders === null || !Number.isInteger(orders) || orders < 0) {
      seenDates.add(date);
      issues.push({
        type: "INVALID_RECORD",
        date,
        index,
        reason: `"${String(rawOrders)}" is not a valid order count.`,
      });
      return;
    }

    const rawRevenue = candidate.revenue;
    const revenue = coerceNumber(rawRevenue);
    const usableRevenue = revenue !== null && revenue >= 0 ? revenue : null;

    if (usableRevenue === null) {
      issues.push({
        type: "MISSING_DATA",
        date,
        index,
        reason: "No usable revenue was recorded for this day, so value per order is unknown.",
      });
    }

    seenDates.add(date);
    clean.push({ date, orders, revenue: usableRevenue });
  });

  clean.sort((a, b) => a.date.localeCompare(b.date));

  return { clean, issues, datasetMalformed: false };
}
