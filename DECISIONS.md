# Decisions

## 1. Who is the intended user?

The owner of a small online store. Not technical, checks in each morning, and wants to know
whether anything broke while they were not looking.

## 2. What problem does your application solve?

They have two months of daily orders sitting in a spreadsheet. Something feels off, but they
cannot find it by scrolling. The app reads the file, points at the specific days worth
attention, and explains why each one was picked, in language they can act on.

## 3. What assumptions did you make?

- One record per day. No hourly data, no per product or per channel breakdown.
- Retail has a weekly rhythm, so Saturdays are legitimately busier than Tuesdays.
- Data arrives dirty. Nulls, negatives, numeric strings and duplicate dates are normal, not
  exceptional.
- The owner knows things the data does not, such as when they ran a promotion. The app should
  therefore be overrulable rather than authoritative.
- Around 60 days is enough history for a rolling baseline to mean something.
- No backend is needed. A static file is a fair stand in for a real export.

## 4. What other approach did you consider?

**Standard deviation instead of a fixed percentage.** Statistically better, and it would adapt
to how volatile a particular store is. Rejected because the owner cannot check it by hand.

**Highlighting rows in a table.** The obvious first version. Rejected once it was clear the app
would need to explain and defend each flag, which a coloured table row cannot do.

## 5. Why did you choose your final approach?

Legibility. A rolling 7 day average and a percentage threshold are arithmetic the owner can
verify themselves, which is the whole point once they are being asked to agree or disagree with
a machine.

The interface is monochrome apart from the severity ramp, so anything coloured is something
asking for attention.

## 6. What is the weakest part of your solution?
1.The first 7 days can never be flagged. No baseline exists yet. A disaster on day 3 is invisible.

2.The rule only catches sudden change. A store losing 2 percent of its orders every day for a
month would never trigger it, because the baseline decays alongside the real numbers. That is a
worse problem than any spike the app does catch, and it is invisible.



## 7. What would you improve next?

- A second rule comparing the 7 day baseline against a 28 day one, to catch the slow decline the
  current rule misses.
- Free text dismissal reasons. The preset list is faster but records less.
- Persistence for dismissals, so a judgement made today is not asked again tomorrow.


## 8. What changed after the new requirement was introduced?

Nothing in the detection engine. Findings already carried the baseline window they were judged
against, because that had been treated as part of the finding from the start rather than as
display detail.

What was added: a written explanation on each finding naming the day, the baseline and the
threshold; an evidence table showing the seven baseline days so the arithmetic can be checked by
hand; a disagree dialog that records a reason; and a dismissed panel where findings can be
revealed, restored one at a time, or cleared all at once.
