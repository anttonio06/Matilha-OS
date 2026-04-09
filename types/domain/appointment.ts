// ─── Appointment Domain Types ─────────────────────────────────────────────────

export type ServiceType =
  | "creche"
  | "banho"
  | "tosa"
  | "banho_tosa"
  | "hotel"
  | "escola"
  | "avaliacao"
  | "consulta"
  | "loja";

export type AppointmentStatus =
  | "agendado"
  | "confirmado"
  | "em_andamento"
  | "concluido"
  | "cancelado"
  | "no_show"
  | "aguardando";

export type EmotionalState = "calmo" | "ansioso" | "excitado" | "agitado" | "agressivo";

export interface Appointment {
  id: string;
  dogId: string;
  tutorId: string;
  serviceType: ServiceType;
  date: string;               // ISO date: "YYYY-MM-DD"
  startTime: string;          // "HH:MM"
  endTime?: string;           // "HH:MM"
  duration?: number;          // minutes
  professionalId?: string;
  status: AppointmentStatus;
  price?: number;
  planId?: string;
  notes?: string;
  observations?: string;
  createdAt: string;
  // Lifecycle fields — populated at check-in / check-out time
  checkinTime?: string;
  checkinObs?: string;
  checkinEmotionalState?: EmotionalState;
  checkoutTime?: string;
  checkoutObs?: string;
  checkoutEmotionalState?: EmotionalState;
}

export interface CheckIn {
  id: string;
  appointmentId: string;
  dogId: string;
  tutorId: string;
  serviceType: ServiceType;
  checkinAt: string;          // ISO datetime
  checkoutAt?: string;
  receivedBy: string;
  emotionalState: EmotionalState;
  observations?: string;
  tutorMessage?: string;
  boughtItems?: string[];
  pendingPayment?: number;
}
