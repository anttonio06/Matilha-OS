"use client";

import React, { useState } from "react";
import {
  CreditCard, Plus, Search, AlertTriangle, CheckCircle,
  Clock, Zap, Trash2, Edit2, X, Save, History, ArrowUpCircle, RefreshCw,
} from "lucide-react";
import { store } from "@/lib/store";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useDB, DogDB, TutorDB, PlanDB, AppointmentDB, KEYS } from "@/lib/db";
import { Button, Input, Progress } from "@/components/ui";
import type { Plan } from "@/types";

// ─── localStorage plan templates ──────────────────────────────────────────────

const TPL_KEY = "matilha:plan:templates";

interface PlanTemplate {
  id: string;
  name: string;
  category: "creche" | "escola" | "hotel" | "avulso" | "combo";
  description: string;
  pricePerDay: number;   // base R$/day
  daysPerWeek: number;   // 1-5
  totalPrice: number;    // monthly/package price
  totalUses: number | null; // null = recurrent unlimited
  recurrent: boolean;
  services: string[];
  createdAt: string;
}

function loadTemplates(): PlanTemplate[] {
  try { return JSON.parse(localStorage.getItem(TPL_KEY) ?? "[]"); } catch { return []; }
}
function saveTemplates(list: PlanTemplate[]) {
  localStorage.setItem(TPL_KEY, JSON.stringify(list));
}

// ─── Category colors ──────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  creche: "bg-forest-500", escola: "bg-purple-500",
  hotel:  "bg-amber-500",  avulso: "bg-blue-500", combo: "bg-rose-500",
};
const CAT_BADGES: Record<string, string> = {
  creche: "bg-forest-50 text-forest-700 border-forest-100",
  escola: "bg-purple-50 text-purple-700 border-purple-100",
  hotel:  "bg-amber-50 text-amber-700 border-amber-100",
  avulso: "bg-blue-50 text-blue-700 border-blue-100",
  combo:  "bg-rose-50 text-rose-700 border-rose-100",
};

// ─── Create Template Modal ────────────────────────────────────────────────────

function TemplateFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: PlanTemplate;
  onClose: () => void;
  onSave: (tpl: PlanTemplate) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name:        initial?.name        ?? "",
    category:    initial?.category    ?? "creche" as PlanTemplate["category"],
    description: initial?.description ?? "",
    daysPerWeek: initial?.daysPerWeek ?? 3,
    totalPrice:  initial?.totalPrice  ?? 0,
    totalUses:   initial?.totalUses != null ? String(initial.totalUses) : "",
    recurrent:   initial?.recurrent   ?? true,
    services:    (initial?.services   ?? ["creche"]).join(", "),
  });

  const iCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 bg-white";

  const submit = () => {
    if (!form.name.trim()) return store.toast("warning","Nome do plano é obrigatório.");
    if (!form.totalPrice)  return store.toast("warning","Informe o valor do plano.");
    const tpl: PlanTemplate = {
      id:          initial?.id ?? `tpl_${Date.now()}`,
      name:        form.name.trim(),
      category:    form.category,
      description: form.description,
      daysPerWeek: form.daysPerWeek,
      pricePerDay: form.recurrent ? Math.round(form.totalPrice / (form.daysPerWeek * 4.3)) : 0,
      totalPrice:  Number(form.totalPrice),
      totalUses:   form.totalUses ? Number(form.totalUses) : null,
      recurrent:   form.recurrent,
      services:    form.services.split(",").map(s => s.trim()).filter(Boolean),
      createdAt:   initial?.createdAt ?? new Date().toISOString(),
    };
    onSave(tpl);
    onClose();
  };

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Editar template" : "Novo template de plano"}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400"/></button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nome do plano *</label>
            <input className={iCls} placeholder="Ex: Creche 3x por semana" value={form.name} onChange={e => set("name", e.target.value)}/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Categoria *</label>
              <select className={iCls} value={form.category} onChange={e => set("category", e.target.value as PlanTemplate["category"])}>
                <option value="creche">Creche</option>
                <option value="escola">Escola</option>
                <option value="hotel">Hotel</option>
                <option value="avulso">Avulso</option>
                <option value="combo">Combo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Dias por semana</label>
              <select className={iCls} value={form.daysPerWeek} onChange={e => set("daysPerWeek", Number(e.target.value))}>
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n}x por semana</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Descrição</label>
            <input className={iCls} placeholder="Breve descrição do plano" value={form.description} onChange={e => set("description", e.target.value)}/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Valor total (R$) *</label>
              <input className={iCls} type="number" placeholder="0.00" min="0" value={form.totalPrice || ""} onChange={e => set("totalPrice", Number(e.target.value))}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nº de usos (vazio = ilimitado)</label>
              <input className={iCls} type="number" placeholder="Ex: 12" min="1" value={form.totalUses} onChange={e => set("totalUses", e.target.value)}/>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Serviços incluídos (separados por vírgula)</label>
            <input className={iCls} placeholder="creche, banho, escola" value={form.services} onChange={e => set("services", e.target.value)}/>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <button
              onClick={() => set("recurrent", !form.recurrent)}
              className={cn("w-10 h-5 rounded-full transition-colors relative flex-shrink-0", form.recurrent ? "bg-forest-500" : "bg-gray-300")}>
              <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", form.recurrent ? "left-5" : "left-0.5")}/>
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-800">Recorrente mensal</p>
              <p className="text-xs text-gray-500">{form.recurrent ? "Renovação automática todo mês" : "Plano avulso / pacote único"}</p>
            </div>
          </div>

          {form.totalPrice > 0 && form.recurrent && (
            <div className="bg-forest-50 rounded-xl p-3 text-xs text-forest-700">
              <p className="font-semibold">Resumo do plano</p>
              <p className="mt-1">{form.daysPerWeek}x/semana · ~{Math.round(form.daysPerWeek * 4.3)} dias/mês · R$ {(form.totalPrice / (form.daysPerWeek * 4.3)).toFixed(2)}/dia</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700 flex items-center justify-center gap-2">
              <Save className="w-4 h-4"/> {isEdit ? "Salvar alterações" : "Criar template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Plan Modal ────────────────────────────────────────────────────────

function AssignPlanModal({ tpl, onClose }: { tpl: PlanTemplate; onClose: () => void }) {
  const dogs   = useDB(() => DogDB.list());
  const tutors = useDB(() => TutorDB.list());
  const [dogId, setDogId]   = useState("");
  const [price, setPrice]   = useState(String(tpl.totalPrice));
  const [start, setStart]   = useState(new Date().toISOString().split("T")[0]);
  const today = new Date();
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().split("T")[0];
  const [end, setEnd] = useState(defaultEnd);
  const [notes, setNotes] = useState("");

  const iCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 bg-white";

  const submit = () => {
    if (!dogId) return store.toast("warning","Selecione o cão.");
    const dog = dogs.find(d => d.id === dogId)!;
    const tutor = tutors.find(t => t.id === dog.tutorId);
    PlanDB.create({
      name:             tpl.name,
      category:         tpl.category as never,
      totalUses:        tpl.totalUses ?? undefined,
      usedUses:         0,
      validFrom:        start,
      validUntil:       end,
      price:            Number(price),
      recurrent:        tpl.recurrent,
      status:           "ativo",
      tutorId:          tutor?.id ?? "",
      dogId,
      includedServices: tpl.services as never,
      notes,
    });
    store.toast("success", `Plano "${tpl.name}" atribuído a ${dog.name}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Emitir plano</h2>
              <p className="text-xs text-gray-500 mt-0.5">{tpl.name}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400"/></button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Cão *</label>
            <select className={iCls} value={dogId} onChange={e => setDogId(e.target.value)}>
              <option value="">Selecionar cão...</option>
              {dogs.map(d => {
                const t = tutors.find(x => x.id === d.tutorId);
                return <option key={d.id} value={d.id}>{d.name}{t ? ` (${t.name})` : ""}</option>;
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Início</label>
              <input className={iCls} type="date" value={start} onChange={e => setStart(e.target.value)}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Vencimento</label>
              <input className={iCls} type="date" value={end} onChange={e => setEnd(e.target.value)}/>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Valor cobrado (R$)</label>
            <input className={iCls} type="number" value={price} onChange={e => setPrice(e.target.value)}/>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Observações</label>
            <textarea className={cn(iCls,"resize-none")} rows={2} placeholder="Condições especiais, descontos..." value={notes} onChange={e => setNotes(e.target.value)}/>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancelar</button>
            <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700">Emitir plano</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  tpl,
  onEdit,
  onDelete,
  onAssign,
}: {
  tpl: PlanTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <div className={cn("h-1 flex-shrink-0", CAT_COLORS[tpl.category] ?? "bg-gray-400")} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 leading-tight">{tpl.name}</p>
            {tpl.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{tpl.description}</p>}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-forest-600 transition-colors">
              <Edit2 className="w-3.5 h-3.5"/>
            </button>
            <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900 num-display">{formatCurrency(tpl.totalPrice)}</p>
            <p className="text-xs text-gray-500">/{tpl.recurrent ? "mês" : "pacote"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">{tpl.daysPerWeek}x por semana</p>
            <p className="text-xs text-gray-400">
              {tpl.totalUses ? `${tpl.totalUses} usos` : "Ilimitado"} · {tpl.recurrent ? "Recorrente" : "Avulso"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <span className={cn("text-2xs px-2 py-0.5 rounded-full border font-semibold capitalize", CAT_BADGES[tpl.category] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
            {tpl.category}
          </span>
          {tpl.services.map(s => (
            <span key={s} className="text-2xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{s}</span>
          ))}
        </div>

        {tpl.recurrent && tpl.daysPerWeek > 0 && (
          <p className="text-2xs text-gray-400">
            ≈ {formatCurrency(tpl.totalPrice / (tpl.daysPerWeek * 4.3))}/dia · {Math.round(tpl.daysPerWeek * 4.3)} dias/mês
          </p>
        )}

        <button onClick={onAssign}
          className="mt-auto w-full py-2 rounded-lg bg-forest-600 text-white text-xs font-bold hover:bg-forest-700 transition-colors">
          Emitir plano
        </button>
      </div>
    </div>
  );
}

// ─── Plan Details Modal ───────────────────────────────────────────────────────

function PlanDetailsModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const dog         = DogDB.get(plan.dogId);
  const tutor       = plan.tutorId ? TutorDB.get(plan.tutorId) : null;
  const allApts     = useDB(() => AppointmentDB.list(), KEYS.appointments);
  const history     = allApts
    .filter(a => a.planId === plan.id)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

  const used      = plan.usedUses ?? 0;
  const total     = plan.totalUses ?? 0;
  const remaining = total - used;
  const isLow     = total > 0 && remaining <= 3;

  const SERVICE_LABELS: Record<string, string> = {
    creche: "Creche", escola: "Escola", hotel: "Hotel",
    banho: "Banho", tosa: "Tosa", avulso: "Avulso", combo: "Combo",
  };

  const renew = () => {
    const newStart = plan.validUntil ?? new Date().toISOString().split("T")[0];
    const newEnd   = new Date(new Date(newStart).getTime() + 30 * 86_400_000).toISOString().split("T")[0];
    PlanDB.create({
      name:             plan.name,
      category:         plan.category,
      totalUses:        plan.totalUses,
      usedUses:         0,
      validFrom:        newStart,
      validUntil:       newEnd,
      price:            plan.price,
      recurrent:        plan.recurrent,
      status:           "ativo",
      tutorId:          plan.tutorId ?? "",
      dogId:            plan.dogId,
      includedServices: plan.includedServices,
      notes:            plan.notes,
    });
    PlanDB.update(plan.id, { status: "expirado" });
    store.toast("success", "Plano renovado com sucesso!");
    onClose();
  };

  const upgrade = () => {
    store.openModal("novo_plano", { dogId: plan.dogId, tutorId: plan.tutorId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">{plan.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {dog?.name ?? "—"} · {tutor?.name ?? "—"} · <span className="capitalize">{plan.category}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 ml-2">
            <X className="w-4 h-4 text-gray-400"/>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:"Valor", value: formatCurrency(plan.price) },
              { label:"Início", value: formatDate(plan.validFrom, "dd/MM/yy") },
              { label:"Vencimento", value: formatDate(plan.validUntil, "dd/MM/yy") },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-sm font-bold text-gray-800 num-display">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Consumption */}
          {total > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-600">Usos consumidos</p>
                <span className={cn("text-xs font-bold num-display", isLow ? "text-amber-600" : "text-gray-700")}>
                  {used} / {total}
                </span>
              </div>
              <Progress value={used} max={total} color={isLow ? "amber" : "green"} size="md"/>
              {isLow && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3"/> {remaining} uso{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-gray-400"/>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Histórico de uso</p>
              <span className="text-2xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">{history.length}</span>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum uso registrado ainda.</p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {history.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">
                        {formatDate(apt.date, "dd/MM/yy")} — {SERVICE_LABELS[apt.serviceType] ?? apt.serviceType}
                      </p>
                      <p className="text-2xs text-gray-400">{apt.startTime} · {apt.status}</p>
                    </div>
                    <span className={cn(
                      "text-2xs px-2 py-0.5 rounded-full font-semibold",
                      apt.status === "concluido"
                        ? "bg-green-100 text-green-700"
                        : apt.status === "cancelado"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={renew}
            className="flex-1 py-2.5 rounded-xl bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4"/> Renovar plano
          </button>
          <button
            onClick={upgrade}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-forest-600"/> Upgrade / Novo plano
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active Plan Card ─────────────────────────────────────────────────────────

function ActivePlanCard({ plan }: { plan: Plan }) {
  const [showDetails, setShowDetails] = useState(false);
  const dogs   = useDB(() => DogDB.list());
  const tutors = useDB(() => TutorDB.list());
  const dog    = dogs.find(d => d.id === plan.dogId);
  const tutor  = tutors.find(t => t.id === plan.tutorId);
  const used      = plan.usedUses ?? 0;
  const total     = plan.totalUses ?? 0;
  const remaining = total - used;
  const isLow     = total > 0 && remaining <= 3;

  const statusCfg = {
    ativo:    { icon: <CheckCircle className="w-3.5 h-3.5 text-green-500" />, cls: "bg-green-100 text-green-700" },
    expirado: { icon: <Clock className="w-3.5 h-3.5 text-gray-400" />,        cls: "bg-gray-100 text-gray-600"  },
    cancelado:{ icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />, cls: "bg-red-100 text-red-700"    },
    pausado:  { icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,       cls: "bg-amber-100 text-amber-700"},
    trial:    { icon: <Zap className="w-3.5 h-3.5 text-blue-500" />,          cls: "bg-blue-100 text-blue-700"  },
  };
  const st = statusCfg[plan.status] ?? statusCfg.ativo;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {showDetails && <PlanDetailsModal plan={plan} onClose={() => setShowDetails(false)}/>}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-forest-700 text-sm">{dog?.name[0] ?? "?"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 truncate">{plan.name}</p>
            <span className={cn("inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full", st.cls)}>
              {st.icon}{plan.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{dog?.name ?? "—"} · {tutor?.name ?? "—"}</p>
        </div>
        <div className={cn("px-2 py-1 rounded-md border text-xs font-semibold", CAT_BADGES[plan.category] ?? "bg-gray-50 text-gray-600 border-gray-100")}>
          {plan.category}
        </div>
      </div>

      {total > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Usos</span>
            <span className={cn("text-xs font-bold num-display", isLow ? "text-amber-600" : "text-gray-700")}>
              {used}/{total}
            </span>
          </div>
          <Progress value={used} max={total} color={isLow ? "amber" : "green"} size="md"/>
          {isLow && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3"/> Apenas {remaining} uso{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50 text-xs">
        <div><p className="text-gray-400 mb-0.5">Início</p><p className="font-semibold text-gray-700 num-display">{formatDate(plan.validFrom,"dd/MM")}</p></div>
        <div><p className="text-gray-400 mb-0.5">Vencimento</p><p className="font-semibold text-gray-700 num-display">{formatDate(plan.validUntil,"dd/MM")}</p></div>
        <div><p className="text-gray-400 mb-0.5">Valor</p><p className="font-bold text-forest-700 num-display">{formatCurrency(plan.price)}</p></div>
      </div>

      <div className="flex gap-2">
        <Button size="xs" variant="secondary" className="flex-1" onClick={() => setShowDetails(true)}>Detalhes</Button>
        <Button size="xs" variant="outline" className="flex-1"
          onClick={() => { PlanDB.update(plan.id, { status: plan.status === "ativo" ? "pausado" : "ativo" }); }}>
          {plan.status === "ativo" ? "Pausar" : "Ativar"}
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanosPage() {
  const plans  = useDB(() => PlanDB.list());
  const dogs   = useDB(() => DogDB.list());
  const [tab, setTab]       = useState<"ativos" | "templates" | "historico">("templates");
  const [search, setSearch] = useState("");
  const [catFilter, setCat] = useState("todos");
  const [templates, setTemplates] = useState<PlanTemplate[]>(loadTemplates);
  const [showForm, setShowForm]   = useState(false);
  const [editTpl, setEditTpl]     = useState<PlanTemplate | undefined>();
  const [assignTpl, setAssignTpl] = useState<PlanTemplate | undefined>();

  const refreshTemplates = () => setTemplates(loadTemplates());

  const saveTemplate = (tpl: PlanTemplate) => {
    const existing = loadTemplates();
    const idx = existing.findIndex(t => t.id === tpl.id);
    if (idx >= 0) existing[idx] = tpl; else existing.push(tpl);
    saveTemplates(existing);
    refreshTemplates();
    store.toast("success", editTpl ? "Template atualizado!" : "Template criado!");
    setEditTpl(undefined);
  };

  const deleteTemplate = (id: string) => {
    if (!confirm("Excluir este template de plano?")) return;
    saveTemplates(loadTemplates().filter(t => t.id !== id));
    refreshTemplates();
    store.toast("info","Template excluído.");
  };

  const active = plans.filter(p => p.status === "ativo");
  const mrr    = active.reduce((s, p) => s + (p.recurrent ? p.price : 0), 0);

  const filteredPlans = plans
    .filter(p => catFilter === "todos" || p.category === catFilter)
    .filter(p => {
      if (!search) return true;
      const dog   = dogs.find(d => d.id === p.dogId);
      const q     = search.toLowerCase();
      return dog?.name.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
    });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Modals */}
      {(showForm || editTpl) && (
        <TemplateFormModal
          initial={editTpl}
          onClose={() => { setShowForm(false); setEditTpl(undefined); }}
          onSave={saveTemplate}
        />
      )}
      {assignTpl && <AssignPlanModal tpl={assignTpl} onClose={() => setAssignTpl(undefined)}/>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos & Assinaturas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{active.length} planos ativos · MRR {formatCurrency(mrr)}</p>
        </div>
        <Button icon={<Plus className="w-4 h-4"/>} onClick={() => { setEditTpl(undefined); setShowForm(true); }}>
          Novo template
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"MRR",              value:formatCurrency(mrr,true), sub:`${active.filter(p=>p.recurrent).length} recorrentes`, cls:"text-green-600" },
          { label:"Planos ativos",    value:active.length,            sub:"em vigência",                                         cls:"text-blue-600"  },
          { label:"Templates criados",value:templates.length,         sub:"modelos disponíveis",                                 cls:"text-purple-600"},
          { label:"Ticket médio",     value:active.length ? formatCurrency(mrr/active.length) : "—", sub:"por assinante",        cls:"text-amber-600" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{k.label}</p>
            <p className={cn("text-2xl font-bold num-display", k.cls)}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-gray-200">
        {[
          { id:"templates", label:"Templates",  count:templates.length },
          { id:"ativos",    label:"Ativos",     count:active.length },
          { id:"historico", label:"Histórico",  count:plans.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2",
              tab===t.id ? "border-forest-600 text-forest-700" : "border-transparent text-gray-500 hover:text-gray-700")}>
            {t.label}
            {t.count > 0 && <span className="text-2xs font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Templates tab */}
      {tab === "templates" && (
        <div>
          {templates.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
              <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-4"/>
              <p className="text-base font-semibold text-gray-500">Nenhum template criado ainda</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">Crie templates personalizados para emitir planos rapidamente</p>
              <Button icon={<Plus className="w-4 h-4"/>} onClick={() => setShowForm(true)}>Criar primeiro template</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map(tpl => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  onEdit={() => { setEditTpl(tpl); setShowForm(false); }}
                  onDelete={() => deleteTemplate(tpl.id)}
                  onAssign={() => setAssignTpl(tpl)}
                />
              ))}
              <button
                onClick={() => { setEditTpl(undefined); setShowForm(true); }}
                className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center gap-3 hover:border-forest-300 hover:bg-forest-50/30 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-gray-400"/>
                </div>
                <p className="text-sm font-semibold text-gray-500">Novo template</p>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ativos tab */}
      {tab === "ativos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {["todos","creche","escola","hotel","avulso","combo"].map(c => (
                <button key={c} onClick={() => setCat(c)}
                  className={cn("px-3 py-1.5 text-xs font-semibold rounded-full border transition-all",
                    catFilter===c ? "bg-forest-600 text-white border-forest-600" : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white")}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
            <Input icon={<Search className="w-3.5 h-3.5"/>}
              placeholder="Buscar plano ou cão..." value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="w-52"/>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
              <p className="text-sm text-gray-400">Nenhum plano encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPlans.filter(p => p.status === "ativo").map(p => <ActivePlanCard key={p.id} plan={p}/>)}
            </div>
          )}
        </div>
      )}

      {/* Histórico tab */}
      {tab === "historico" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {plans.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">Nenhum plano registrado ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Cão / Tutor","Plano","Período","Valor","Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => {
                  const dog   = dogs.find(d => d.id === plan.dogId);
                  const st = {
                    ativo:    "bg-green-100 text-green-700",
                    expirado: "bg-gray-100 text-gray-600",
                    cancelado:"bg-red-100 text-red-700",
                    pausado:  "bg-amber-100 text-amber-700",
                    trial:    "bg-blue-100 text-blue-700",
                  }[plan.status] ?? "bg-gray-100 text-gray-600";
                  return (
                    <tr key={plan.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">{dog?.name ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-gray-800">{plan.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{plan.category}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 num-display">
                        {formatDate(plan.validFrom)} – {formatDate(plan.validUntil)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 num-display">{formatCurrency(plan.price)}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn("badge text-2xs", st)}>{plan.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
