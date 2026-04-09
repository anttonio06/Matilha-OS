"use client";

/**
 * Metrics / Dashboard Service
 *
 * Computes all operational KPIs from the current data snapshot.
 * Kept in a service so it can be reused across dashboard, reports,
 * and future API endpoints without duplicating aggregation logic.
 */

import { AppointmentDB, PlanDB, TransactionDB, HotelDB, GroupDB, TutorDB } from "@/lib/db";
import type { DashboardMetrics } from "@/types/domain/metrics";

// ─── Revenue chart point ──────────────────────────────────────────────────────

export interface RevenueDataPoint {
  month: string;
  creche: number;
  hotel: number;
  escola: number;
  receita: number;
  despesa: number;
}

// ─── Dashboard metrics ────────────────────────────────────────────────────────

export function computeDashboardMetrics(): DashboardMetrics {
  const today    = new Date().toISOString().split("T")[0];
  const monthPfx = new Date().toISOString().slice(0, 7);

  const todayApts  = AppointmentDB.today();
  const allPlans   = PlanDB.list();
  const allHotel   = HotelDB.list();
  const allGroups  = GroupDB.list();

  let revenueToday = 0;
  let revenueMonth = 0;
  let overdueCount = 0;

  for (const t of TransactionDB.list()) {
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
    bathsToday:          todayApts.filter(a => ["banho", "tosa", "banho_tosa"].includes(a.serviceType)).length,
    hotelOccupancy:      allHotel.filter(r => r.status === "hospedado").length,
    hotelCapacity:       12,
    revenueToday,
    revenueMonth,
    revenueTarget:       15_000,
    pendingCheckIns:     todayApts.filter(a => a.status === "agendado").length,
    pendingCheckOuts:    todayApts.filter(a => a.status === "em_andamento").length,
    overduePayments:     overdueCount,
    expiringVaccines:    0,
    renewalsDue:         allPlans.filter(p => p.status === "ativo" && (p.totalUses ?? 0) - (p.usedUses ?? 0) <= 2).length,
    upsellOpportunities: 0,
    activeSubscriptions: allPlans.filter(p => p.status === "ativo").length,
    newClientsMonth:     TutorDB.list().filter(t => t.createdAt?.startsWith(monthPfx)).length,
    avgTicket:           revenueMonth > 0 && todayApts.length > 0
      ? Math.round(revenueMonth / todayApts.length)
      : 0,
    churnRisk:           0,
  };
}

// ─── Revenue chart ────────────────────────────────────────────────────────────

export function computeRevenueChartData(): RevenueDataPoint[] {
  const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const year = new Date().getFullYear();

  const byMonth: Record<number, { creche: number; hotel: number; escola: number; receita: number; despesa: number }> = {};
  for (let i = 0; i < 12; i++) {
    byMonth[i] = { creche: 0, hotel: 0, escola: 0, receita: 0, despesa: 0 };
  }

  for (const t of TransactionDB.list()) {
    if (!t.paidAt) continue;
    if (parseInt(t.paidAt.slice(0, 4), 10) !== year) continue;
    const m = parseInt(t.paidAt.slice(5, 7), 10) - 1;
    if (m < 0 || m > 11) continue;

    if (t.type === "receita") {
      byMonth[m].receita += t.amount;
      const cat = t.category;
      if (cat === "creche") byMonth[m].creche += t.amount;
      else if (cat === "hotel") byMonth[m].hotel += t.amount;
      else if (cat === "escola") byMonth[m].escola += t.amount;
    } else {
      byMonth[m].despesa += t.amount;
    }
  }

  return MONTH_LABELS.map((month, i) => ({ month, ...byMonth[i] }));
}
