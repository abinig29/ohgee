# Store Order Monitor

A single-page React tool that reads two months of daily store orders, flags the days worth
paying attention to, and explains why each one was flagged, with the arithmetic on show, so
the owner can disagree.

## What it does

The page answers three questions in order:

| Question               | Where it is answered                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| What is happening?     | Summary strip: total orders, daily average, best day                     |
| What looks unusual?    | Findings list: severity-ranked, business and data-quality kept apart     |
| What should I do next? | Each finding names the day, the size of the change, and its evidence      |

Clicking a finding or a point on the chart opens that day in full, with the days either side.

## Scenarios

A picker at the top of the page swaps the dataset the monitor reads, so every state the app
can reach is reachable without editing a file:

| Scenario                | What it shows                                                              |
| ----------------------- | -------------------------------------------------------------------------- |
| Two months of trading   | The default. A spike, a collapse, a value-per-order drop, 8 malformed rows |
| A weekend outage        | Clean data, two days down, plus the rebound day the sunken baseline flags  |
| A quiet stretch         | Six clean weeks, nothing flagged: the all-clear state                     |
| No data yet             | An empty file: the empty state                                             |
| An unreadable file      | Every row malformed: the error state                                       |

Switching scenario clears any dismissals made against the previous one, since finding ids are
scoped to dates that no longer exist in the new set.

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
at once. Finding ids are derived from date and type, so they stay stable while the page lives.
Dismissals are held in memory for the session only and reset on reload.


## Running it

```bash
pnpm install
pnpm dev      # http://localhost:5173
```

## Tests

```bash
pnpm test
```

tests in Vitest, across three files. The analysis layer is plain functions with no React
imports, so it is tested directly rather than through the interface.

| File                          | Tests | What it covers                                                                                                                    |
| ----------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------- |
| `lib/detection.test.ts`       |    13 | The rule itself: spike, collapse, value-per-order drop, quiet data left alone, the exact threshold boundary, the first seven days, a zero baseline, evidence, severity ordering |
| `lib/validation.test.ts`      |    12 | Every malformed row the dataset contains, plus a dataset that is not a list at all                                                |
| `routes/home.test.tsx`        |     6 | The disagree round trip: evidence on demand, dismiss, restore, clear all, and opening a day in full                               |
                                                              |

## Built with

- **React 19 + Vite**: SPA, no backend, no API, no database
- **TypeScript**
- **Tailwind CSS v4** with **shadcn/ui**: components copied into `src/components/ui`, editable
- **Recharts**: chart rendering only; all analysis is ours
- **Vitest** + **Testing Library**
- **Biome**: lint and format




## Known limitations

Stated up front, because the interesting question is where the rule is wrong.

- **The first 7 days can never be flagged.** No baseline exists yet, so a problem on day 3 is
  invisible.
- **A promotion looks identical to a bug.** The rule sees numbers, not intent. That is exactly
  why the disagreement workflow exists.
- **Slow decay is invisible.** A store losing 2% of orders daily for a month never trips the
  rule, because the baseline decays alongside the real numbers, a worse problem than any spike
  this catches.
- **Dismissals do not survive a reload.** They live in memory for the session. A real product
  would put them on a server so the judgement is shared across devices and people, rather than
  asking the same owner the same question again tomorrow morning.
- **Days excluded by validation leave gaps in the chart**, and the rolling window steps over
  them rather than treating them as zero. The count of excluded days is stated under the chart.


## Resources used

Every library, framework and reference relied on during development.

### Runtime dependencies

| Package                                        | Version | Used for                                    |
| ---------------------------------------------- | ------- | ------------------------------------------- |
| `react`, `react-dom`                           | 19.2    | The framework                               |
| `react-router`                                 | 8.3     | Client routing                              |
| `recharts`                                     | 3.10    | Chart rendering only; all analysis is ours  |
| `radix-ui`, `@base-ui/react`                   | 1.6     | Accessible primitives underneath shadcn/ui  |
| `lucide-react`                                 | 1.21    | Icons                                       |
| `class-variance-authority`, `clsx`, `tailwind-merge` | —  | Conditional class composition               |
| `next-themes`                                  | 0.4     | Light and dark theme switching              |
| `sonner`                                       | 2.0     | Toast notifications                         |
| `motion`                                       | 12.43   | Transitions                                 |
| `tw-animate-css`                               | 1.4     | Tailwind animation utilities                |
| `@fontsource-variable/inter`, `@fontsource/ibm-plex-mono` | 5.3 | Self-hosted typefaces            |

                      | 2.5     | Linting and formatting            |


