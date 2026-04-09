// ─── Dog Domain Types ─────────────────────────────────────────────────────────

export type DogSize    = "mini" | "pequeno" | "medio" | "grande" | "gigante";
export type DogSex     = "macho" | "femea";
export type EnergyLevel = "baixa" | "moderada" | "alta" | "muito_alta";
export type SocialLevel = "reservado" | "seletivo" | "sociavel" | "muito_sociavel";

export interface Vaccine {
  name: string;
  appliedAt: string;
  expiresAt: string;
  document?: string;
}

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
