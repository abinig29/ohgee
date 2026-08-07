import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/analysis";
import { formatDay, formatFullDay, formatNumber } from "@/lib/format";

const SEVERITY_FILL = {
  high: "var(--alert-high)",
  medium: "var(--alert-medium)",
  low: "var(--muted-foreground)",
} as const;

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
};

function FlagDot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined || !payload?.severity) return null;

  const fill = SEVERITY_FILL[payload.severity];

  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={fill} stroke="var(--card)" strokeWidth={2} />
      <text
        x={cx}
        y={cy - 13}
        textAnchor="middle"
        className="figure"
        fill={fill}
        stroke="var(--card)"
        strokeWidth={4}
        paintOrder="stroke"
        fontSize={11}
        fontWeight={500}
      >
        {formatDay(payload.date)}
      </text>
    </g>
  );
}

type TooltipProps = {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
};

function ChartTooltip({ active, payload }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="border bg-popover px-3 py-2 shadow-sm">
      <p className="eyebrow">{formatFullDay(point.date)}</p>
      <p className="figure mt-1 font-medium text-sm">{formatNumber(point.orders)} orders</p>
      {point.aov === null ? null : (
        <p className="figure text-muted-foreground text-xs">{formatNumber(point.aov)} per order</p>
      )}
    </div>
  );
}

export function OrdersChart({
  points,
  selectedDate,
  onSelect,
  excludedCount,
}: {
  points: ChartPoint[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
  excludedCount: number;
}) {
  return (
    <figure className="m-0">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={points}
          margin={{ top: 28, right: 12, bottom: 22, left: -18 }}
          onClick={(state) => {
            if (state?.activeLabel) onSelect(String(state.activeLabel));
          }}
        >
          <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="2 4" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tickLine={false}
            axisLine={false}
            minTickGap={36}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          {selectedDate ? (
            <ReferenceLine x={selectedDate} stroke="var(--foreground)" strokeOpacity={0.35} />
          ) : null}
          <Line
            type="monotone"
            dataKey="orders"
            stroke="var(--series)"
            strokeWidth={2}
            dot={<FlagDot />}
            activeDot={{ r: 4, fill: "var(--series)", stroke: "var(--card)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <figcaption className="mt-2 text-muted-foreground text-xs">
        Orders per day. Flagged days are marked and named.
        {excludedCount > 0
          ? ` ${excludedCount} ${excludedCount === 1 ? "day is" : "days are"} missing from this line because the data could not be read. They are listed under Data quality.`
          : null}
      </figcaption>

      <table className="sr-only">
        <caption>Orders per day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Orders</th>
            <th>Flagged</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <td>{formatFullDay(point.date)}</td>
              <td>{point.orders}</td>
              <td>{point.severity ? `Yes, ${point.severity} severity` : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
