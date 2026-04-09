// ─── Dashboard Metrics Types ──────────────────────────────────────────────────

export interface DashboardMetrics {
  dogsToday: number;
  daycareOccupancy: number;
  daycareCapacity: number;
  bathsToday: number;
  hotelOccupancy: number;
  hotelCapacity: number;
  revenueToday: number;
  revenueMonth: number;
  revenueTarget: number;
  pendingCheckIns: number;
  pendingCheckOuts: number;
  overduePayments: number;
  expiringVaccines: number;
  renewalsDue: number;
  upsellOpportunities: number;
  activeSubscriptions: number;
  newClientsMonth: number;
  avgTicket: number;
  churnRisk: number;
}
