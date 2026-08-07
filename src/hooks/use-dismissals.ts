import { useCallback, useEffect, useRef, useState } from "react";

import { readStoredDismissals, writeStoredDismissals } from "@/lib/storage";
import type { DismissalMap } from "@/lib/types";

export type DismissalControls = {
  dismissals: DismissalMap;
  dismiss: (id: string, reason: string) => void;
  restore: (id: string) => void;
  clearAll: () => void;
};

export function useDismissals(): DismissalControls {
  const [dismissals, setDismissals] = useState<DismissalMap>(readStoredDismissals);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    writeStoredDismissals(dismissals);
  }, [dismissals]);

  const dismiss = useCallback((id: string, reason: string) => {
    setDismissals((current) => ({
      ...current,
      [id]: { reason, dismissedAt: new Date().toISOString() },
    }));
  }, []);

  const restore = useCallback((id: string) => {
    setDismissals((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setDismissals((current) => (Object.keys(current).length === 0 ? current : {}));
  }, []);

  return { dismissals, dismiss, restore, clearAll };
}
