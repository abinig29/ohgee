import type { CleanRecord } from "./types";

export type Summary = {
  dayCount: number;
  totalOrders: number;
  totalRevenue: number;
  dailyAverage: number;
  bestDay: { date: string; orders: number } | null;
};

export function summarize(records: CleanRecord[]): Summary {
  const totalOrders = records.reduce((sum, record) => sum + record.orders, 0);
  const totalRevenue = records.reduce((sum, record) => sum + (record.revenue ?? 0), 0);

  const bestDay = records.reduce<Summary["bestDay"]>((best, record) => {
    if (best === null || record.orders > best.orders) {
      return { date: record.date, orders: record.orders };
    }
    return best;
  }, null);

  return {
    dayCount: records.length,
    totalOrders,
    totalRevenue,
    dailyAverage: records.length === 0 ? 0 : totalOrders / records.length,
    bestDay,
  };
}
