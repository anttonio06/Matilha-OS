"use client";

/**
 * Check-in / Check-out Service
 *
 * Orchestrates the check-in and check-out flows:
 *   - Updates appointment status and lifecycle timestamps
 *   - Deducts plan usage on checkout
 *   - Transitions hotel reservations to the correct status
 *   - Emits toast notifications via the global store
 *
 * Business rules live here, not in UI components.
 */

import { AppointmentDB, PlanDB, HotelDB } from "@/lib/db";
import { store } from "@/lib/store";
import type { Appointment } from "@/types/domain/appointment";
import type { HotelReservation } from "@/types/domain/hotel";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckInPayload {
  appointment: Appointment;
  emotionalState: string;
  observations?: string;
}

export interface CheckOutPayload {
  appointment: Appointment;
  emotionalState: string;
  observations?: string;
}

export interface ServiceResult {
  success: boolean;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentTime(): string {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function findActiveHotelReservation(dogId: string): HotelReservation | undefined {
  return HotelDB.list().find(
    r => r.dogId === dogId && r.status !== "cancelado" && r.status !== "checkout"
  );
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Confirm check-in for an appointment.
 * Transitions: agendado | confirmado → em_andamento
 * Side effects: hotel reservation → hospedado
 */
export function confirmCheckIn({ appointment, emotionalState, observations }: CheckInPayload): ServiceResult {
  try {
    AppointmentDB.update(appointment.id, {
      status: "em_andamento",
      checkinTime: currentTime(),
      checkinEmotionalState: emotionalState as Appointment["checkinEmotionalState"],
      checkinObs: observations || undefined,
    });

    // Hotel: transition reservation from reservado → hospedado
    if (appointment.serviceType === "hotel") {
      const reservation = findActiveHotelReservation(appointment.dogId);
      if (reservation?.status === "reservado") {
        HotelDB.update(reservation.id, { status: "hospedado" });
      }
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao confirmar check-in";
    return { success: false, error: message };
  }
}

/**
 * Confirm check-out for an appointment.
 * Transitions: em_andamento → concluido
 * Side effects:
 *   - Deducts 1 use from the associated plan (if plan exists and is not exhausted)
 *   - Hotel reservation → checkout
 */
export function confirmCheckOut({ appointment, emotionalState, observations }: CheckOutPayload): ServiceResult {
  try {
    AppointmentDB.update(appointment.id, {
      status: "concluido",
      checkoutTime: currentTime(),
      checkoutEmotionalState: emotionalState as Appointment["checkoutEmotionalState"],
      checkoutObs: observations || undefined,
    });

    // Plan: deduct one use
    if (appointment.planId) {
      const plan = PlanDB.get(appointment.planId);
      if (plan && plan.status === "ativo") {
        const isExhausted = plan.totalUses != null && (plan.usedUses ?? 0) >= plan.totalUses;
        if (!isExhausted) {
          PlanDB.update(plan.id, { usedUses: (plan.usedUses ?? 0) + 1 });
        }
      }
    }

    // Hotel: transition reservation to checkout
    if (appointment.serviceType === "hotel") {
      const reservation = findActiveHotelReservation(appointment.dogId);
      if (reservation) {
        HotelDB.update(reservation.id, { status: "checkout" });
      }
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao confirmar check-out";
    return { success: false, error: message };
  }
}

/**
 * Validate whether a check-in is allowed for the given appointment.
 * Returns a list of warnings/blocks to surface in the UI before confirming.
 */
export function validateCheckIn(appointment: Appointment): { warnings: string[]; blocked: boolean } {
  const warnings: string[] = [];
  let blocked = false;

  if (appointment.planId) {
    const plan = PlanDB.get(appointment.planId);
    if (!plan) {
      warnings.push("Plano associado não encontrado.");
    } else if (plan.status !== "ativo") {
      warnings.push(`Plano com status "${plan.status}". Verifique antes de prosseguir.`);
    } else {
      const today = new Date().toISOString().split("T")[0];
      if (plan.validUntil && plan.validUntil < today) {
        warnings.push("Plano expirado. O check-in será registrado sem dedução.");
      } else if (plan.totalUses != null && (plan.usedUses ?? 0) >= plan.totalUses) {
        warnings.push("Plano esgotado (0 usos restantes). Cobrar avulso.");
      }
    }
  }

  if (appointment.status === "cancelado" || appointment.status === "no_show") {
    warnings.push("Agendamento cancelado ou marcado como não compareceu.");
    blocked = true;
  }

  if (appointment.status === "concluido") {
    warnings.push("Check-in já foi registrado e concluído para este agendamento.");
    blocked = true;
  }

  return { warnings, blocked };
}

// ─── Convenience wrapper for UI (toast included) ──────────────────────────────

export function performCheckIn(payload: CheckInPayload, dogName: string): boolean {
  const result = confirmCheckIn(payload);
  if (result.success) {
    store.toast("success", `Check-in confirmado — ${dogName}`);
  } else {
    store.toast("error", result.error ?? "Erro ao fazer check-in");
  }
  return result.success;
}

export function performCheckOut(payload: CheckOutPayload, dogName: string): boolean {
  const result = confirmCheckOut(payload);
  if (result.success) {
    store.toast("success", `Check-out confirmado — ${dogName}`);
  } else {
    store.toast("error", result.error ?? "Erro ao fazer check-out");
  }
  return result.success;
}
