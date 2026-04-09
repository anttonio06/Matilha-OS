"use client";

import React, { useState, useMemo } from "react";
import {
  Dog, Users, CheckCircle, AlertTriangle, Plus, Eye,
  Clock, Star, FileText, Flame, Heart, Save, X, Syringe,
} from "lucide-react";
import { store } from "@/lib/store";
import { cn, percentage } from "@/lib/utils";
import { daycareGroups, todayAppointments, dogById, tutorById } from "@/lib/mock-data";
import { useDB, DogDB } from "@/lib/db";
import { Badge, Button, Card, Progress, StatCard, Tabs, Modal, Input } from "@/components/ui";
import type { Occurrence } from "@/types";

// ─── Occurrence helpers ───────────────────────────────────────────────────────

const OCC_STORAGE_KEY = "matilha:occurrences";

function loadOccurrences(): Occurrence[] {
  try { return JSON.parse(localStorage.getItem(OCC_STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveOccurrences(list: Occurrence[]) {
  localStorage.setItem(OCC_STORAGE_KEY, JSON.stringify(list));
}
function createOccurrence(data: Omit<Occurrence,"id"|"createdAt">): Occurrence {
  const occ: Occurrence = { ...data, id: `occ_${Date.now()}`, createdAt: new Date().toISOString() };
  saveOccurrences([...loadOccurrences(), occ]);
  return occ;
}

// ─── Severity config ──────────────────────────────────────────────────────────

const SEV_CFG = {
  baixa: { bg:"bg-green-100 text-green-700",  border:"border-green-300",  dot:"bg-green-500",  label:"Baixa"  },
  media: { bg:"bg-amber-100 text-amber-700",  border:"border-amber-300",  dot:"bg-amber-500",  label:"Média"  },
  alta:  { bg:"bg-red-100 text-red-700",      border:"border-red-300",    dot:"bg-red-500",    label:"Alta"   },
};

const TYPE_CFG = {
  comportamental: { icon:"🐾", label:"Comportamental" },
  saude:          { icon:"🩺", label:"Saúde"          },
  acidente:       { icon:"⚠️", label:"Acidente"       },
  mordida:        { icon:"🦷", label:"Mordida"        },
  alergia:        { icon:"🌿", label:"Alergia"        },
  outro:          { icon:"📝", label:"Outro"          },
};

// ─── Register Occurrence Modal ────────────────────────────────────────────────

function OccurrenceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const dogs = useDB(() => DogDB.list());
  const now  = new Date();

  const [form, setForm] = useState({
    dogId:       "",
    type:        "comportamental" as Occurrence["type"],
    severity:    "media"          as Occurrence["severity"],
    description: "",
    actionTaken: "",
    reportedBy:  "",
    date:        now.toISOString().split("T")[0],
    time:        now.toTimeString().slice(0,5),
    resolved:    false,
  });

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const dog = dogs.find(d => d.id === form.dogId);

  const submit = () => {
    if (!form.dogId)        return store.toast("warning","Selecione o cão envolvido.");
    if (!form.description)  return store.toast("warning","Descreva a ocorrência.");
    if (!form.reportedBy)   return store.toast("warning","Informe quem está registrando.");

    createOccurrence({
      dogId:       form.dogId,
      tutorId:     dog ? dogs.find(d => d.id === form.dogId)?.tutorId : undefined,
      type:        form.type,
      severity:    form.severity,
      description: form.description,
      actionTaken: form.actionTaken,
      reportedBy:  form.reportedBy,
      date:        form.date,
      time:        form.time,
      resolved:    form.resolved,
    });

    store.toast("success", `Ocorrência registrada — ${dog?.name}`);
    onSaved();
    onClose();
  };

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 bg-white";

  return (
    <Modal open onClose={onClose} size="lg" title="Registrar Ocorrência"
      description="Documente o incidente para histórico e comunicação com o tutor"
      footer={
        <>
          <Button variant="outline" onClick={onClose} icon={<X className="w-4 h-4"/>}>Cancelar</Button>
          <Button onClick={submit} icon={<Save className="w-4 h-4"/>}>Salvar ocorrência</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Dog selector */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Cão envolvido *</label>
          <select className={inputCls} value={form.dogId} onChange={e => set("dogId", e.target.value)}>
            <option value="">Selecionar cão...</option>
            {dogs.map(d => <option key={d.id} value={d.id}>{d.name} — {d.breed}</option>)}
          </select>
        </div>

        {/* Type + Severity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Tipo</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(TYPE_CFG) as [Occurrence["type"], typeof TYPE_CFG[keyof typeof TYPE_CFG]][]).map(([k,v]) => (
                <button key={k} type="button" onClick={() => set("type", k)}
                  className={cn("flex items-center gap-1.5 px-2.5 py-2 rounded-lg border-2 text-xs font-semibold transition-all",
                    form.type === k ? "border-forest-500 bg-forest-50 text-forest-700" : "border-gray-100 text-gray-500 hover:border-gray-200")}>
                  <span>{v.icon}</span>{v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Gravidade</label>
            <div className="flex flex-col gap-1.5">
              {(Object.entries(SEV_CFG) as [Occurrence["severity"], typeof SEV_CFG[keyof typeof SEV_CFG]][]).map(([k,v]) => (
                <button key={k} type="button" onClick={() => set("severity", k)}
                  className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all",
                    form.severity === k ? `border-current ${v.bg}` : "border-gray-100 text-gray-500 hover:border-gray-200")}>
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", v.dot)}/>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alert banner for high severity */}
        {form.severity === "alta" && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"/>
            <p className="text-xs text-red-700 font-medium">
              Ocorrência de alta gravidade — o tutor será notificado automaticamente via WhatsApp.
            </p>
          </div>
        )}

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Data</label>
            <input className={inputCls} type="date" value={form.date} onChange={e => set("date", e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Horário</label>
            <input className={inputCls} type="time" value={form.time} onChange={e => set("time", e.target.value)}/>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Descrição detalhada *</label>
          <textarea className={cn(inputCls,"resize-none")} rows={3}
            placeholder="Descreva o que aconteceu com o máximo de detalhes..."
            value={form.description} onChange={e => set("description", e.target.value)}/>
        </div>

        {/* Action taken */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Medida tomada</label>
          <textarea className={cn(inputCls,"resize-none")} rows={2}
            placeholder="Como a situação foi manejada? Algum procedimento realizado?"
            value={form.actionTaken} onChange={e => set("actionTaken", e.target.value)}/>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Registrado por *</label>
            <input className={inputCls} placeholder="Nome do monitor / responsável"
              value={form.reportedBy} onChange={e => set("reportedBy", e.target.value)}/>
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-forest-600 rounded"
                checked={form.resolved} onChange={e => set("resolved", e.target.checked)}/>
              <span className="text-sm text-gray-700">Já resolvido / encerrado</span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Occurrence Card ──────────────────────────────────────────────────────────

function OccurrenceCard({ occ, dogs }: { occ: Occurrence; dogs: ReturnType<typeof DogDB.list> }) {
  const dog = dogs.find(d => d.id === occ.dogId);
  const sev = SEV_CFG[occ.severity];
  const typ = TYPE_CFG[occ.type];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("bg-white rounded-xl border border-l-4 p-4 space-y-3 shadow-sm", sev.border)}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-base">
          {typ.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900">{dog?.name ?? "Cão"}</p>
            <span className={cn("text-2xs font-bold px-2 py-0.5 rounded-full", sev.bg)}>
              {sev.label}
            </span>
            <span className="text-2xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {typ.label}
            </span>
            {occ.resolved && (
              <span className="text-2xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5"/>Resolvido
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {occ.date} às {occ.time} · Registrado por {occ.reportedBy}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-700 line-clamp-2">{occ.description}</p>

      {occ.actionTaken && (
        <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
          <CheckCircle className="w-3.5 h-3.5 text-forest-500 mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-gray-600">{occ.actionTaken}</p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => store.toast("info","Notificação WhatsApp enviada para o tutor.")}
          className="flex-1 text-xs py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-semibold transition-colors">
          Notificar tutor
        </button>
        <button onClick={() => {
          const list = loadOccurrences().map(o =>
            o.id === occ.id ? { ...o, resolved: true } : o
          );
          saveOccurrences(list);
          store.toast("success","Ocorrência marcada como resolvida.");
        }} className="flex-1 text-xs py-1.5 rounded-lg bg-forest-50 text-forest-700 hover:bg-forest-100 font-semibold transition-colors">
          Marcar resolvida
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CrechePage() {
  const dogs = useDB(() => DogDB.list());
  const [tab, setTab]             = useState<"presenca"|"grupos"|"ocorrencias">("presenca");
  const [showOccModal, setOccModal] = useState(false);
  const [occurrences, setOccurrences] = useState<Occurrence[]>(loadOccurrences);

  const refreshOccs = () => setOccurrences(loadOccurrences());

  const daycareApts = todayAppointments.filter(a => a.serviceType === "creche");
  const present     = daycareApts.filter(a => a.status === "em_andamento");
  const todayOccs   = occurrences.filter(o => o.date === new Date().toISOString().split("T")[0]);
  const openOccs    = occurrences.filter(o => !o.resolved);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Occurrence Modal */}
      {showOccModal && <OccurrenceModal onClose={() => setOccModal(false)} onSaved={refreshOccs}/>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creche</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {present.length} presentes · {daycareGroups.length} grupos · {openOccs.length} ocorrências em aberto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<FileText className="w-4 h-4"/>}
            onClick={() => setOccModal(true)}>
            Registrar ocorrência
          </Button>
          <Button icon={<Plus className="w-4 h-4"/>} onClick={() => store.openModal("novo_agendamento")}>
            Check-in manual
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Presentes"       value={present.length}   icon={<Dog className="w-4 h-4"/>}          color="green"/>
        <StatCard label="Capacidade"      value={`${present.length}/60`} icon={<Users className="w-4 h-4"/>}  color="blue"
          sub={`${percentage(present.length, 60)}% ocupado`}/>
        <StatCard label="Ocorrências hoje" value={todayOccs.length} icon={<AlertTriangle className="w-4 h-4"/>} color={todayOccs.length > 0 ? "red" : "gray"}/>
        <StatCard label="Em adaptação"    value={dogs.filter(d => d.tags?.includes("adaptacao")).length}
          icon={<Star className="w-4 h-4"/>} color="amber"/>
      </div>

      {/* Alert strip for open occurrences */}
      {openOccs.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {openOccs.length} ocorrência{openOccs.length > 1 ? "s" : ""} em aberto
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {openOccs.filter(o => o.severity === "alta").length} alta gravidade ·{" "}
              {openOccs.filter(o => o.severity === "media").length} média gravidade
            </p>
          </div>
          <button onClick={() => setTab("ocorrencias")}
            className="text-xs font-bold text-red-700 hover:underline whitespace-nowrap">
            Ver todas →
          </button>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          { id:"presenca",    label:"Presença",    count: present.length     },
          { id:"grupos",      label:"Grupos",      count: daycareGroups.length },
          { id:"ocorrencias", label:"Ocorrências", count: openOccs.length    },
        ]}
        active={tab}
        onChange={v => setTab(v as typeof tab)}
      />

      {/* ── Presença ── */}
      {tab === "presenca" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {daycareApts.map(apt => {
            const dog   = dogById(apt.dogId);
            const tutor = tutorById(apt.tutorId);
            const isAdapting = dog?.tags?.includes("adaptacao");
            const hasAlert   = dog?.behavioralRestrictions || dog?.medicalRestrictions;
            const energyCfg = {
              baixa:     "text-green-600 bg-green-50",
              moderada:  "text-blue-600 bg-blue-50",
              alta:      "text-amber-600 bg-amber-50",
              muito_alta:"text-red-600 bg-red-50",
            }[dog?.energyLevel ?? "moderada"] ?? "text-gray-600 bg-gray-50";

            return (
              <Card key={apt.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    isAdapting ? "bg-amber-100" : "bg-forest-100")}>
                    <span className={cn("font-bold text-sm", isAdapting ? "text-amber-700" : "text-forest-700")}>
                      {dog?.name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{dog?.name}</p>
                      {isAdapting && <Badge variant="amber" size="sm"><Star className="w-2.5 h-2.5 mr-0.5"/>Adaptação</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{tutor?.name} · {dog?.breed}</p>
                  </div>
                  <div className={cn("status-dot", apt.status === "em_andamento" ? "active" : "neutral")}/>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className={cn("rounded-lg p-2 text-center", energyCfg)}>
                    <p className="text-2xs opacity-70 mb-0.5">Energia</p>
                    <p className="text-xs font-bold capitalize">{dog?.energyLevel?.replace("_"," ") ?? "—"}</p>
                  </div>
                  <div className="bg-forest-50 rounded-lg p-2 text-center">
                    <p className="text-2xs text-forest-600 mb-0.5">Social</p>
                    <p className="text-xs font-bold text-forest-700 capitalize">{dog?.socialLevel?.replace("_"," ") ?? "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-2xs text-gray-400 mb-0.5">Porte</p>
                    <p className="text-xs font-bold text-gray-700 capitalize">{dog?.size ?? "—"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Entrada: {apt.startTime}</span>
                  {apt.endTime && <span>Saída: {apt.endTime}</span>}
                </div>

                {/* Alerts */}
                {dog?.medicalRestrictions && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                    <Syringe className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5"/>
                    <p className="text-xs text-red-700 font-medium">{dog.medicalRestrictions}</p>
                  </div>
                )}
                {dog?.behavioralRestrictions && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"/>
                    <p className="text-xs text-amber-800">{dog.behavioralRestrictions}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="xs" variant="secondary" className="flex-1"
                    icon={<FileText className="w-3 h-3"/>}
                    onClick={() => { setOccModal(true); }}>
                    Ocorrência
                  </Button>
                  <Button size="xs" variant="outline" icon={<Eye className="w-3 h-3"/>}>Perfil</Button>
                </div>
              </Card>
            );
          })}
          {daycareApts.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-3 py-20 text-gray-400">
              <Dog className="w-12 h-12 opacity-20"/>
              <p className="text-sm font-medium">Nenhum cão em creche hoje</p>
            </div>
          )}
        </div>
      )}

      {/* ── Grupos ── */}
      {tab === "grupos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {daycareGroups.map(group => (
            <Card key={group.id} padding="none">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100"
                style={{ borderLeftColor: group.color, borderLeftWidth: 3 }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: group.color + "22" }}>
                  <span className="text-xs font-bold" style={{ color: group.color }}>{group.name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Grupo {group.name}</p>
                  <p className="text-xs text-gray-500">{group.space}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xl font-bold text-gray-900 num-display">{group.currentCount}/{group.capacity}</p>
                  <p className="text-2xs text-gray-400">{percentage(group.currentCount, group.capacity)}% ocupado</p>
                </div>
              </div>
              <div className="px-5 py-3 space-y-2">
                <Progress value={group.currentCount} max={group.capacity} size="md"
                  color={group.currentCount / group.capacity > 0.85 ? "amber" : "green"}/>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {group.sizeRange.map(s => (
                    <span key={s} className="text-2xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{s}</span>
                  ))}
                  {group.energyRange.map(e => (
                    <span key={e} className="text-2xs bg-forest-50 text-forest-600 px-2 py-0.5 rounded-full capitalize">{e.replace("_"," ")}</span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Ocorrências ── */}
      {tab === "ocorrencias" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="text-xs font-semibold text-gray-500">{occurrences.length} total</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-red-600 font-semibold">{openOccs.length} em aberto</span>
            </div>
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5"/>} onClick={() => setOccModal(true)}>
              Nova ocorrência
            </Button>
          </div>

          {occurrences.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
              <CheckCircle className="w-12 h-12 opacity-20"/>
              <p className="text-sm font-medium">Nenhuma ocorrência registrada</p>
              <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4"/>}
                onClick={() => setOccModal(true)}>
                Registrar primeira ocorrência
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...occurrences].reverse().map(occ => (
                <OccurrenceCard key={occ.id} occ={occ} dogs={dogs}/>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
