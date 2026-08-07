const WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

function spell(count: number): string {
  return count <= 10 ? WORDS[count] : String(count);
}

export function verdictLine(
  summary: { dayCount: number },
  counts: { business: number; dataQuality: number },
): string {
  if (counts.business > 0) {
    return counts.business === 1
      ? "One day needs a look."
      : `${spell(counts.business)} days need a look.`;
  }

  if (counts.dataQuality > 0) {
    return counts.dataQuality === 1
      ? "Nothing unusual in the orders, but 1 row needs fixing."
      : `Nothing unusual in the orders, but ${counts.dataQuality} rows need fixing.`;
  }

  if (summary.dayCount === 0) {
    return "There is nothing to monitor yet.";
  }

  return `Nothing unusual in the last ${summary.dayCount} days.`;
}
