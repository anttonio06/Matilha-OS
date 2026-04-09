// ─── Training / School Domain Types ──────────────────────────────────────────

import type { EnergyLevel, SocialLevel } from "./dog";

export type TrainingSessionType = "individual" | "grupo" | "online" | "visita_domiciliar";
export type AdaptationPhase = "inicial" | "progresso" | "avancado" | "completo";

export interface TrainingSession {
  id: string;
  dogId: string;
  tutorId: string;
  trainerId: string;
  date: string;
  duration: number;           // minutes
  type: TrainingSessionType;
  goals: string[];
  observations: string;
  emotionalResponse?: string;
  nextSteps?: string;
  planId?: string;
  price?: number;
}

export interface BehaviorProfile {
  dogId: string;
  updatedAt: string;
  energyLevel: EnergyLevel;
  socialLevel: SocialLevel;
  triggers: string[];
  strengths: string[];
  challenges: string[];
  protocols: string[];
  trainerNotes: string;
  adaptationPhase?: AdaptationPhase;
}
