import fetchApi from "./api";

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  avgOrderValue: number;
  statusBreakdown: Record<string, number>;
  topItems: { name: string; count: number; revenue: number; pct: number }[];
  categoryRevenue: { name: string; revenue: number; pct: number }[];
}

export const analyticsService = {
  getSummary: (): Promise<{ data: AnalyticsSummary }> => fetchApi("/analytics/summary"),
};

export default analyticsService;
