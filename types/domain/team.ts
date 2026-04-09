// ─── Team Domain Types ────────────────────────────────────────────────────────

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
