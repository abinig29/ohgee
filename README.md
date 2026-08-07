# Store Order Monitor

A single-page React tool that reads two months of daily store orders, flags the days worth
paying attention to, and explains why each one was flagged, with the arithmetic on show, so
the owner can disagree.

See [PRD.md](PRD.md) for the full specification.

## What it does

The page answers three questions in order:

| Question               | Where it is answered                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| What is happening?     | Summary strip: total orders, daily average, best day                     |
| What looks unusual?    | Findings list: severity-ranked, business and data-quality kept apart     |
| What should I do next? | Each finding names the day, the size of the change, and its evidence      |

Clicking a finding or a point on the chart opens that day in full, with the days either side.

## The detection rule

For each day, average the **previous 7 clean days**. If the day deviates by more than **±50%**
from that average, flag it.

| Day    | Orders | 7-day baseline | Deviation | Result   |
| ------ | -----: | -------------: | --------: | -------- |
| 03 Mar |    130 |          117.7 |      +10% | quiet    |
| 07 Mar |    340 |          122.9 |  **+177%** | Spike    |
| 14 Mar |     12 |          154.4 |   **−92%** | Collapse |

**Why a rolling baseline, not a fixed threshold.** A hardcoded "alert below 50 orders" breaks
the week the store grows. The baseline moves with the store.

**Why exactly 7 days.** Retail has a weekly rhythm, and Saturdays are consistently higher. A 7-day
window holds exactly one of every weekday, so last Saturday sits in the baseline when this
Saturday is judged, and the weekly cycle cancels out. A 5-day window would flag every weekend.

**A second rule watches value per order** (`revenue / orders`) against its own 7-day baseline,
and only fires when the order count held steady. That catches the case where the same number of
customers each spend less, such as a stuck discount code or a pricing error, which is invisible if you
only watch order count.

Severity is ordered: a deviation of 100% or more is high, 50 to 100% is medium, data-quality
problems are low. The list sorts by severity, then by recency.

## The data is deliberately dirty

`src/data/orders.json` holds 62 rows for ~60 days, 8 of them malformed on purpose: a `null`, a
negative number, a numeric string, a numeric string with a comma, a duplicate date, a row with
no `orders` field, an unparseable date, and a non-numeric order count.

Nothing is dropped silently. Records that cannot be analysed are separated out and reported as
data-quality findings, visually distinct from the business findings. They are a different kind
of bad. Numeric strings are coerced and let through. The app renders without crashing even if
every record is invalid.

## Disagreeing with a finding

Every finding justifies itself: why it fired, and the seven baseline days as a table so the
arithmetic can be checked by hand. If the owner knows 07 Mar was their Instagram promotion,
they click **Disagree**, pick a reason, and the finding moves to **Dismissed**.

Dismissed findings are never deleted. They can be revealed, restored one by one, or cleared all
at once. Finding ids are derived from date and type, so they stay stable across reloads, and
dismissals persist in `localStorage` under a versioned key. A corrupt stored value is discarded
and treated as empty, the same defensive rule the dataset gets.

**Why not delete:** a tool whose whole job is earning trust must not destroy the user's own
audit trail. Reversibility is the point.

## Running it

```bash
pnpm install
pnpm dev      # http://localhost:5173
```

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Start the dev server               |
| `pnpm build`        | Build for production into `dist/`  |
| `pnpm serve`        | Preview the production build       |
| `pnpm test`         | Run the tests once                 |
| `pnpm test:watch`   | Run the tests in watch mode        |
| `pnpm coverage`     | Tests with a coverage report       |
| `pnpm check-types`  | TypeScript typecheck               |
| `pnpm check`        | Biome format and lint with autofix |

## Tests

113 tests, all in Vitest. The analysis layer is plain functions with no React imports, so it is
tested in isolation:

- **Validation**: every malformed row type, plus non-array input and non-object rows
- **Detection**: spike, collapse, value-per-order drop, quiet data, the threshold boundary,
  fewer than 7 prior days, a zero baseline, empty and single-record datasets
- **The shipped dataset**: asserts the demo data still produces the findings described above
- **Persistence**: corrupt stored value, unknown finding id, restore, clear all
- **The page**: the disagree, dismiss, restore and clear-all round trip, evidence on demand,
  and the empty, error and all-clear states

```bash
pnpm test
```

## Built with

- **React 19 + Vite**: SPA, no backend, no API, no database
- **TypeScript**
- **Tailwind CSS v4** with **shadcn/ui**: components copied into `src/components/ui`, editable
- **Recharts**: chart rendering only; all analysis is ours
- **Vitest** + **Testing Library**
- **Biome**: lint and format

Validation and detection run inside `useMemo`, once per dataset rather than per render.
Dismissal persistence is isolated behind one hook, `useDismissals`.

## Design notes

The page is monochrome by deliberate choice: the only colour in the interface is the alert
ramp, so anything coloured is something that wants attention. Severity is ordered, not
categorical, so high and medium are two steps of one hue rather than two competing hues. The
pair was checked for lightness band, contrast and colour-vision separation against both the
light and dark surfaces. Figures are set in IBM Plex Mono with tabular numerals so columns of
numbers line up; body copy is Inter.

Each finding carries a deviation bar showing where the day landed against the ±50% band the
rule ignores, so the threshold being crossed is visible rather than merely stated.

## Known limitations

Stated up front, because the interesting question is where the rule is wrong.

- **The first 7 days can never be flagged.** No baseline exists yet, so a problem on day 3 is
  invisible.
- **A promotion looks identical to a bug.** The rule sees numbers, not intent. That is exactly
  why the disagreement workflow exists.
- **Slow decay is invisible.** A store losing 2% of orders daily for a month never trips the
  rule, because the baseline decays alongside the real numbers, a worse problem than any spike
  this catches.
- **A single outlier poisons the baseline** for the following 7 days. Visible in the demo data:
  the 07 Mar spike lifts the baseline that 14 Mar is judged against, from ~123 to 154.
- **±50% is arbitrary.** Tuned by eye for this dataset. A high-variance store needs a wider
  threshold, a stable one wants it tighter. A standard-deviation approach would adapt
  automatically but is harder to explain to a non-technical owner. Legibility was chosen over
  statistical rigour.
- **Dismissals are per-browser.** `localStorage` is not shared across devices or users. Two
  people reviewing the same store see different dismissal states. A real product needs a server.
- **Days excluded by validation leave gaps in the chart**, and the rolling window steps over
  them rather than treating them as zero. The count of excluded days is stated under the chart.
