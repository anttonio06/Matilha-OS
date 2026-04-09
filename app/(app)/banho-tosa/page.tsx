"use client";

import React, { useState } from "react";
import {
  Scissors, Clock, CheckCircle, Camera,
  RefreshCw, Plus, Zap,
  TrendingUp
} from "lucide-react";
import { store } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { todayAppointments, dogById, tutorById, team, planById } from "@/lib/mock-data";
import { Badge, Button, Card, Progress, StatCard, Tabs } from "@/components/ui";

const bathApts = todayAppointments.filter(a =>
  a.serviceType === "banho" || a.serviceType === "tosa" || a.serviceType === "banho_tosa"
);

const groomers = team.filter(t => t.role === "banhista");

type BathStatus = "aguardando" | "em_banho" | "secagem" | "tosa" | "finalizado" | "aguardando_retirada";

const workflowSteps: { id: BathStatus; label: string; color: string }[] = [
  { id: "aguardando",         label: "Aguardando",    color: "bg-gray-100 text-gray-600"   },
  { id: "em_banho",           label: "Em banho",      color: "bg-blue-100 text-blue-700"   },
  { id: "secagem",            label: "Secagem",       color: "bg-amber-100 text-amber-700" },
  { id: "tosa",               label: "Tosa",          color: "bg-purple-100 text-purple-700"},
  { id: "finalizado",         label: "Finalizado",    color: "bg-forest-100 text-forest-700"},
  { id: "aguardando_retirada",label: "Aguardando ret.",color: "bg-green-100 text-green-700" },
];

