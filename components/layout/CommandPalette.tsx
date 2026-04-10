"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Dog, Users, CalendarDays, CreditCard, BarChart3, Settings, ShoppingBag, Hotel, Scissors, GraduationCap, LogIn, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { DogDB, TutorDB, useDB, KEYS } from "@/lib/db";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface Result {
  id: string;
  label: string;
  sub?: string;
  icon: React.ElementType;
  href: string;
  group: string;
}

const commands: Result[] = [
  { id: "dashboard",   label: "Dashboard",          icon: LayoutDashboard, href: "/dashboard",   group: "Páginas" },
  { id: "agenda",      label: "Agenda",              icon: CalendarDays,    href: "/agenda",      group: "Páginas" },
  { id: "checkin",     label: "Check-in / Check-out",icon: LogIn,           href: "/checkin",     group: "Páginas" },
  { id: "creche",      label: "Creche",              icon: Dog,             href: "/creche",      group: "Páginas" },
  { id: "escola",      label: "Escola & Treino",     icon: GraduationCap,   href: "/escola",      group: "Páginas" },
  { id: "hotel",       label: "Hotel",               icon: Hotel,           href: "/hotel",       group: "Páginas" },
  { id: "banho",       label: "Banho & Tosa",        icon: Scissors,        href: "/banho-tosa",  group: "Páginas" },
  { id: "crm",         label: "CRM de Clientes",     icon: Users,           href: "/crm",         group: "Páginas" },
  { id: "planos",      label: "Planos & Assinaturas",icon: CreditCard,      href: "/planos",      group: "Páginas" },
  { id: "financeiro",  label: "Financeiro",          icon: BarChart3,       href: "/financeiro",  group: "Páginas" },
  { id: "loja",        label: "Loja / PDV",          icon: ShoppingBag,     href: "/loja",        group: "Páginas" },
  { id: "config",      label: "Configurações",       icon: Settings,        href: "/configuracoes",group: "Páginas" },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router   = useRouter();
  const dogs     = useDB(() => DogDB.list(),   KEYS.dogs);
  const tutors   = useDB(() => TutorDB.list(), KEYS.tutors);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!open) { setQuery(""); setSelected(0); return; }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!open) onClose(); // toggle handled by parent
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const dogResults: Result[] = dogs
    .filter((d) => query.length > 1 && d.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3)
    .map((d) => ({ id: d.id, label: d.name, sub: d.breed, icon: Dog, href: `/crm/${d.tutorId}`, group: "Cães" }));

  const tutorResults: Result[] = tutors
    .filter((t) => query.length > 1 && t.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3)
    .map((t) => ({ id: t.id, label: t.name, sub: t.phone, icon: Users, href: `/crm/${t.id}`, group: "Tutores" }));

  const cmdResults = commands.filter((c) =>
    !query || c.label.toLowerCase().includes(query.toLowerCase())
  );

  const results = [...tutorResults, ...dogResults, ...cmdResults];
  const groups = Array.from(new Set(results.map((r) => r.group)));

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  useEffect(() => { setSelected(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) navigate(results[selected].href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-float border border-gray-200 overflow-hidden animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar cão, tutor, página, ação..."
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
          />
          <kbd className="text-xs bg-gray-100 text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {results.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
              <Search className="w-8 h-8 opacity-30" />
              <p className="text-sm">Nenhum resultado encontrado</p>
            </div>
          )}

          {groups.map((group) => {
            const groupItems = results.filter((r) => r.group === group);
            return (
              <div key={group}>
                <p className="px-4 py-1.5 text-2xs font-bold uppercase tracking-widest text-gray-400">{group}</p>
                {groupItems.map((item) => {
                  const globalIdx = results.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        globalIdx === selected ? "bg-forest-50" : "hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                        globalIdx === selected ? "bg-forest-100 text-forest-600" : "bg-gray-100 text-gray-500"
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        {item.sub && (
                          <p className="text-xs text-gray-500 truncate">{item.sub}</p>
                        )}
                      </div>
                      {globalIdx === selected && (
                        <kbd className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-400">↵</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-4 bg-gray-50">
          <span className="text-2xs text-gray-400 flex items-center gap-1">
            <kbd className="bg-white border border-gray-200 rounded px-1 py-0.5">↑↓</kbd> navegar
          </span>
          <span className="text-2xs text-gray-400 flex items-center gap-1">
            <kbd className="bg-white border border-gray-200 rounded px-1 py-0.5">↵</kbd> selecionar
          </span>
          <span className="text-2xs text-gray-400 flex items-center gap-1">
            <kbd className="bg-white border border-gray-200 rounded px-1 py-0.5">ESC</kbd> fechar
          </span>
        </div>
      </div>
    </div>
  );
}
