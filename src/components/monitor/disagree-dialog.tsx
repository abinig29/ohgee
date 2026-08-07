import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatFullDay } from "@/lib/format";
import type { Finding } from "@/lib/types";

export const DISAGREE_REASONS = [
  "A promotion I ran",
  "A price or discount change",
  "An outage I already knew about",
  "The data is wrong, not the store",
  "Normal for this time of year",
] as const;

export function DisagreeDialog({
  finding,
  onOpenChange,
  onConfirm,
}: {
  finding: Finding | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, reason: string) => void;
}) {
  const [reason, setReason] = useState<string>(DISAGREE_REASONS[0]);

  return (
    <Dialog
      open={finding !== null}
      onOpenChange={(open) => {
        if (!open) setReason(DISAGREE_REASONS[0]);
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disagree with this finding</DialogTitle>
          <DialogDescription>
            {finding
              ? `${finding.headline} on ${finding.date ? formatFullDay(finding.date) : "an unreadable row"}. Tell the monitor why it is wrong. It moves to Dismissed, where you can restore it.`
              : null}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="eyebrow" htmlFor="disagree-reason">
            Reason
          </label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger id="disagree-reason" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISAGREE_REASONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep it
          </Button>
          <Button
            onClick={() => {
              if (finding) onConfirm(finding.id, reason);
            }}
          >
            Disagree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
