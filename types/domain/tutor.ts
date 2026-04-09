// ─── Tutor Domain Types ───────────────────────────────────────────────────────

export type ContactPreference = "whatsapp" | "email" | "phone";
export type TutorStatus = "ativo" | "inativo" | "inadimplente";

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
  preferredContact: ContactPreference;
  source?: string;
  tags?: string[];
  notes?: string;
  status: TutorStatus;
  lastVisit?: string;
  createdAt: string;
}
