# Debugging notes

The fixed function and its tests are below. This is a standalone exercise, so it is kept out of
the application source.

I ran the function before reading it properly. It threw on the first call, and on every input
after that, including an empty array. So the crash had to go first before I could see anything
else.

I patched the two index errors in a scratch copy and ran it again. That is where the real
problems were. With three records `largestChange` came back `NaN`. With two records it came back
`20`, which is correct. With one record it came back `0`. An all negative series reported a
highest of `0`. Records in the wrong order gave the wrong `latest`.

The two record case is the annoying one. It gives the right answer, so a quick sanity check by
hand would pass and you would move on.

## Bugs

**1. Loop goes one too far.** `i <= records.length` reads `records[records.length]`, which is
undefined, then reads `.value` off it. Instant `TypeError`. This function has never worked.

**2. `records[records.length].value` in the return.** Same off by one for the latest value.
Needs `length - 1`. Easy to miss because fixing the loop feels like you fixed it.

**3. The sort comparator returns a boolean.** `a.timestamp > b.timestamp` gives `true` or
`false`, which become `1` and `0`. It never returns a negative, so the sort has no way to move
anything left. I gave it a reversed 12 item array and got the same array back. This is the worst
one in here. Every change is measured between two readings that were never next to each other in
time, and the output looks completely normal.

**4. `Math.max(changes)` is passed an array.** `Math.max` wants arguments, so the array gets
coerced to a number first. `Math.max([1,2,3])` is `NaN`. `Math.max([5])` is `5`, because a one
item array coerces to that item. That is why two records works and three does not.

**5. `highest` starts at 0.** Not a value from the data. Any series that is entirely negative
reports `0` as its maximum, which never appeared in the input.

**6. Division by zero.** If the previous value is `0` you get `Infinity`, which then beats
everything else in the max and spreads into anything computed from it.

**7. Empty array.** `total / records.length` is `0 / 0`, so `NaN`, and then the latest lookup
throws. An empty result set is normal, not an error.

**8. It sorts the caller's array in place.** Side effect nobody asked for, and the kind that
shows up somewhere far away from here.

**9. No validation.** Assumes an array, assumes objects, assumes `value` is a number. A `null`
entry or `"120"` as a string breaks it in three different ways.

## The rewrite

```ts
type DataRecord = {
  timestamp: string | number | Date;
  value: number;
};

type Summary = {
  count: number;
  skipped: number;
  average: number | null;
  highest: number | null;
  latest: number | null;
  largestChange: number | null;
};

const EMPTY_SUMMARY: Summary = {
  count: 0,
  skipped: 0,
  average: null,
  highest: null,
  latest: null,
  largestChange: null,
};

function toTime(timestamp: unknown): number | null {
  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? null : timestamp.getTime();
  }

  if (typeof timestamp === "number") {
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof timestamp === "string") {
    const parsed = Date.parse(timestamp);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function isUsable(record: unknown): record is DataRecord {
  if (typeof record !== "object" || record === null) return false;

  const candidate = record as { timestamp?: unknown; value?: unknown };

  return (
    typeof candidate.value === "number" &&
    Number.isFinite(candidate.value) &&
    toTime(candidate.timestamp) !== null
  );
}

export function summarizeRecords(records: unknown): Summary {
  if (!Array.isArray(records)) return { ...EMPTY_SUMMARY };

  const usable = records.filter(isUsable);
  const skipped = records.length - usable.length;

  if (usable.length === 0) return { ...EMPTY_SUMMARY, skipped };

  const sorted = [...usable].sort(
    (a, b) => (toTime(a.timestamp) ?? 0) - (toTime(b.timestamp) ?? 0),
  );

  let total = 0;
  let highest = sorted[0].value;
  let largestChange: number | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const value = sorted[i].value;

    total += value;

    if (value > highest) highest = value;

    if (i > 0) {
      const previous = sorted[i - 1].value;

      if (previous !== 0) {
        const change = ((value - previous) / previous) * 100;

        if (largestChange === null || Math.abs(change) > Math.abs(largestChange)) {
          largestChange = change;
        }
      }
    }
  }

  return {
    count: sorted.length,
    skipped,
    average: total / sorted.length,
    highest,
    latest: sorted[sorted.length - 1].value,
    largestChange,
  };
}
```

I dropped the `changes` array entirely and track the largest one during the pass, since nothing
else needed the full list.

