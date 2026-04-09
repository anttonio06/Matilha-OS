/**
 * MATILHA OS — Data Layer
 * All data served from localStorage DB (lib/db.ts).
 *
 * ARCHITECTURE NOTE:
 * Module-level constants are computed ONCE at import time and go stale.
 * Pages that need live data should call DB methods directly inside hooks/components.
 * The exported values here are convenience aliases used by pages that don't
 * need reactive updates (e.g. export page reading a snapshot).
 */

import {
  DogDB, TutorDB, AppointmentDB, PlanDB, TransactionDB,
  TeamDB, ProductDB, HotelDB, GroupDB, AlertDB,
} from "@/lib/db";

import type { DashboardMetrics } from "@/types";

// ─── Snapshot exports (non-reactive — use DB methods / useDB in components) ────
// These are read once at import time. Pages that need live data should call
// the DB methods directly inside useDB() or useMemo().

export const dogs              = DogDB.list();
export const tutors            = TutorDB.list();
export const plans             = PlanDB.list();
export const transactions      = TransactionDB.list();
export const team              = TeamDB.list();
export const products          = ProductDB.list();
export const hotelReservations = HotelDB.list();
export const daycareGroups     = GroupDB.list();
export const behaviorProfiles  = [] as never[];
export const todayAppointments = AppointmentDB.today();
export const alerts            = AlertDB.active();

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export const dogById   = (id: string) => DogDB.get(id);
export const tutorById = (id: string) => TutorDB.get(id);
export const planById  = (id: string) => PlanDB.get(id);

// ─── Dashboard metrics — computed live (call this inside a component/hook) ────
// Returns a fresh metrics snapshot from the current DB state.
// Never call this at module scope — always inside useState/useMemo.

export function computeDashboardMetrics(): DashboardMetrics {
  const todayApts = AppointmentDB.today();
  const allPlans  = PlanDB.list();
  const allTxns   = TransactionDB.list();
  const allHotel  = HotelDB.list();
  const allGroups = GroupDB.list();
  const today     = new Date().toISOString().split("T")[0];
  const monthPfx  = new Date().toISOString().slice(0, 7);

  // Single pass over transactions for both day and month revenue
  let revenueToday = 0;
  let revenueMonth = 0;
  let overdueCount = 0;
  for (const t of allTxns) {
    if (t.type === "receita") {
      if (t.paidAt?.startsWith(today))    revenueToday += t.amount;
      if (t.paidAt?.startsWith(monthPfx)) revenueMonth += t.amount;
    }
    if (t.status === "atrasado") overdueCount++;
  }

  const daycareOccupancy = todayApts.filter(a => a.serviceType === "creche").length;
  const daycareCapacity  = allGroups.reduce((s, g) => s + g.capacity, 0) || 30;

  return {
    dogsToday:           todayApts.length,
    daycareOccupancy,
    daycareCapacity,
    bathsToday:          todayApts.filter(a => ["banho","tosa","banho_tosa"].includes(a.serviceType)).length,
    hotelOccupancy:      allHotel.filter(r => r.status === "hospedado").length,
    hotelCapacity:       12,
    revenueToday,
    revenueMonth,
    revenueTarget:       15000,
    pendingCheckIns:     todayApts.filter(a => a.status === "agendado").length,
    pendingCheckOuts:    todayApts.filter(a => a.status === "em_andamento").length,
    overduePayments:     overdueCount,
    expiringVaccines:    0,
    renewalsDue:         allPlans.filter(p => p.status === "ativo" && (p.totalUses ?? 0) - (p.usedUses ?? 0) <= 2).length,
    upsellOpportunities: 0,
    activeSubscriptions: allPlans.filter(p => p.status === "ativo").length,
    newClientsMonth:     TutorDB.list().filter(t => t.createdAt?.startsWith(monthPfx)).length,
    avgTicket:           revenueMonth > 0 && todayApts.length > 0 ? Math.round(revenueMonth / todayApts.length) : 0,
    churnRisk:           0,
  };
}

// ─── Revenue chart data — computed live ───────────────────────────────────────
// Single pass: group by month then reduce.

export function computeRevenueChartData() {
  const MONTH_LABELS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const year = new Date().getFullYear();

  // Build lookup: monthIndex -> {receita, despesa}
  const byMonth: Record<number, { receita: number; despesa: number }> = {};
  for (let i = 0; i < 12; i++) byMonth[i] = { receita: 0, despesa: 0 };

  for (const t of TransactionDB.list()) {
    if (!t.paidAt) continue;
    const txYear = parseInt(t.paidAt.slice(0, 4), 10);
    if (txYear !== year) continue;
    const monthIdx = parseInt(t.paidAt.slice(5, 7), 10) - 1;
    if (monthIdx < 0 || monthIdx > 11) continue;
    if (t.type === "receita") byMonth[monthIdx].receita += t.amount;
    else                      byMonth[monthIdx].despesa += t.amount;
  }

  return MONTH_LABELS.map((month, i) => ({
    month,
    receita: byMonth[i].receita,
    despesa: byMonth[i].despesa,
    creche: 0, hotel: 0, escola: 0,
  }));
}

// ─── Legacy alias (import compat for pages not yet migrated) ──────────────────
// These are intentionally empty; the dashboard now calls computeDashboardMetrics()
export const dashboardMetrics = {} as DashboardMetrics;
export const revenueChartData = [] as ReturnType<typeof computeRevenueChartData>;
export const occupancyData    = [] as { month: string; creche: number; hotel: number; banho: number }[];
