"use client";

import React, { useState, useMemo } from "react";
import {
  Hotel, Calendar, Dog, Star, Plus, ChevronRight,
  CheckCircle, MessageSquare, Camera, Package,
  Scissors, TrendingUp, AlertTriangle, Syringe,
  ChevronLeft, Edit2, X, Save, Bell, Heart,
} from "lucide-react";
import { store } from "@/lib/store";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useDB, DogDB, TutorDB, HotelDB } from "@/lib/db";
import { Badge, Button, Card, Modal, StatCard, Tabs } from "@/components/ui";
import type { HotelReservation } from "@/types";

// ─── Config helpers ───────────────────────────────────────────────────────────

const HOTEL_CFG_KEY = "matilha:hotel:config";
function getHotelConfig() {
  try {
    const s = localStorage.getItem(HOTEL_CFG_KEY);
    return s ? JSON.parse(s) : { schoolStudentRate: 95, nonStudentRate: 130 };
  } catch { return { schoolStudentRate: 95, nonStudentRate: 130 }; }
}
function saveHotelConfig(cfg: { schoolStudentRate: number; nonStudentRate: number }) {
  localStorage.setItem(HOTEL_CFG_KEY, JSON.stringify(cfg));
}

// ─── Alert Badge ──────────────────────────────────────────────────────────────

