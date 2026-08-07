import type { Dismissal, DismissalMap } from "./types";

export const DISMISSALS_KEY = "ohgee.dismissals.v1";

function isDismissal(value: unknown): value is Dismissal {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.reason === "string" && typeof candidate.dismissedAt === "string";
}

export function parseDismissals(raw: string | null): DismissalMap {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};

  const map: DismissalMap = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (isDismissal(value)) {
      map[id] = { reason: value.reason, dismissedAt: value.dismissedAt };
    }
  }

  return map;
}

export function serializeDismissals(map: DismissalMap): string {
  return JSON.stringify(map);
}

export function readStoredDismissals(): DismissalMap {
  try {
    return parseDismissals(window.localStorage.getItem(DISMISSALS_KEY));
  } catch {
    return {};
  }
}

export function writeStoredDismissals(map: DismissalMap): void {
  try {
    window.localStorage.setItem(DISMISSALS_KEY, serializeDismissals(map));
  } catch {
    return;
  }
}
