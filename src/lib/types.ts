export type CleanRecord = {
  date: string;
  orders: number;
  revenue: number | null;
};

export type DataIssueType = "MISSING_DATA" | "INVALID_RECORD" | "DUPLICATE_DATE";

export type DataIssue = {
  type: DataIssueType;
  date: string | null;
  index: number;
  reason: string;
};

export type ValidationResult = {
  clean: CleanRecord[];
  issues: DataIssue[];
  datasetMalformed: boolean;
};

export type FindingType = DataIssueType | "SPIKE" | "COLLAPSE" | "AOV_DROP";

export type Severity = "high" | "medium" | "low";

export type BaselineDay = {
  date: string;
  value: number;
};

export type FindingEvidence = {
  metric: "orders" | "aov";
  actual: number;
  baseline: number;
  deviation: number;
  window: BaselineDay[];
};

export type Finding = {
  id: string;
  date: string | null;
  type: FindingType;
  severity: Severity;
  kind: "business" | "data-quality";
  headline: string;
  explanation: string;
  evidence: FindingEvidence | null;
};

export type Dismissal = {
  reason: string;
  dismissedAt: string;
};

export type DismissalMap = Record<string, Dismissal>;
