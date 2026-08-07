import broken from "./broken.json";
import empty from "./empty.json";
import orders from "./orders.json";
import outage from "./outage.json";
import quiet from "./quiet.json";

export type Scenario = {
  id: string;
  name: string;
  note: string;
  dataset: unknown;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "trading",
    name: "Two months of trading",
    note: "The real thing: a spike, a collapse, a drop in value per order, and eight malformed rows.",
    dataset: orders,
  },
  {
    id: "outage",
    name: "A weekend outage",
    note: "Clean data, two days the store was down, and the rebound day that the dragged-down baseline flags too.",
    dataset: outage,
  },
  {
    id: "quiet",
    name: "A quiet stretch",
    note: "Six clean weeks with nothing worth flagging. The monitor should say so rather than show a blank list.",
    dataset: quiet,
  },
  {
    id: "empty",
    name: "No data yet",
    note: "An empty file. There is nothing to chart and nothing to measure.",
    dataset: empty,
  },
  {
    id: "broken",
    name: "An unreadable file",
    note: "Every row malformed. Nothing survives validation, and the monitor has to explain why.",
    dataset: broken,
  },
];

export const DEFAULT_SCENARIO = SCENARIOS[0];
