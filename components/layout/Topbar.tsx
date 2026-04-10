"use client";

import React, { useState } from "react";
import { Search, Bell, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDB, useDB, KEYS } from "@/lib/db";
import { store } from "@/lib/store";
import { CommandPalette } from "./CommandPalette";

interface TopbarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export function Topbar({ title, breadcrumbs, actions }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [readAll,    setReadAll]    = useState(false);

  const alerts = useDB(() => AlertDB.active(), KEYS.alerts);
  const unread = readAll ? 0 : alerts.filter((a) => !a.readAt).length;

  return (
    <>
      <header className={cn(
        "fixed top-0 right-0 z-20 h-[var(--topbar-height)] bg-white border-b border-gray-200",
        "left-[var(--sidebar-width)] flex items-center px-6 gap-4"
      )}>
        {/* Breadcrumbs / Title */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-gray-900 truncate">{crumb.label}</span>
                  ) : (
                    <a href={crumb.href} className="text-gray-500 hover:text-gray-700 transition-colors truncate">{crumb.label}</a>
                  )}
                </React.Fragment>
              ))}
            </nav>
          ) : title ? (
            <h1 className="text-base font-semibold text-gray-900">{title}</h1>
          ) : null}
        </div>

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            "hidden md:flex items-center gap-2 px-3 h-8 rounded-lg border border-gray-200 bg-gray-50",
            "text-sm text-gray-400 hover:border-gray-300 hover:bg-gray-100 transition-all",
            "min-w-[200px] max-w-[280px]"
          )}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 text-left">Buscar...</span>
          <div className="flex items-center gap-0.5">
            <span className="text-xs bg-white border border-gray-200 rounded px-1 text-gray-400">⌘</span>
            <span className="text-xs bg-white border border-gray-200 rounded px-1 text-gray-400">K</span>
          </div>
        </button>

        {/* Actions from page */}
        <div className="flex items-center gap-2">
          {actions}

          {/* Quick Add — opens modal menu */}
          <button
            onClick={() => store.openModal("quick_add")}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-forest-600 text-white text-sm font-medium hover:bg-forest-500 active:bg-forest-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((p) => !p)}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-2xs font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-10 w-96 bg-white rounded-xl border border-gray-200 shadow-float z-50 animate-scale-in overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">Alertas e Oportunidades</p>
                    <button
                      onClick={() => { setReadAll(true); setNotifOpen(false); store.toast("success", "Todos os alertas marcados como lidos."); }}
                      className="text-xs text-forest-600 hover:text-forest-700 font-medium"
                    >
                      Marcar todos
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                    {alerts.slice(0, 6).map((alert) => (
                      <div key={alert.id}
                        className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (alert.type === "opportunity") store.openModal("enviar_mensagem");
                          setNotifOpen(false);
                        }}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                          alert.type === "critical"    && "bg-red-500",
                          alert.type === "warning"     && "bg-amber-500",
                          alert.type === "opportunity" && "bg-forest-500",
                          alert.type === "info"        && "bg-blue-500",
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alert.description}</p>
                          {alert.actionLabel && (
                            <span className="text-xs font-semibold text-forest-600 mt-1 inline-block">
                              {alert.actionLabel} →
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                    <a href="/dashboard" className="text-xs text-forest-600 font-semibold hover:underline">
                      Ver todos os alertas →
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
