"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Dog, Scissors,
  Hotel, GraduationCap, AlignLeft, LayoutGrid, AlertTriangle,
} from "lucide-react";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useDB, DogDB, TutorDB, AppointmentDB } from "@/lib/db";
import { Button, Card } from "@/components/ui";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h–19h
const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAYS_FULL  = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const SERVICE_CFG: Record<string, { bg: string; border: string; text: string; dot: string; icon: React.ReactNode; label: string }> = {
  creche:    { bg:"bg-forest-100", border:"border-forest-400", text:"text-forest-800", dot:"bg-forest-500", icon:<Dog className="w-3 h-3"/>,            label:"Creche"    },
  banho:     { bg:"bg-blue-100",   border:"border-blue-400",   text:"text-blue-800",   dot:"bg-blue-500",   icon:<Scissors className="w-3 h-3"/>,        label:"Banho"     },
  banho_tosa:{ bg:"bg-purple-100", border:"border-purple-400", text:"text-purple-800", dot:"bg-purple-500", icon:<Scissors className="w-3 h-3"/>,        label:"Banho+Tosa"},
  tosa:      { bg:"bg-indigo-100", border:"border-indigo-400", text:"text-indigo-800", dot:"bg-indigo-500", icon:<Scissors className="w-3 h-3"/>,        label:"Tosa"      },
  hotel:     { bg:"bg-amber-100",  border:"border-amber-400",  text:"text-amber-800",  dot:"bg-amber-500",  icon:<Hotel className="w-3 h-3"/>,           label:"Hotel"     },
  escola:    { bg:"bg-rose-100",   border:"border-rose-400",   text:"text-rose-800",   dot:"bg-rose-500",   icon:<GraduationCap className="w-3 h-3"/>,   label:"Escola"    },
  avaliacao: { bg:"bg-cyan-100",   border:"border-cyan-400",   text:"text-cyan-800",   dot:"bg-cyan-500",   icon:<Dog className="w-3 h-3"/>,             label:"Avaliação" },
};