## Calls that could have gone either way

**Empty input returns nulls instead of throwing.** Getting nothing back from a query is normal.
Making every caller wrap this in a `try` is not worth it. Nulls rather than zeros because `0` is
a value a reading can actually have.

**`largestChange` is the biggest move in either direction, sign kept.** `Math.max` implied
biggest increase, but a drop from 160 to 16 matters more than a small rise, and it would have
been ignored. If you specifically want the largest gain that is a different function.

**Changes from zero are skipped.** Not `Infinity`, not `null`. Percentage change from zero is
undefined, and letting `Infinity` in means it wins every comparison. Downside is a recovery from
zero never gets reported.

**Bad rows are skipped but counted.** There is a `skipped` field in the result. Dropping them
silently gives you a confident number built on data you did not know was thrown away.

## Tests

The obvious ones cover average, highest, latest, sorting and not mutating the input. The ones
that earn their place are the all negative series, the `-90%` drop against a smaller rise, the
previous value of `0`, the empty array, and the `NaN` that passes `typeof x === "number"` and
has to be excluded on purpose.

```ts
import { describe, expect, it } from "vitest";

import { summarizeRecords } from "./summarize-records";

function at(day: number, value: number) {
  return { timestamp: `2026-03-${String(day).padStart(2, "0")}T00:00:00Z`, value };
}

describe("summarizeRecords", () => {
  it("averages the values", () => {
    expect(summarizeRecords([at(1, 100), at(2, 120), at(3, 140)]).average).toBe(120);
  });

  it("reports the highest value", () => {
    expect(summarizeRecords([at(1, 100), at(2, 220), at(3, 140)]).highest).toBe(220);
  });

  it("reports the latest value by timestamp, not by array position", () => {
    expect(summarizeRecords([at(3, 140), at(1, 100), at(2, 120)]).latest).toBe(140);
  });

  it("orders records that arrive out of sequence", () => {
    expect(summarizeRecords([at(2, 200), at(1, 100)]).largestChange).toBe(100);
  });

  it("does not mutate the array it was given", () => {
    const input = [at(3, 140), at(1, 100), at(2, 120)];
    const order = input.map((record) => record.value);

    summarizeRecords(input);

    expect(input.map((record) => record.value)).toEqual(order);
  });

  it("finds the highest of an all-negative series rather than falling back to zero", () => {
    expect(summarizeRecords([at(1, -50), at(2, -20), at(3, -80)]).highest).toBe(-20);
  });

  it("returns the largest movement in either direction, keeping its sign", () => {
    expect(summarizeRecords([at(1, 100), at(2, 160), at(3, 16)]).largestChange).toBe(-90);
  });

  it("skips a change measured from zero instead of returning Infinity", () => {
    expect(summarizeRecords([at(1, 0), at(2, 50), at(3, 100)]).largestChange).toBe(100);
  });

  it("returns no change for a single record", () => {
    const summary = summarizeRecords([at(1, 100)]);

    expect(summary.average).toBe(100);
    expect(summary.largestChange).toBeNull();
  });

  it("returns an empty summary for an empty array without throwing", () => {
    expect(summarizeRecords([])).toEqual({
      count: 0,
      skipped: 0,
      average: null,
      highest: null,
      latest: null,
      largestChange: null,
    });
  });

  it("returns an empty summary for input that is not an array", () => {
    expect(summarizeRecords(undefined).average).toBeNull();
    expect(summarizeRecords({ records: [] }).average).toBeNull();
  });

  it("skips unusable records and counts how many were dropped", () => {
    const summary = summarizeRecords([
      at(1, 100),
      { timestamp: "not-a-date", value: 500 },
      { timestamp: "2026-03-02T00:00:00Z", value: "120" },
      { timestamp: "2026-03-03T00:00:00Z" },
      null,
      at(4, 140),
    ]);

    expect(summary.count).toBe(2);
    expect(summary.skipped).toBe(4);
    expect(summary.average).toBe(120);
  });

  it("ignores NaN values rather than poisoning the average", () => {
    const summary = summarizeRecords([
      at(1, 100),
      { timestamp: "2026-03-02", value: Number.NaN },
      at(3, 140),
    ]);

    expect(summary.average).toBe(120);
    expect(summary.skipped).toBe(1);
  });
});
```

All 13 pass against the rewritten function.
