// ─── Core Entities ──────────────────────────────────────────────────────────

export type DogSize  = "mini" | "pequeno" | "medio" | "grande" | "gigante";
export type DogSex   = "macho" | "femea";
export type EnergyLevel = "baixa" | "moderada" | "alta" | "muito_alta";
export type SocialLevel = "reservado" | "seletivo" | "sociavel" | "muito_sociavel";

export interface Dog {
  id: string;
  name: string;
  photo?: string;
  breed: string;
  sex: DogSex;
  birthDate: string;
  size: DogSize;
  weight: number;
  neutered: boolean;
  tutorId: string;
  secondaryTutorId?: string;
  energyLevel: EnergyLevel;
  socialLevel: SocialLevel;
  medicalRestrictions?: string;
  behavioralRestrictions?: string;
  foodBrand?: string;
  foodAmount?: string;
  medications?: string[];
  vaccines: Vaccine[];
  tags?: string[];
  notes?: string;
  createdAt: string;
}

export interface Vaccine {
  name: string;
  appliedAt: string;
  expiresAt: string;
  document?: string;
}

export interface Tutor {
  id: string;
  name: string;
  photo?: string;
  cpf?: string;
  email: string;
  phone: string;
  whatsapp: string;
  address?: string;
  dogs: string[];           // Dog IDs
  activePlans: string[];    // Plan IDs
  totalSpent: number;
  ltv: number;
  preferredContact: "whatsapp" | "email" | "phone";
  source?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  lastVisit?: string;
  status: "ativo" | "inativo" | "inadimplente";
}

// ─── Services ───────────────────────────────────────────────────────────────

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

export interface Appointment {
  id: string;
  dogId: string;
  tutorId: string;
  serviceType: ServiceType;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;        // minutes
  professionalId?: string;
  status: AppointmentStatus;
  price?: number;
  planId?: string;
  notes?: string;
  observations?: string;
  createdAt: string;
  // Check-in / Check-out fields (set at runtime)
  checkinTime?: string;
  checkinObs?: string;
  checkinEmotionalState?: string;
  checkoutTime?: string;
  checkoutObs?: string;
  checkoutEmotionalState?: string;
}

// ─── Check-in / Check-out ────────────────────────────────────────────────────

export interface CheckIn {
  id: string;
  appointmentId: string;
  dogId: string;
  tutorId: string;
  serviceType: ServiceType;
  checkinAt: string;
  checkoutAt?: string;
  receivedBy: string;
  emotionalState: "calmo" | "ansioso" | "excitado" | "agitado" | "agressivo";
  observations?: string;
  tutorMessage?: string;
  boughtItems?: string[];
  pendingPayment?: number;
}

// ─── Plans & Subscriptions ───────────────────────────────────────────────────

export type PlanCategory = "creche" | "banho" | "combo" | "hotel" | "escola" | "avulso";
export type PlanStatus   = "ativo" | "expirado" | "cancelado" | "pausado" | "trial";

export interface Plan {
  id: string;
  name: string;
  category: PlanCategory;
  totalUses?: number;
  usedUses?: number;
  validFrom: string;
  validUntil: string;
  price: number;
  recurrent: boolean;
  status: PlanStatus;
  tutorId: string;
  dogId: string;
  includedServices: ServiceType[];
  discountedServices?: { type: ServiceType; discount: number }[];
  notes?: string;
}

// ─── Financial ───────────────────────────────────────────────────────────────

export type PaymentStatus = "pago" | "pendente" | "atrasado" | "cancelado";
export type PaymentMethod = "pix" | "cartao_credito" | "cartao_debito" | "dinheiro" | "plano";

export interface Transaction {
  id: string;
  type: "receita" | "despesa";
  category: ServiceType | "produto" | "outros";
  description: string;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  tutorId?: string;
  dogId?: string;
  appointmentId?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

// ─── Team ────────────────────────────────────────────────────────────────────

export type UserRole =
  | "admin"
  | "gestor"
  | "recepcao"
  | "banhista"
  | "monitor"
  | "treinador"
  | "financeiro"
  | "estoque"
  | "franqueado";

export interface TeamMember {
  id: string;
  name: string;
  photo?: string;
  role: UserRole;
  email: string;
  phone: string;
  active: boolean;
  specialties?: string[];
  dailyCapacity?: number;
  commission?: number;
  createdAt: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export type ProductCategory =
  | "petisco"
  | "mordedor"
  | "enriquecimento"
  | "higiene"
  | "acessorio"
  | "suplemento"
  | "outro";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  unit: string;
  sku?: string;
  photo?: string;
  description?: string;
  active: boolean;
}

// ─── Hotel ───────────────────────────────────────────────────────────────────

export type RoomType = "standard" | "premium" | "suite" | "familia";
export type ReservationStatus = "reservado" | "hospedado" | "checkout" | "cancelado";

export interface HotelReservation {
  id: string;
  dogId: string;
  tutorId: string;
  roomType: RoomType;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  status: ReservationStatus;
  food: string;
  medications?: string;
  allergyAlert?: string;
  belongings?: string;
  belongingsList?: string[];
  isSchoolStudent?: boolean;
  additionals?: string[];
  exitBath?: boolean;
  price: number;
  paidAmount?: number;
  notes?: string;
  dailyUpdates?: { date: string; note: string; photo?: string }[];
}

export interface Occurrence {
  id: string;
  dogId: string;
  tutorId?: string;
  date: string;
  time: string;
  type: "comportamental" | "saude" | "acidente" | "mordida" | "alergia" | "outro";
  severity: "baixa" | "media" | "alta";
  description: string;
  actionTaken: string;
  reportedBy: string;
  resolved: boolean;
  createdAt: string;
}

// ─── Daycare (Creche) ─────────────────────────────────────────────────────────

export interface DaycareGroup {
  id: string;
  name: string;
  sizeRange: DogSize[];
  energyRange: EnergyLevel[];
  capacity: number;
  currentCount: number;
  monitorId?: string;
  space?: string;
  color: string;
}

export interface DaycareSession {
  id: string;
  dogId: string;
  tutorId: string;
  date: string;
  groupId: string;
  status: "presente" | "falta" | "cancelado";
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  socialObservations?: string;
  incidents?: string;
  emotionalState?: string;
}

// ─── Training / School ────────────────────────────────────────────────────────

export interface TrainingSession {
  id: string;
  dogId: string;
  tutorId: string;
  trainerId: string;
  date: string;
  duration: number;
  type: "individual" | "grupo" | "online" | "visita_domiciliar";
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
  adaptationPhase?: "inicial" | "progresso" | "avancado" | "completo";
}

// ─── Notifications / Alerts ──────────────────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "critical" | "opportunity";

export interface Alert {
  id: string;
  type: AlertSeverity;
  title: string;
  description: string;
  entityType?: "dog" | "tutor" | "appointment" | "plan" | "financial";
  entityId?: string;
  actionLabel?: string;
  actionHref?: string;
  createdAt: string;
  readAt?: string;
  dismissed?: boolean;
}

// ─── Metrics / Dashboard ─────────────────────────────────────────────────────

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
