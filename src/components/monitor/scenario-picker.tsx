import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Scenario } from "@/data/scenarios";

export function ScenarioPicker({
  scenarios,
  selected,
  onSelect,
}: {
  scenarios: Scenario[];
  selected: Scenario;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b pb-5">
      <div className="min-w-56 flex-1">
        <label className="eyebrow" htmlFor="scenario">
          Scenario
        </label>
        <p className="mt-1.5 max-w-prose text-muted-foreground text-sm">{selected.note}</p>
      </div>

      <Select value={selected.id} onValueChange={onSelect}>
        <SelectTrigger id="scenario" className="w-full sm:w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {scenarios.map((scenario) => (
            <SelectItem key={scenario.id} value={scenario.id}>
              {scenario.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