function AlertPill({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div className={cn("flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold", color)}>
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ─── Reservation Card ─────────────────────────────────────────────────────────

function ReservationCard({ res, dogs, tutors }: {
  res: HotelReservation;
  dogs: ReturnType<typeof DogDB.list>;
  tutors: ReturnType<typeof TutorDB.list>;
}) {
  const dog   = dogs.find(d => d.id === res.dogId);
  const tutor = tutors.find(t => t.id === res.tutorId);
  const [expanded, setExpanded] = useState(false);

  const statusCfg = {
    reservado:  { color:"blue"  as const, label:"Reservado"  },
    hospedado:  { color:"green" as const, label:"Hospedado"  },
    checkout:   { color:"gray"  as const, label:"Check-out"  },
    cancelado:  { color:"red"   as const, label:"Cancelado"  },
  };
  const st = statusCfg[res.status] ?? statusCfg["reservado"];

  const nights = Math.max(1, Math.ceil(
    (new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  ));

  const hasMedication = !!(res.medications);
  const hasAllergy    = !!(res.allergyAlert);
  const hasBelongings = !!(res.belongings || (res.belongingsList && res.belongingsList.length > 0));

  return (
    <Card className="flex flex-col gap-0">
      {/* Alert banner — always visible */}
      {(hasMedication || hasAllergy) && (
        <div className="flex flex-wrap gap-2 p-3 bg-red-50 border border-red-100 rounded-t-xl -mx-0 -mt-0 mb-3 -m-5 rounded-b-none p-4">
          <p className="w-full text-2xs font-bold text-red-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Bell className="w-3 h-3"/> ALERTAS IMPORTANTES
          </p>
          {hasMedication && (
            <AlertPill icon={<Syringe className="w-3 h-3"/>}
              text={res.medications!} color="bg-purple-100 text-purple-800"/>
          )}
          {hasAllergy && (
            <AlertPill icon={<AlertTriangle className="w-3 h-3"/>}
              text={res.allergyAlert!} color="bg-red-100 text-red-800"/>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-amber-700">{dog?.name[0] ?? "?"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{dog?.name}</p>
            <Badge variant={st.color} size="sm" dot>{st.label}</Badge>
            {res.isSchoolStudent && (
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">Aluno da Escola</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{tutor?.name}</p>
          <p className="text-xs text-gray-400">{dog?.breed} · {dog?.weight}kg</p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-2xs text-gray-400 mb-0.5">Check-in</p>
          <p className="text-xs font-semibold text-gray-800 num-display">{formatDate(res.checkIn,"dd/MM")}</p>
        </div>
        <div className="bg-forest-50 rounded-lg p-2.5 text-center">
          <p className="text-2xs text-forest-500 mb-0.5">Noites</p>
          <p className="text-sm font-bold text-forest-700">{nights}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-2xs text-gray-400 mb-0.5">Check-out</p>
          <p className="text-xs font-semibold text-gray-800 num-display">{formatDate(res.checkOut,"dd/MM")}</p>
        </div>
      </div>

      {/* Belongings */}
      {hasBelongings && (
        <div className="flex items-start gap-2 text-xs text-gray-600 mt-3">
          <Package className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-semibold text-amber-700 mb-0.5">Pertences para devolver</p>
            {res.belongingsList && res.belongingsList.length > 0 ? (
              <ul className="space-y-0.5">
                {res.belongingsList.map((item, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0"/>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{res.belongings}</p>
            )}
          </div>
        </div>
      )}

      {/* Food */}
      {res.food && (
        <div className="flex items-start gap-2 text-xs text-gray-600 mt-2">
          <Heart className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5"/>
          <span>{res.food}</span>
        </div>
      )}

      {/* Daily updates */}
      {res.dailyUpdates && res.dailyUpdates.length > 0 && (
        <div className="mt-3">
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-forest-700 font-semibold hover:text-forest-600">
            <MessageSquare className="w-3.5 h-3.5"/>
            {res.dailyUpdates.length} atualizações
            <ChevronRight className={cn("w-3 h-3 transition-transform", expanded && "rotate-90")}/>
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {res.dailyUpdates.map((u, i) => (
                <div key={i} className="flex gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-forest-400 rounded-full mt-1.5 flex-shrink-0"/>
                  <div>
                    <p className="text-2xs font-semibold text-gray-500">{formatDate(u.date,"dd/MM")}</p>
                    <p className="text-xs text-gray-700 mt-0.5">{u.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-50 pt-3 mt-3">
        <Button size="xs" variant="secondary" icon={<MessageSquare className="w-3 h-3"/>} className="flex-1"
          onClick={() => store.toast("success","Mensagem enviada ao tutor.")}>
          Atualizar tutor
        </Button>
        {res.exitBath && (
          <Button size="xs" variant="outline" icon={<Scissors className="w-3 h-3"/>} className="flex-1"
            onClick={() => store.openModal("novo_agendamento")}>
            Banho saída
          </Button>
        )}
        <Button size="xs" variant="ghost" icon={<Camera className="w-3 h-3"/>}
          onClick={() => store.toast("info","Foto registrada.")}>
          Foto
        </Button>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
        <span className="text-xs text-gray-500">Total hospedagem</span>
        <span className="font-bold text-gray-900 num-display">{formatCurrency(res.price)}</span>
      </div>
    </Card>
  );
}

// ─── Reservas Calendar ─────────────────────────────────────────────────────────

function ReservasCalendar({ reservations, dogs }: {
  reservations: HotelReservation[];
  dogs: ReturnType<typeof DogDB.list>;
}) {
  const [viewDate, setViewDate] = useState(new Date());
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstDow     = new Date(year, month, 1).getDay();
  const today        = new Date().toISOString().split("T")[0];

  const cells: (Date|null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_,i) => new Date(year, month, i+1)),
  ];

  function resOnDay(d: Date) {
    const ds = d.toISOString().split("T")[0];
    return reservations.filter(r => r.checkIn <= ds && r.checkOut >= ds && r.status !== "cancelado");
  }

  const statusColor: Record<string, string> = {
    reservado: "bg-blue-400", hospedado: "bg-green-500", checkout: "bg-gray-300", cancelado: "bg-red-300",
  };

  return (
    <Card className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setViewDate(new Date(year, month-1, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500"/>
        </button>
        <h3 className="font-bold text-gray-900">{MONTHS[month]} {year}</h3>
        <button onClick={() => setViewDate(new Date(year, month+1, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500"/>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
          <div key={d} className="text-center text-2xs font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="aspect-square"/>;
          const ds   = d.toISOString().split("T")[0];
          const ress = resOnDay(d);
          const isToday = ds === today;

          return (
            <div key={i}
              className={cn(
                "aspect-square rounded-xl p-1.5 flex flex-col transition-all border",
                isToday ? "border-forest-400 bg-forest-50" : "border-transparent hover:border-gray-200 hover:bg-gray-50",
              )}>
              <span className={cn("text-xs font-semibold leading-none",
                isToday ? "text-forest-700" : "text-gray-600")}>
                {d.getDate()}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {ress.slice(0,3).map(r => (
                  <div key={r.id} title={dogs.find(dg => dg.id === r.dogId)?.name}
                    className={cn("w-2 h-2 rounded-full", statusColor[r.status] ?? "bg-gray-300")}/>
                ))}
                {ress.length > 3 && <span className="text-2xs text-gray-400">+{ress.length-3}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100 flex-wrap">
        {[
          { color:"bg-blue-400",  label:"Reservado"  },
          { color:"bg-green-500", label:"Hospedado"  },
          { color:"bg-gray-300",  label:"Check-out"  },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-full", color)}/>
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming list */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Próximas reservas</p>
        <div className="space-y-2">
          {[...reservations]
            .filter(r => r.checkIn >= today && r.status !== "cancelado")
            .sort((a,b) => a.checkIn.localeCompare(b.checkIn))
            .slice(0,8)
            .map(r => {
              const dog = dogs.find(d => d.id === r.dogId);
              const nights = Math.ceil((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime())/(1000*60*60*24));
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-700">{dog?.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{dog?.name}</p>
                    <p className="text-xs text-gray-500 num-display">
                      {formatDate(r.checkIn,"dd/MM")} → {formatDate(r.checkOut,"dd/MM")} · {nights}n
                    </p>
                  </div>
                  <span className={cn("text-2xs font-bold px-2 py-1 rounded-full",
                    r.status === "reservado" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700")}>
                    {r.status}
                  </span>
                </div>
              );
            })}
          {reservations.filter(r => r.checkIn >= today).length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">Nenhuma reserva futura cadastrada</p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Observações Tab ──────────────────────────────────────────────────────────

function ObservacoesTab({ reservations, dogs }: {
  reservations: HotelReservation[];
  dogs: ReturnType<typeof DogDB.list>;
}) {
  const active = reservations.filter(r => r.status === "hospedado");
  const withAlerts = active.filter(r => r.medications || r.allergyAlert);
  const withBelongings = active.filter(r => r.belongings || (r.belongingsList && r.belongingsList.length > 0));

  return (
    <div className="space-y-6">
      {/* Critical alerts */}
      {withAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4"/> Alertas críticos — hóspedes atuais
          </h3>
          <div className="space-y-3">
            {withAlerts.map(r => {
              const dog = dogs.find(d => d.id === r.dogId);
              return (
                <div key={r.id} className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-red-800">{dog?.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{dog?.name}</p>
                      <p className="text-xs text-gray-500">{dog?.breed}</p>
                    </div>
                  </div>
                  {r.medications && (
                    <div className="flex items-start gap-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                      <Syringe className="w-3.5 h-3.5 text-purple-600 mt-0.5 flex-shrink-0"/>
                      <div>
                        <p className="text-2xs font-bold text-purple-700 uppercase tracking-wide">Medicação</p>
                        <p className="text-xs text-purple-900 mt-0.5">{r.medications}</p>
                      </div>
                    </div>
                  )}
                  {r.allergyAlert && (
                    <div className="flex items-start gap-2 p-2.5 bg-red-100 border border-red-300 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0"/>
                      <div>
                        <p className="text-2xs font-bold text-red-700 uppercase tracking-wide">Alergia</p>
                        <p className="text-xs text-red-900 mt-0.5">{r.allergyAlert}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {withAlerts.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0"/>
          <p className="text-sm text-green-800 font-medium">Nenhum alerta crítico nos hóspedes atuais</p>
        </div>
      )}

      {/* Belongings */}
      <div>
        <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Package className="w-4 h-4"/> Pertences para devolver no check-out
        </h3>
        {withBelongings.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">Nenhum pertence registrado para os hóspedes atuais</p>
        ) : (
          <div className="space-y-3">
            {withBelongings.map(r => {
              const dog = dogs.find(d => d.id === r.dogId);
              return (
                <div key={r.id} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-800">{dog?.name[0]}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{dog?.name}</p>
                    <span className="text-xs text-gray-500">· Saída {formatDate(r.checkOut,"dd/MM")}</span>
                  </div>
                  {r.belongingsList && r.belongingsList.length > 0 ? (
                    <ul className="space-y-1">
                      {r.belongingsList.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-amber-900">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"/>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-amber-800">{r.belongings}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All dogs observações */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Dog className="w-4 h-4"/> Observações de todos os hóspedes
        </h3>
        <div className="space-y-3">
          {active.map(r => {
            const dog = dogs.find(d => d.id === r.dogId);
            if (!r.notes && !dog?.medicalRestrictions && !dog?.behavioralRestrictions) return null;
            return (
              <div key={r.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-forest-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-forest-700">{dog?.name[0]}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{dog?.name}</p>
                </div>
                {dog?.medicalRestrictions && (
                  <p className="text-xs text-gray-700"><span className="font-semibold text-purple-700">Saúde:</span> {dog.medicalRestrictions}</p>
                )}
                {dog?.behavioralRestrictions && (
                  <p className="text-xs text-gray-700"><span className="font-semibold text-amber-700">Comportamento:</span> {dog.behavioralRestrictions}</p>
                )}
                {r.notes && (
                  <p className="text-xs text-gray-700"><span className="font-semibold text-gray-600">Obs. reserva:</span> {r.notes}</p>
                )}
              </div>
            );
          }).filter(Boolean)}
          {active.every(r => !r.notes && !dogs.find(d=>d.id===r.dogId)?.medicalRestrictions && !dogs.find(d=>d.id===r.dogId)?.behavioralRestrictions) && (
            <p className="text-xs text-gray-400 text-center py-4">Sem observações adicionais para os hóspedes atuais</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Config Modal ─────────────────────────────────────────────────────────────

function ConfigModal({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg] = useState<{ schoolStudentRate: number; nonStudentRate: number }>(getHotelConfig);
  const save = () => {
    saveHotelConfig(cfg);
    store.toast("success","Tarifas do hotel atualizadas!");
    onClose();
  };
  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 bg-white";

  return (
    <Modal open onClose={onClose} size="sm" title="Configurações do Hotel"
      description="Tarifas editáveis a qualquer momento"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} icon={<Save className="w-4 h-4"/>}>Salvar tarifas</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-forest-50 border border-forest-100 rounded-lg">
          <p className="text-xs text-forest-700 font-medium">
            Essas tarifas são usadas automaticamente ao criar novas reservas conforme o status de aluno.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-forest-500 inline-block"/>
            Aluno da Escola (por noite)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
            <input className={cn(inputCls,"pl-9")} type="number" min="0" step="0.01"
              value={cfg.schoolStudentRate}
              onChange={e => setCfg(c => ({ ...c, schoolStudentRate: Number(e.target.value) }))}/>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"/>
            Não aluno (por noite)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
            <input className={cn(inputCls,"pl-9")} type="number" min="0" step="0.01"
              value={cfg.nonStudentRate}
              onChange={e => setCfg(c => ({ ...c, nonStudentRate: Number(e.target.value) }))}/>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HotelPage() {
  const dogs         = useDB(() => DogDB.list());
  const tutors       = useDB(() => TutorDB.list());
  const reservations = useDB(() => HotelDB.list());

  const [tab, setTab]         = useState<"hospedados"|"observacoes"|"reservas">("hospedados");
  const [showConfig, setConfig] = useState(false);

  const active       = reservations.filter(r => r.status === "hospedado");
  const totalRevenue = reservations.reduce((s, r) => s + r.price, 0);
  const checkoutsWeek = useMemo(() => {
    const next7 = new Date(Date.now() + 7*86400000).toISOString().split("T")[0];
    const today  = new Date().toISOString().split("T")[0];
    return reservations.filter(r => r.checkOut >= today && r.checkOut <= next7 && r.status === "hospedado").length;
  }, [reservations]);

  const withAlerts = active.filter(r => r.medications || r.allergyAlert);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {showConfig && <ConfigModal onClose={() => setConfig(false)}/>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotel</h1>
          <p className="text-sm text-gray-500 mt-0.5">{active.length} hóspedes · {reservations.length} reservas totais</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Edit2 className="w-4 h-4"/>}
            onClick={() => setConfig(true)}>
            Tarifas
          </Button>
          <Button variant="outline" icon={<Calendar className="w-4 h-4"/>} size="sm"
            onClick={() => setTab("reservas")}>
            Ver reservas
          </Button>
          <Button icon={<Plus className="w-4 h-4"/>} onClick={() => store.openModal("nova_reserva")}>
            Nova reserva
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Hóspedes"    value={active.length}               icon={<Dog className="w-4 h-4"/>}           color="amber"/>
        <StatCard label="Alertas"     value={withAlerts.length}            icon={<Bell className="w-4 h-4"/>}          color={withAlerts.length > 0 ? "red" : "gray"}
          sub={withAlerts.length > 0 ? "Requerem atenção" : "Sem alertas"}/>
        <StatCard label="Receita mês" value={formatCurrency(totalRevenue)} icon={<TrendingUp className="w-4 h-4"/>}    color="blue"/>
        <StatCard label="Saídas 7 dias" value={checkoutsWeek}             icon={<CheckCircle className="w-4 h-4"/>}   color="gray"/>
      </div>

      {/* Alert strip */}
      {withAlerts.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl cursor-pointer"
          onClick={() => setTab("observacoes")}>
          <Bell className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse"/>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">
              {withAlerts.length} hóspede{withAlerts.length > 1 ? "s" : ""} com alertas de medicação ou alergia
            </p>
            <p className="text-xs text-red-600 mt-0.5">Clique para ver detalhes</p>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400"/>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          { id:"hospedados",  label:"Hospedados",    count: active.length      },
          { id:"observacoes", label:"Observações",   count: withAlerts.length   },
          { id:"reservas",    label:"Calendário de Reservas"                    },
        ]}
        active={tab}
        onChange={v => setTab(v as typeof tab)}
      />

      {/* ── Hospedados ── */}
      {tab === "hospedados" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.map(res => (
            <ReservationCard key={res.id} res={res} dogs={dogs} tutors={tutors}/>
          ))}
          {active.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-3 py-20 text-gray-400">
              <Hotel className="w-12 h-12 opacity-20"/>
              <p className="text-sm font-medium">Nenhum hóspede no momento</p>
              <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4"/>}
                onClick={() => store.openModal("nova_reserva")}>
                Nova reserva
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Observações ── */}
      {tab === "observacoes" && (
        <ObservacoesTab reservations={reservations} dogs={dogs}/>
      )}

      {/* ── Calendário ── */}
      {tab === "reservas" && (
        <ReservasCalendar reservations={reservations} dogs={dogs}/>
      )}
    </div>
  );
}