const STATUS_CFG: Record<string, { bg: string; text: string; label: string }> = {
  agendado:     { bg:"bg-blue-100",    text:"text-blue-700",    label:"Agendado"     },
  confirmado:   { bg:"bg-green-100",   text:"text-green-700",   label:"Confirmado"   },
  em_andamento: { bg:"bg-forest-100",  text:"text-forest-700",  label:"Em andamento" },
  concluido:    { bg:"bg-gray-100",    text:"text-gray-600",    label:"Concluído"    },
  cancelado:    { bg:"bg-red-100",     text:"text-red-600",     label:"Cancelado"    },
  no_show:      { bg:"bg-orange-100",  text:"text-orange-600",  label:"Não compareceu"},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function parseHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

function formatDateHeader(d: Date) {
  return `${WEEKDAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

// ─── Mini Month Picker ────────────────────────────────────────────────────────

function MiniMonthPicker({ selected, onChange, onClose }: {
  selected: Date; onChange: (d: Date) => void; onClose: () => void;
}) {
  const [view, setView] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));

  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const firstDow    = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const today       = isoDate(new Date());

  const cells: (Date | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      new Date(view.getFullYear(), view.getMonth(), i + 1)
    ),
  ];

  return (
    <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth()-1, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500"/>
        </button>
        <p className="text-sm font-semibold text-gray-900">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </p>
        <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth()+1, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500"/>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS_SHORT.map(d => (
          <div key={d} className="text-center text-2xs font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i}/>;
          const ds       = isoDate(d);
          const isToday  = ds === today;
          const isSelected = ds === isoDate(selected);
          return (
            <button key={i}
              onClick={() => { onChange(d); onClose(); }}
              className={cn(
                "aspect-square flex items-center justify-center text-xs rounded-lg transition-all font-medium",
                isSelected ? "bg-forest-600 text-white"
                  : isToday ? "bg-forest-100 text-forest-700 font-bold"
                  : "hover:bg-gray-100 text-gray-700"
              )}>
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
        <button onClick={() => { onChange(new Date()); onClose(); }}
          className="flex-1 text-xs py-1.5 rounded-lg bg-forest-50 text-forest-700 font-semibold hover:bg-forest-100 transition-colors">
          Hoje
        </button>
        <button onClick={onClose}
          className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
          Fechar
        </button>
      </div>
    </div>
  );
}

// ─── Week Strip ───────────────────────────────────────────────────────────────

function WeekStrip({ selected, aptsPerDay, onChange }: {
  selected: Date;
  aptsPerDay: Record<string, number>;
  onChange: (d: Date) => void;
}) {
  const weekStart = startOfWeek(selected);
  const today = isoDate(new Date());

  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 7 }, (_, i) => {
        const d  = addDays(weekStart, i);
        const ds = isoDate(d);
        const count = aptsPerDay[ds] ?? 0;
        const isSelected = ds === isoDate(selected);
        const isToday    = ds === today;

        return (
          <button key={i} onClick={() => onChange(d)}
            className={cn(
              "flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all",
              isSelected ? "bg-forest-600 text-white shadow-md"
                : isToday ? "bg-forest-50 border-2 border-forest-300 text-forest-700"
                : "bg-white border border-gray-100 hover:border-forest-200 hover:bg-forest-50/50 text-gray-600"
            )}>
            <span className={cn("text-2xs font-semibold uppercase tracking-wide",
              isSelected ? "text-forest-200" : "text-gray-400")}>
              {WEEKDAYS_SHORT[d.getDay()]}
            </span>
            <span className={cn("text-xl font-bold leading-none",
              isSelected ? "text-white" : isToday ? "text-forest-700" : "text-gray-900")}>
              {d.getDate()}
            </span>
            {count > 0 ? (
              <span className={cn(
                "text-2xs font-semibold px-1.5 py-0.5 rounded-full",
                isSelected ? "bg-forest-500 text-white" : "bg-forest-100 text-forest-700"
              )}>
                {count}
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-transparent"/>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Day Calendar View ────────────────────────────────────────────────────────

function DayCalendarView({ apts, dogs, tutors }: {
  apts: ReturnType<typeof AppointmentDB.list>;
  dogs: ReturnType<typeof DogDB.list>;
  tutors: ReturnType<typeof TutorDB.list>;
}) {
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex overflow-auto" style={{ maxHeight: "calc(100vh - 380px)", minHeight: 480 }}>
        {/* Hour labels */}
        <div className="w-14 flex-shrink-0 border-r border-gray-100">
          {HOURS.map(h => (
            <div key={h} className="h-16 border-b border-gray-50 flex items-start pt-1 pl-2">
              <span className="text-2xs text-gray-400 font-medium num-display">{h}:00</span>
            </div>
          ))}
        </div>

        {/* Events area */}
        <div className="flex-1 relative min-w-0">
          {HOURS.map(h => (
            <div key={h} className="h-16 border-b border-gray-50"/>
          ))}

          {/* Half-hour ticks */}
          {HOURS.map(h => (
            <div key={`t${h}`} className="absolute left-0 right-0 border-b border-gray-50/70 pointer-events-none"
              style={{ top: `${(h - 7) * 64 + 32}px` }}/>
          ))}

          {/* Current time line */}
          {nowH >= 7 && nowH <= 19 && (
            <div className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
              style={{ top: `${(nowH - 7) * 64}px` }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0"/>
              <div className="flex-1 h-px bg-red-400"/>
            </div>
          )}

          {/* Appointment blocks */}
          {apts.map(apt => {
            const dog  = dogs.find(d => d.id === apt.dogId);
            const cfg  = SERVICE_CFG[apt.serviceType] ?? SERVICE_CFG["banho"];
            const start = parseHour(apt.startTime) - 7;
            const end   = apt.endTime ? parseHour(apt.endTime) - 7 : start + 1;
            const height = Math.max((end - start) * 64 - 4, 24);
            const top    = start * 64 + 2;

            return (
              <div key={apt.id}
                className={cn(
                  "absolute left-1 right-1 rounded-lg border-l-4 px-2 py-1.5 cursor-pointer",
                  "hover:brightness-95 transition-all overflow-hidden shadow-sm",
                  cfg.bg, cfg.border,
                  apt.status === "cancelado" ? "opacity-40" : ""
                )}
                style={{ top, height: `${height}px` }}
                onClick={() => store.toast("info", `${dog?.name ?? "Cão"} · ${apt.serviceType} · ${apt.startTime}`)}>
                <div className="flex items-center gap-1.5">
                  <span className={cfg.text}>{cfg.icon}</span>
                  <p className={cn("text-xs font-bold truncate", cfg.text)}>{dog?.name ?? "—"}</p>
                </div>
                {height > 38 && (
                  <p className={cn("text-2xs truncate mt-0.5", cfg.text.replace("800","600"))}>
                    {apt.startTime}{apt.endTime ? `–${apt.endTime}` : ""}
                  </p>
                )}
              </div>
            );
          })}

          {apts.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
              <CalendarDays className="w-10 h-10 opacity-30 mb-2"/>
              <p className="text-xs font-medium">Sem agendamentos neste dia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function DayListView({ apts, dogs, tutors }: {
  apts: ReturnType<typeof AppointmentDB.list>;
  dogs: ReturnType<typeof DogDB.list>;
  tutors: ReturnType<typeof TutorDB.list>;
}) {
  if (apts.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
      <CalendarDays className="w-12 h-12 opacity-20"/>
      <p className="text-sm font-medium">Sem agendamentos neste dia</p>
      <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4"/>}
        onClick={() => store.openModal("novo_agendamento")}>
        Agendar
      </Button>
    </div>
  );

  return (
    <div className="space-y-2">
      {apts.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(apt => {
        const dog   = dogs.find(d => d.id === apt.dogId);
        const tutor = tutors.find(t => t.id === apt.tutorId);
        const cfg   = SERVICE_CFG[apt.serviceType] ?? SERVICE_CFG["banho"];
        const st    = STATUS_CFG[apt.status] ?? STATUS_CFG["agendado"];
        const hasAlert = dog?.behavioralRestrictions || dog?.medicalRestrictions;

        return (
          <div key={apt.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100",
              "border-l-4 hover:shadow-sm transition-all cursor-pointer",
              cfg.border,
              apt.status === "cancelado" ? "opacity-50" : ""
            )}
            onClick={() => store.toast("info", `${dog?.name} · ${cfg.label} · ${apt.startTime}`)}>

            <div className="w-14 text-right flex-shrink-0">
              <p className="text-sm font-bold text-gray-800 num-display">{apt.startTime}</p>
              {apt.endTime && <p className="text-2xs text-gray-400 num-display">{apt.endTime}</p>}
            </div>

            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
              <span className={cfg.text}>{cfg.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-900">{dog?.name ?? "—"}</p>
                <span className={cn("text-2xs font-semibold px-2 py-0.5 rounded-full", st.bg, st.text)}>
                  {st.label}
                </span>
                <span className={cn("text-2xs font-semibold px-2 py-0.5 rounded-full", cfg.bg, cfg.text)}>
                  {cfg.label}
                </span>
                {hasAlert && <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {tutor?.name}
                {dog?.breed && ` · ${dog.breed}`}
                {apt.notes && ` · ${apt.notes}`}
              </p>
            </div>

            {apt.price != null && (
              <span className="text-sm font-bold text-forest-700 num-display flex-shrink-0">
                R$ {apt.price.toFixed(2).replace(".",",")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ServiceFilter = "todos" | "creche" | "banho" | "hotel" | "escola";

export default function AgendaPage() {
  const allDogs   = useDB(() => DogDB.list());
  const allTutors = useDB(() => TutorDB.list());
  const allApts   = useDB(() => AppointmentDB.list());

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPicker,  setShowPicker]  = useState(false);
  const [viewMode,    setViewMode]    = useState<"list" | "calendar">("list");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("todos");
  const [weekOffset,  setWeekOffset]  = useState(0);

  const selectedISO = isoDate(currentDate);

  // Calculate appointments per day for the whole dataset (for week strip dots)
  const aptsPerDay = useMemo(() => {
    const map: Record<string, number> = {};
    allApts.forEach(a => { map[a.date] = (map[a.date] ?? 0) + 1; });
    return map;
  }, [allApts]);

  // Appointments for selected date
  const dayApts = useMemo(() => {
    let list = allApts.filter(a => a.date === selectedISO);
    if (serviceFilter !== "todos") {
      list = list.filter(a => {
        if (serviceFilter === "banho") return ["banho","banho_tosa","tosa"].includes(a.serviceType);
        return a.serviceType === serviceFilter;
      });
    }
    return list;
  }, [allApts, selectedISO, serviceFilter]);

  // Service counts for the selected day
  const counts = useMemo(() => {
    const dayAll = allApts.filter(a => a.date === selectedISO);
    return {
      todos:   dayAll.length,
      creche:  dayAll.filter(a => a.serviceType === "creche").length,
      banho:   dayAll.filter(a => ["banho","banho_tosa","tosa"].includes(a.serviceType)).length,
      hotel:   dayAll.filter(a => a.serviceType === "hotel").length,
      escola:  dayAll.filter(a => a.serviceType === "escola").length,
    };
  }, [allApts, selectedISO]);

  // Week navigation — change week without losing selected day
  const goWeek = useCallback((dir: -1 | 1) => {
    setCurrentDate(d => addDays(d, dir * 7));
    setWeekOffset(o => o + dir);
  }, []);

  const goToday = useCallback(() => {
    setCurrentDate(new Date());
    setWeekOffset(0);
  }, []);

  const isToday = selectedISO === isoDate(new Date());

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {dayApts.length} agendamento{dayApts.length !== 1 ? "s" : ""} · {formatDateHeader(currentDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode("list")}
              className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5",
                viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              <AlignLeft className="w-3.5 h-3.5"/> Lista
            </button>
            <button onClick={() => setViewMode("calendar")}
              className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5",
                viewMode === "calendar" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              <LayoutGrid className="w-3.5 h-3.5"/> Grade
            </button>
          </div>
          <Button icon={<Plus className="w-4 h-4"/>} onClick={() => store.openModal("novo_agendamento")}>
            Agendar
          </Button>
        </div>
      </div>

      {/* Date navigation + week strip */}
      <Card className="space-y-4">
        {/* Week header */}
        <div className="flex items-center gap-3">
          <button onClick={() => goWeek(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0">
            <ChevronLeft className="w-4 h-4"/>
          </button>

          <div className="relative flex-1 flex justify-center">
            <button onClick={() => setShowPicker(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-forest-300 hover:bg-forest-50 transition-all">
              <CalendarDays className="w-4 h-4 text-forest-600"/>
              <p className="text-sm font-semibold text-gray-900">{formatDateHeader(currentDate)}</p>
            </button>
            {showPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)}/>
                <MiniMonthPicker
                  selected={currentDate}
                  onChange={d => { setCurrentDate(d); setWeekOffset(0); }}
                  onClose={() => setShowPicker(false)}
                />
              </>
            )}
          </div>

          <button onClick={() => goWeek(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0">
            <ChevronRight className="w-4 h-4"/>
          </button>

          {!isToday && (
            <button onClick={goToday}
              className="text-xs font-semibold text-forest-600 hover:text-forest-700 px-3 py-1.5 rounded-md hover:bg-forest-50 transition-colors whitespace-nowrap">
              Hoje
            </button>
          )}
        </div>

        {/* 7-day week strip */}
        <WeekStrip selected={currentDate} aptsPerDay={aptsPerDay} onChange={d => setCurrentDate(d)}/>
      </Card>

      {/* Service filter pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {(["todos","creche","banho","hotel","escola"] as const).map(f => (
          <button key={f} onClick={() => setServiceFilter(f)}
            className={cn("pill-tab flex items-center gap-1.5", serviceFilter === f && "active")}>
            {f === "creche" && <Dog className="w-3 h-3"/>}
            {f === "banho"  && <Scissors className="w-3 h-3"/>}
            {f === "hotel"  && <Hotel className="w-3 h-3"/>}
            {f === "escola" && <GraduationCap className="w-3 h-3"/>}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="text-2xs opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {viewMode === "calendar"
        ? <DayCalendarView apts={dayApts} dogs={allDogs} tutors={allTutors}/>
        : <DayListView     apts={dayApts} dogs={allDogs} tutors={allTutors}/>
      }
    </div>
  );
}
