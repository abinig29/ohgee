import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataQualityList } from "@/components/monitor/data-quality-list";
import { DetailDialog } from "@/components/monitor/detail-dialog";
import { DisagreeDialog } from "@/components/monitor/disagree-dialog";
import { DismissedPanel } from "@/components/monitor/dismissed-panel";
import { FindingCard } from "@/components/monitor/finding-card";
import { OrdersChart } from "@/components/monitor/orders-chart";
import { ScenarioPicker } from "@/components/monitor/scenario-picker";
import { AllClear, DatasetError, EmptyDataset } from "@/components/monitor/states";
import { SummaryStrip } from "@/components/monitor/summary-strip";
import { DEFAULT_SCENARIO, SCENARIOS } from "@/data/scenarios";
import { useDismissals } from "@/hooks/use-dismissals";
import { analyze, neighboursOf, partitionFindings } from "@/lib/analysis";
import type { Finding } from "@/lib/types";
import { verdictLine } from "@/lib/verdict";

const DETAIL_SPAN = 3;

export default function Home({ dataset }: { dataset?: unknown } = {}) {
  const { dismissals, dismiss, restore, clearAll } = useDismissals();
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO.id);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [disagreeing, setDisagreeing] = useState<Finding | null>(null);

  const scenario = SCENARIOS.find((entry) => entry.id === scenarioId) ?? DEFAULT_SCENARIO;
  const source = dataset === undefined ? scenario.dataset : dataset;

  const analysis = useMemo(() => analyze(source), [source]);

  const selectScenario = (id: string) => {
    setScenarioId(id);
    setSelectedDate(null);
    clearAll();
  };

  const partition = useMemo(
    () => partitionFindings(analysis.findings, dismissals),
    [analysis.findings, dismissals],
  );

  const verdict = verdictLine(analysis.summary, {
    business: partition.business.length,
    dataQuality: partition.dataQuality.length,
  });

  const neighbours = useMemo(
    () => (selectedDate ? neighboursOf(analysis.validation.clean, selectedDate, DETAIL_SPAN) : []),
    [analysis.validation.clean, selectedDate],
  );

  const selectedFinding =
    analysis.findings.find(
      (finding) => finding.date === selectedDate && finding.kind === "business",
    ) ?? null;

  const noUsableData = analysis.validation.clean.length === 0;
  const datasetBroken =
    analysis.validation.datasetMalformed || analysis.validation.issues.length > 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-8">
        {dataset === undefined ? (
          <ScenarioPicker scenarios={SCENARIOS} selected={scenario} onSelect={selectScenario} />
        ) : null}

        <SummaryStrip
          summary={analysis.summary}
          verdict={verdict}
          needsAttention={partition.business.length > 0}
        />

        {noUsableData ? (
          datasetBroken ? (
            <DatasetError issues={analysis.validation.issues} />
          ) : (
            <EmptyDataset />
          )
        ) : (
          <>
            <section className="border bg-card px-2 pt-4 pb-3 sm:px-4">
              <OrdersChart
                points={analysis.points}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                excludedCount={analysis.validation.issues.length}
              />
            </section>

            {partition.business.length === 0 && partition.dataQuality.length === 0 ? (
              <AllClear dayCount={analysis.summary.dayCount} />
            ) : null}

            {partition.business.length > 0 ? (
              <section className="space-y-3">
                <h2 className="eyebrow flex items-center gap-2 text-alert-high">
                  <span aria-hidden className="h-px w-6 bg-alert-high" />
                  What looks unusual
                </h2>
                {partition.business.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    onSelect={setSelectedDate}
                    onDisagree={setDisagreeing}
                  />
                ))}
              </section>
            ) : null}

            {partition.dataQuality.length > 0 ? (
              <DataQualityList findings={partition.dataQuality} onDisagree={setDisagreeing} />
            ) : null}

            <DismissedPanel
              entries={partition.dismissed}
              onRestore={(id) => {
                restore(id);
                toast.success("Finding restored");
              }}
              onClearAll={() => {
                clearAll();
                toast.success("All dismissals cleared");
              }}
            />
          </>
        )}
      </div>

      <DetailDialog
        date={selectedDate}
        neighbours={neighbours}
        finding={selectedFinding}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null);
        }}
      />

      <DisagreeDialog
        finding={disagreeing}
        onOpenChange={(open) => {
          if (!open) setDisagreeing(null);
        }}
        onConfirm={(id, reason) => {
          dismiss(id, reason);
          setDisagreeing(null);
          toast.success("Moved to Dismissed", { description: reason });
        }}
      />
    </main>
  );
}
