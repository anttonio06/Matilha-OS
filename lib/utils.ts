import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact?: boolean): string {
  if (compact && value >= 1000) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string | Date, fmt = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM 'às' HH:mm", { locale: ptBR });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export function dogSizeLabel(size: string): string {
  const map: Record<string, string> = {
    mini:    "Mini",
    pequeno: "Pequeno",
    medio:   "Médio",
    grande:  "Grande",
    gigante: "Gigante",
  };
  return map[size] ?? size;
}

export function energyLabel(level: string): string {
  const map: Record<string, string> = {
    baixa:     "Baixa",
    moderada:  "Moderada",
    alta:      "Alta",
    muito_alta:"Muito Alta",
  };
  return map[level] ?? level;
}

export function planStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ativo:    "Ativo",
    expirado: "Expirado",
    cancelado:"Cancelado",
    pausado:  "Pausado",
    trial:    "Trial",
  };
  return map[status] ?? status;
}

export function serviceLabel(type: string): string {
  const map: Record<string, string> = {
    creche:    "Creche",
    banho:     "Banho",
    tosa:      "Tosa",
    banho_tosa:"Banho & Tosa",
    hotel:     "Hotel",
    escola:    "Escola",
    avaliacao: "Avaliação",
    consulta:  "Consulta",
    loja:      "Loja",
  };
  return map[type] ?? type;
}

export function appointmentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    agendado:    "Agendado",
    confirmado:  "Confirmado",
    em_andamento:"Em andamento",
    concluido:   "Concluído",
    cancelado:   "Cancelado",
    no_show:     "Não compareceu",
    aguardando:  "Aguardando",
  };
  return map[status] ?? status;
}

export function getDogAge(birthDate: string): string {
  const birth = parseISO(birthDate);
  const now   = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 +
                 (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  const rem   = months % 12;
  return rem > 0 ? `${years}a ${rem}m` : `${years}a`;
}

export function percentage(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const statusColors = {
  ativo:       "bg-green-100 text-green-800",
  inativo:     "bg-gray-100 text-gray-600",
  inadimplente:"bg-red-100 text-red-700",
  pausado:     "bg-amber-100 text-amber-700",
  expirado:    "bg-gray-100 text-gray-600",
  cancelado:   "bg-red-50 text-red-600",
  trial:       "bg-blue-100 text-blue-700",
  agendado:    "bg-blue-50 text-blue-700",
  confirmado:  "bg-green-50 text-green-700",
  em_andamento:"bg-forest-50 text-forest-700",
  concluido:   "bg-gray-50 text-gray-700",
  no_show:     "bg-red-50 text-red-600",
  aguardando:  "bg-amber-50 text-amber-700",
} as const;
