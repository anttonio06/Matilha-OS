"use client";

/**
 * Plan / Subscription Service
 *
 * Centralises business rules for plan lifecycle:
 *   - Validity checks (date and usage)
 *   - Plan selection for a dog/tutor
 *   - Churn risk computation
 *   - Expiry detection
 */

import { PlanDB, AppointmentDB, TutorDB } from "@/lib/db";
import type { Plan } from "@/types/domain/plan";
import type { Tutor } from "@/types/domain/tutor";

// ─── Validity helpers ─────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function isPlanActive(plan: Plan): boolean {
  const today = todayIso();
  if (plan.status !== "ativo") return false;
  if (plan.validUntil && plan.validUntil < today) return false;
  if (plan.totalUses != null && (plan.usedUses ?? 0) >= plan.totalUses) return false;
  return true;
}

export function planUsesRemaining(plan: Plan): number | null {
  if (plan.totalUses == null) return null; // unlimited
  return Math.max(0, plan.totalUses - (plan.usedUses ?? 0));
}

export function isPlanNearExpiry(plan: Plan, thresholdDays = 7): boolean {
  if (!plan.validUntil) return false;
  const today = new Date();
  const expiry = new Date(plan.validUntil);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
  return daysLeft >= 0 && daysLeft <= thresholdDays;
}

export function isPlanNearUsageLimit(plan: Plan, threshold = 2): boolean {
  const remaining = planUsesRemaining(plan);
  return remaining !== null && remaining <= threshold;
}

// ─── Plan selection for a dog ─────────────────────────────────────────────────

/**
 * Returns the best active plan for a dog — first matching by dogId, then tutorId.
 * Returns undefined if no active plan is found.
 */
export function findActivePlanForDog(dogId: string, tutorId: string): Plan | undefined {
  const allPlans = PlanDB.list();
  return (
    allPlans.find(p => p.dogId === dogId && isPlanActive(p)) ??
    allPlans.find(p => p.tutorId === tutorId && isPlanActive(p))
  );
}

// ─── Expiring plans (dashboard / alerts) ─────────────────────────────────────

export interface ExpiringPlan {
  plan: Plan;
  reason: "usage" | "date";
  usesLeft: number | null;
  daysLeft: number | null;
}

export function getExpiringPlans(
  withinDays = 7,
  usageThreshold = 2
): ExpiringPlan[] {
  const today = new Date();
  return PlanDB.list()
    .filter(p => p.status === "ativo")
    .flatMap(plan => {
      const results: ExpiringPlan[] = [];
      const usesLeft = planUsesRemaining(plan);
      if (usesLeft !== null && usesLeft <= usageThreshold) {
        results.push({ plan, reason: "usage", usesLeft, daysLeft: null });
      }
      if (plan.validUntil) {
        const expiry = new Date(plan.validUntil);
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
        if (daysLeft >= 0 && daysLeft <= withinDays) {
          results.push({ plan, reason: "date", usesLeft, daysLeft });
        }
      }
      return results;
    });
}

// ─── Churn risk ───────────────────────────────────────────────────────────────

export interface ChurnRiskTutor {
  tutor: Tutor;
  daysSinceLastVisit: number;
  activePlan: Plan;
}

/**
 * Returns tutors who have an active plan but have not visited in `inactivityDays` days.
 */
export function getChurnRiskTutors(inactivityDays = 30): ChurnRiskTutor[] {
  const cutoffDate = new Date(Date.now() - inactivityDays * 86_400_000)
    .toISOString()
    .split("T")[0];

  const recentVisitorIds = new Set(
    AppointmentDB.list()
      .filter(a => a.date >= cutoffDate)
      .map(a => a.tutorId)
  );

  const allPlans = PlanDB.list();

  return TutorDB.list()
    .filter(t => t.status === "ativo" && !recentVisitorIds.has(t.id))
    .flatMap(tutor => {
      const activePlan = allPlans.find(p => p.tutorId === tutor.id && isPlanActive(p));
      if (!activePlan) return [];
      const lastVisit = AppointmentDB.list()
        .filter(a => a.tutorId === tutor.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const daysSinceLastVisit = lastVisit
        ? Math.floor((Date.now() - new Date(lastVisit.date).getTime()) / 86_400_000)
        : 999;
      return [{ tutor, daysSinceLastVisit, activePlan }];
    });
}
