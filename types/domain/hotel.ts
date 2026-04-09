// ─── Hotel Domain Types ───────────────────────────────────────────────────────

export type RoomType         = "standard" | "premium" | "suite" | "familia";
export type ReservationStatus = "reservado" | "hospedado" | "checkout" | "cancelado";

export interface DailyUpdate {
  date: string;
  note: string;
  photo?: string;
}

export interface HotelReservation {
  id: string;
  dogId: string;
  tutorId: string;
  roomType: RoomType;
  roomNumber?: string;
  checkIn: string;            // ISO date
  checkOut: string;           // ISO date
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
  dailyUpdates?: DailyUpdate[];
}

export type OccurrenceType = "comportamental" | "saude" | "acidente" | "mordida" | "alergia" | "outro";
export type OccurrenceSeverity = "baixa" | "media" | "alta";

export interface Occurrence {
  id: string;
  dogId: string;
  tutorId?: string;
  date: string;
  time: string;
  type: OccurrenceType;
  severity: OccurrenceSeverity;
  description: string;
  actionTaken: string;
  reportedBy: string;
  resolved: boolean;
  createdAt: string;
}