function BathCard({ apt, mockStatus }: { apt: typeof bathApts[0]; mockStatus: BathStatus }) {
  const dog   = dogById(apt.dogId);
  const tutor = tutorById(apt.tutorId);
  const plan  = apt.planId ? planById(apt.planId) : null;
  const [status, setStatus] = useState<BathStatus>(mockStatus);
  const step = workflowSteps.find(s => s.id === status)!;

  return (
    <Card className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-blue-700">{dog?.name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{dog?.name}</p>
            {plan && <Badge variant="green" size="sm">Plano</Badge>}
          </div>
          <p className="text-xs text-gray-500">{tutor?.name} · {dog?.breed}</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Agendado: {apt.startTime}
          </p>
        </div>
        <span className={cn("badge text-2xs", step.color)}>{step.label}</span>
      </div>

      {/* Dog characteristics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Porte",   value: dog?.size ?? "" },
          { label: "Peso",    value: `${dog?.weight}kg` },
          { label: "Energia", value: dog?.energyLevel.replace("_"," ") ?? "" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded p-2 text-center">
            <p className="text-2xs text-gray-400">{label}</p>
            <p className="text-xs font-semibold text-gray-700 capitalize mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Service */}
      <div className="flex items-center gap-2">
        <Scissors className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-700 capitalize font-medium">
          {apt.serviceType.replace("_", " & ")}
        </span>
        {apt.price && (
          <span className="ml-auto text-xs font-bold text-forest-700 num-display">
            {formatCurrency(apt.price)}
          </span>
        )}
      </div>

      {/* Workflow steps */}
      <div>
        <div className="flex items-center gap-1">
          {workflowSteps.map((s, i) => {
            const currentIdx = workflowSteps.findIndex(x => x.id === status);
            const isDone      = i < currentIdx;
            const isCurrent   = i === currentIdx;
            return (
              <React.Fragment key={s.id}>
                <div
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    isDone    ? "bg-forest-500" :
                    isCurrent ? "bg-blue-400" :
                    "bg-gray-200"
                  )}
                />
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-2xs text-gray-400">Entrada</span>
          <span className="text-2xs text-gray-400">Saída</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {status !== "aguardando_retirada" && status !== "finalizado" && (
          <Button size="xs" className="flex-1" onClick={() => {
            const nextIdx = workflowSteps.findIndex(s => s.id === status) + 1;
            if (nextIdx < workflowSteps.length) setStatus(workflowSteps[nextIdx].id);
          }}>
            Avançar etapa
          </Button>
        )}
        {status === "finalizado" && (
          <Button size="xs" className="flex-1" onClick={() => setStatus("aguardando_retirada")}>
            Notificar tutor
          </Button>
        )}
        <Button size="xs" variant="outline" icon={<Camera className="w-3 h-3" />}>Foto</Button>
      </div>

      {/* Upsell suggestion */}
      {(dog?.energyLevel === "alta" || dog?.energyLevel === "muito_alta") && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-forest-50 border border-forest-100">
          <Zap className="w-3.5 h-3.5 text-forest-500 flex-shrink-0" />
          <p className="text-xs text-forest-700">Sugerir hidratação premium (+R$ 30)</p>
          <button className="ml-auto text-xs font-semibold text-forest-600">Oferecer →</button>
        </div>
      )}
    </Card>
  );
}

export default function BanhoTosaPage() {
  const [tab, setTab] = useState<"operacao" | "agenda" | "eficiencia">("operacao");

  const mockStatuses: BathStatus[] = ["em_banho", "secagem", "aguardando", "aguardando_retirada"];

  const completed = bathApts.filter((_, i) => mockStatuses[i % mockStatuses.length] === "aguardando_retirada").length;
  const inProgress = bathApts.filter((_, i) => ["em_banho","secagem","tosa"].includes(mockStatuses[i % mockStatuses.length])).length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banho & Tosa</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bathApts.length} atendimentos hoje · {groomers.length} profissionais</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<RefreshCw className="w-4 h-4" />} size="sm" onClick={() => store.openModal("novo_agendamento")}>Encaixe</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => store.openModal("novo_agendamento")}>Novo agendamento</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Agendamentos" value={bathApts.length} icon={<Scissors className="w-4 h-4" />} color="blue" sub="hoje" />
        <StatCard label="Em andamento" value={inProgress} icon={<Clock className="w-4 h-4" />} color="amber" />
        <StatCard label="Concluídos"   value={completed} icon={<CheckCircle className="w-4 h-4" />} color="green" />
        <StatCard label="Receita banho" value={formatCurrency(bathApts.reduce((s,a) => s + (a.price ?? 0), 0))}
          icon={<TrendingUp className="w-4 h-4" />} color="purple" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "operacao",   label: "Operação",   count: bathApts.length },
          { id: "agenda",     label: "Agenda do dia" },
          { id: "eficiencia", label: "Eficiência" },
        ]}
        active={tab} onChange={(v) => setTab(v as typeof tab)}
      />

      {tab === "operacao" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bathApts.map((apt, i) => (
            <BathCard key={apt.id} apt={apt} mockStatus={mockStatuses[i % mockStatuses.length]} />
          ))}
          {bathApts.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-3 py-20 text-gray-400">
              <Scissors className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Nenhum banho agendado para hoje</p>
            </div>
          )}
        </div>
      )}

      {tab === "agenda" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {groomers.map((groomer) => {
            const groomerApts = bathApts.slice(0, 2); // mock
            return (
              <Card key={groomer.id} padding="none">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-forest-700">{groomer.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{groomer.name}</p>
                    <p className="text-xs text-gray-500">{groomerApts.length} atendimentos · Cap: {groomer.dailyCapacity}/dia</p>
                  </div>
                  <div className="ml-auto">
                    <Progress value={groomerApts.length} max={groomer.dailyCapacity ?? 8} size="sm" color="green" showLabel />
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {groomerApts.map((apt) => {
                    const dog = dogById(apt.dogId);
                    return (
                      <div key={apt.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="text-xs text-gray-400 w-10 num-display">{apt.startTime}</div>
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-700">{dog?.name[0]}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{dog?.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{apt.serviceType.replace("_"," ")}</p>
                        </div>
                        {apt.price && <span className="text-xs font-bold text-forest-700 num-display">{formatCurrency(apt.price)}</span>}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "eficiencia" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groomers.map((groomer) => (
            <Card key={groomer.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-forest-700">{groomer.name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{groomer.name}</p>
                  <p className="text-xs text-gray-500">Comissão: {groomer.commission}%</p>
                </div>
                <Badge variant="green" size="sm" className="ml-auto">Ativo</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Atend./mês", value: "32" },
                  { label: "Tempo médio", value: "1h20" },
                  { label: "Taxa upsell", value: "18%" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-gray-900 num-display">{value}</p>
                    <p className="text-2xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Receita gerada</span>
                  <span className="font-bold text-forest-700 num-display">{formatCurrency(3200)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Comissão a pagar</span>
                  <span className="font-bold text-gray-900 num-display">{formatCurrency(3200 * (groomer.commission ?? 25) / 100)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
