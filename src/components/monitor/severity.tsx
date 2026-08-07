import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<Severity, { label: string; text: string; rule: string; dot: string }> = {
  high: {
    label: "High",
    text: "text-alert-high",
    rule: "bg-alert-high",
    dot: "bg-alert-high",
  },
  medium: {
    label: "Medium",
    text: "text-alert-medium",
    rule: "bg-alert-medium",
    dot: "bg-alert-medium",
  },
  low: {
    label: "Data",
    text: "text-muted-foreground",
    rule: "bg-border",
    dot: "bg-muted-foreground",
  },
};

export function severityStyle(severity: Severity) {
  return STYLES[severity];
}

export function SeverityTag({ severity }: { severity: Severity }) {
  const style = STYLES[severity];

  return (
    <span className={cn("eyebrow flex items-center gap-1.5", style.text)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}
