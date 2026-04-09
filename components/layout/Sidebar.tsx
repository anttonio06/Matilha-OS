"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CalendarDays, LogIn,
  Hotel, Users, CreditCard, BarChart3,
  Settings, ChevronDown, ChevronRight, Building2, MessageSquare,
  Dog, ClipboardList, BookOpen, Upload,
  GraduationCap, Heart, Eye, Users2, Plug,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavChild {
  hash: string;
  label: string;
  icon: React.ElementType;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  children?: NavChild[];
}

interface NavSection {
  id: string;
  label?: string;
  items: NavItem[];
}

// ─── Nav structure ────────────────────────────────────────────────────────────

const ESCOLA_CHILDREN: NavChild[] = [
  { hash: "visao_geral", label: "Visão Geral",        icon: Eye         },
  { hash: "presenca",    label: "Lista de Presença",  icon: ClipboardList },
  { hash: "familias",    label: "Famílias",            icon: Heart       },
  { hash: "agenda",      label: "Agenda",              icon: CalendarDays },
  { hash: "relatorios",  label: "Relatórios",          icon: BarChart3   },
  { hash: "equipe",      label: "Equipe",              icon: Users2      },
];

const navSections: NavSection[] = [
  {
    id: "main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id: "operacao",
    label: "Operação",
    items: [
      { href: "/agenda",  label: "Agenda",         icon: CalendarDays, badge: "4" },
      { href: "/checkin", label: "Check-in / Out",  icon: LogIn, badge: "2", badgeColor: "amber" },
      { href: "/creche",  label: "Creche",          icon: Dog           },
      { href: "/escola",  label: "Escola",          icon: GraduationCap },
      { href: "/hotel",   label: "Hotel",           icon: Hotel         },
    ],
  },
  {
    id: "clientes",
    label: "Clientes",
    items: [
      { href: "/crm",    label: "CRM",    icon: Users      },
      { href: "/planos", label: "Planos", icon: CreditCard },
    ],
  },
  {
    id: "negocio",
    label: "Negócio",
    items: [
      { href: "/financeiro", label: "Financeiro", icon: BarChart3 },
    ],
  },
  {
    id: "gestao",
    label: "Gestão",
    items: [
      {
        href: "/gestao-escola",
        label: "Gestão da Escola",
        icon: BookOpen,
        children: ESCOLA_CHILDREN,
      },
      { href: "/comunicacao",   label: "Comunicação",         icon: MessageSquare },
      { href: "/integracoes",   label: "Integrações",         icon: Plug          },
      { href: "/importar",      label: "Importar / Exportar", icon: Upload        },
      { href: "/configuracoes", label: "Configurações",       icon: Settings      },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [hash, setHash]           = useState("");

  useEffect(() => {
    const read = () => setHash(window.location.hash.replace("#", ""));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  // When navigating to gestao-escola, read hash after navigation
  useEffect(() => {
    if (pathname === "/gestao-escola") {
      setHash(window.location.hash.replace("#", "") || "visao_geral");
    }
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const toggleSection = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  const onGestaoEscola = pathname === "/gestao-escola";

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] flex flex-col z-30",
      "bg-forest-900 select-none",
      className
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[var(--topbar-height)] border-b border-forest-800/60 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-forest-400 flex items-center justify-center flex-shrink-0">
          <Dog className="w-4 h-4 text-forest-900" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none tracking-tight">MATILHA</p>
          <p className="text-forest-400 text-2xs font-medium leading-none mt-0.5 tracking-widest">OS</p>
        </div>
        <div className="ml-auto">
          <span className="text-2xs font-semibold bg-forest-400/20 text-forest-300 px-1.5 py-0.5 rounded">v1.0</span>
        </div>
      </div>

      {/* Unit Selector */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md bg-forest-800/60 hover:bg-forest-800 transition-colors group">
          <Building2 className="w-3.5 h-3.5 text-forest-400 flex-shrink-0" />
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-semibold text-white truncate">Matilha Equilibrada</p>
            <p className="text-2xs text-forest-400 truncate">São Paulo — Unidade Principal</p>
          </div>
          <ChevronDown className="w-3 h-3 text-forest-500 flex-shrink-0 group-hover:text-forest-300 transition-colors" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-1 space-y-0.5">
        {navSections.map((section) => (
          <div key={section.id}>
            {section.label && (
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 mt-2 mb-0.5 group"
              >
                <span className="text-2xs font-bold tracking-widest uppercase text-forest-500 group-hover:text-forest-400 transition-colors">
                  {section.label}
                </span>
                <ChevronDown className={cn(
                  "w-3 h-3 text-forest-600 transition-transform duration-200",
                  collapsed[section.id] && "-rotate-90"
                )} />
              </button>
            )}

            {!collapsed[section.id] && section.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.href}>
                  <Link
                    href={hasChildren ? `${item.href}#visao_geral` : item.href}
                    className={cn(
                      "relative flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-100",
                      "text-sm font-medium group",
                      active
                        ? "bg-forest-700/70 text-white nav-item-active"
                        : "text-forest-300 hover:bg-forest-800/70 hover:text-white"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      active ? "text-forest-300" : "text-forest-500 group-hover:text-forest-300"
                    )} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "text-2xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                        item.badgeColor === "amber"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-forest-600/50 text-forest-300"
                      )}>
                        {item.badge}
                      </span>
                    )}
                    {hasChildren && (
                      <ChevronRight className={cn(
                        "w-3 h-3 text-forest-500 transition-transform",
                        active && "rotate-90 text-forest-300"
                      )} />
                    )}
                  </Link>

                  {/* Sub-items */}
                  {hasChildren && active && (
                    <div className="ml-3 mt-0.5 border-l border-forest-700/60 pl-2 space-y-0.5 mb-1">
                      {item.children!.map((child) => {
                        const childActive = onGestaoEscola && (hash === child.hash || (!hash && child.hash === "visao_geral"));
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.hash}
                            href={`/gestao-escola#${child.hash}`}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                              childActive
                                ? "bg-forest-600/60 text-white"
                                : "text-forest-400 hover:bg-forest-800/50 hover:text-forest-200"
                            )}
                          >
                            <ChildIcon className={cn("w-3.5 h-3.5 flex-shrink-0", childActive ? "text-forest-200" : "text-forest-500")} />
                            <span className="truncate">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-forest-800/60 px-3 py-3 flex-shrink-0">
        <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-forest-800/60 transition-colors group">
          <div className="w-7 h-7 rounded-full bg-forest-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">AC</span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-semibold text-white truncate">Andréa Campos</p>
            <p className="text-2xs text-forest-400 truncate">Admin</p>
          </div>
          <Settings className="w-3.5 h-3.5 text-forest-500 group-hover:text-forest-300 transition-colors flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
}
