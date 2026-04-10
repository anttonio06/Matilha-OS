"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Dog, Phone, Mail, MessageSquare, CreditCard,
  Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Star, Zap, BarChart3, Package,
} from "lucide-react";
import { store } from "@/lib/store";
import { cn, formatCurrency, formatDate, getDogAge } from "@/lib/utils";
import {
  TutorDB, DogDB, AppointmentDB, PlanDB, TransactionDB, useDB, KEYS,
} from "@/lib/db";
import { Badge, Button, Card, StatCard } from "@/components/ui";

// ─── Churn risk score (0–100, higher = more risk) ─────────────────────────────
function churnScore(lastVisitDays: number, activePlans: number, totalVisits: number): number {
  let score = 0;
  if (lastVisitDays > 60)  score += 50;
  else if (lastVisitDays > 30) score += 25;
  else if (lastVisitDays > 14) score += 10;
  if (activePlans === 0)   score += 30;
  if (totalVisits < 3)     score += 20;
  return Math.min(score, 100);
}

function ChurnBadge({ score }: { score: number }) {
  if (score >= 60) return <Badge variant="red">Alto risco</Badge>;
  if (score >= 30) return <Badge variant="amber">Risco médio</Badge>;
  return <Badge variant="green">Fidelizado</Badge>;
}

// ─── Plan progress bar ────────────────────────────────────────────────────────
function PlanCard({ plan }: { plan: ReturnType<typeof PlanDB.list>[0] }) {
  const dog  = DogDB.get(plan.dogId);
  const used = plan.usedUses ?? 0;
  const total = plan.totalUses;
  const pct  = total ? Math.round((used / total) * 100) : null;
  const isExpired = plan.status !== "ativo";

  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 rounded-xl border",
      isExpired ? "border-gray-100 bg-gray-50" : "border-forest-100 bg-forest-50"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
          <p className="text-xs text-gray-500">{dog?.name} · válido até {formatDate(plan.validUntil)}</p>
        </div>
        <span className={cn(
          "badge text-2xs flex-shrink-0",
          plan.status === "ativo" ? "bg-forest-100 text-forest-700" : "bg-gray-100 text-gray-500"
        )}>{plan.status}</span>
      </div>
      {pct !== null && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{used}/{total} usos</span>
            <span>{pct}% consumido</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full">
            <div
              className={cn("h-1.5 rounded-full transition-all", pct >= 80 ? "bg-amber-500" : "bg-forest-500")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {plan.recurrent ? "Renovação automática" : "Plano avulso"} · {formatCurrency(plan.price)}
        </span>
        {pct !== null && pct >= 80 && plan.status === "ativo" && (
          <button
            className="text-xs font-semibold text-forest-600 hover:text-forest-700"
            onClick={() => store.openModal("novo_plano")}
          >
            Renovar →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Appointment row ──────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  agendado:     "bg-blue-100 text-blue-700",
  em_andamento: "bg-amber-100 text-amber-700",
  concluido:    "bg-forest-100 text-forest-700",
  cancelado:    "bg-red-100 text-red-700",
  falta:        "bg-gray-100 text-gray-500",
};

function AptRow({ apt }: { apt: ReturnType<typeof AppointmentDB.list>[0] }) {
  const dog = DogDB.get(apt.dogId);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-forest-700">{dog?.name?.[0] ?? "?"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 capitalize">{apt.serviceType.replace("_", " & ")}</p>
        <p className="text-xs text-gray-500">{dog?.name} · {formatDate(apt.date)} {apt.startTime}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {apt.price && <span className="text-xs font-semibold text-gray-700 num-display">{formatCurrency(apt.price)}</span>}
        <span className={cn("badge text-2xs", statusColor[apt.status] ?? "bg-gray-100 text-gray-500")}>{apt.status}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TutorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const tutors       = useDB(() => TutorDB.list(),       KEYS.tutors);
  const dogs         = useDB(() => DogDB.list(),         KEYS.dogs);
  const allPlans     = useDB(() => PlanDB.list(),        KEYS.plans);
  const allApts      = useDB(() => AppointmentDB.list(), KEYS.appointments);
  const transactions = useDB(() => TransactionDB.list(), KEYS.transactions);

  const tutor = tutors.find(t => t.id === id);

  const tutorDogs  = dogs.filter(d => d.tutorId === id);
  const tutorPlans = allPlans.filter(p => p.tutorId === id).sort((a, b) =>
    b.validFrom.localeCompare(a.validFrom)
  );
  const tutorApts  = allApts.filter(a => a.tutorId === id).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const tutorTxns  = transactions.filter(t => t.tutorId === id).sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  );

  const activePlans    = tutorPlans.filter(p => p.status === "ativo");
  const completedApts  = tutorApts.filter(a => a.status === "concluido");
  const ltv            = tutorTxns.filter(t => t.type === "receita" && t.status === "pago").reduce((s, t) => s + t.amount, 0);

  const lastVisitDate  = completedApts[0]?.date;
  const lastVisitDays  = lastVisitDate
    ? Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / 86_400_000)
    : 999;

  const risk = useMemo(
    () => churnScore(lastVisitDays, activePlans.length, completedApts.length),
    [lastVisitDays, activePlans.length, completedApts.length]
  );

  if (!tutor) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <AlertTriangle className="w-10 h-10 text-gray-300" />
        <p className="text-gray-500">Tutor não encontrado.</p>
        <Button variant="outline" onClick={() => router.push("/crm")}>Voltar ao CRM</Button>
      </div>
    );
  }

  const initials = tutor.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      {/* Back */}
      <button
        onClick={() => router.push("/crm")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> CRM de Clientes
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-forest-700">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{tutor.name}</h1>
            <ChurnBadge score={risk} />
            {tutor.status === "inativo" && <Badge variant="gray">Inativo</Badge>}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
            {tutor.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{tutor.phone}</span>}
            {tutor.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{tutor.email}</span>}
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Cliente desde {formatDate(tutor.createdAt ?? "")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<MessageSquare className="w-4 h-4" />}
            onClick={() => store.openModal("enviar_mensagem", { tutorId: id })}>
            Mensagem
          </Button>
          <Button icon={<CreditCard className="w-4 h-4" />}
            onClick={() => store.openModal("novo_plano")}>
            Novo plano
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="LTV total"        value={formatCurrency(ltv, true)}       icon={<TrendingUp className="w-4 h-4" />} color="green" />
        <StatCard label="Visitas totais"   value={completedApts.length}            icon={<CheckCircle className="w-4 h-4" />} color="blue" />
        <StatCard label="Última visita"    value={lastVisitDays < 999 ? `${lastVisitDays}d atrás` : "—"} icon={<Clock className="w-4 h-4" />} color={lastVisitDays > 30 ? "red" : "gray"} />
        <StatCard label="Planos ativos"    value={activePlans.length}              icon={<CreditCard className="w-4 h-4" />} color={activePlans.length > 0 ? "purple" : "red"} />
      </div>

      {/* Churn alert */}
      {risk >= 60 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Risco alto de churn</p>
            <p className="text-xs text-red-600 mt-0.5">
              {lastVisitDays > 30 && `Sem visita há ${lastVisitDays} dias. `}
              {activePlans.length === 0 && "Nenhum plano ativo. "}
              Considere entrar em contato para reengajar.
            </p>
          </div>
          <Button size="xs" onClick={() => store.openModal("enviar_mensagem", { tutorId: id })}>
            Enviar mensagem
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Dogs */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Cães ({tutorDogs.length})</p>
              <Button size="xs" variant="outline" onClick={() => store.openModal("novo_cao")}>+ Cão</Button>
            </div>
            <div className="space-y-3">
              {tutorDogs.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum cão cadastrado.</p>
              )}
              {tutorDogs.map(dog => (
                <div key={dog.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Dog className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{dog.name}</p>
                    <p className="text-xs text-gray-500">{dog.breed} · {getDogAge(dog.birthDate)}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {dog.tags?.slice(0, 2).map(t => (
                      <span key={t} className="text-2xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Plans */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Planos ({tutorPlans.length})</p>
              <Button size="xs" variant="outline" onClick={() => store.openModal("novo_plano")}>+ Plano</Button>
            </div>
            <div className="space-y-3">
              {tutorPlans.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum plano.</p>
              )}
              {tutorPlans.slice(0, 5).map(plan => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </Card>

          {/* Notes */}
          {tutor.notes && (
            <Card>
              <p className="text-xs font-semibold text-gray-600 mb-2">Observações</p>
              <p className="text-sm text-gray-700">{tutor.notes}</p>
            </Card>
          )}
        </div>

        {/* Right column — history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment history */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Histórico de atendimentos ({tutorApts.length})</p>
              <Button size="xs" variant="outline" onClick={() => store.openModal("novo_agendamento")}>+ Agendar</Button>
            </div>
            {tutorApts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Nenhum atendimento registrado.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {tutorApts.slice(0, 20).map(apt => <AptRow key={apt.id} apt={apt} />)}
              </div>
            )}
          </Card>

          {/* Financial summary */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Financeiro</p>
              <span className="text-xs text-gray-400">{tutorTxns.length} transações</span>
            </div>
            {tutorTxns.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Nenhuma transação.</p>
            ) : (
              <div className="space-y-2">
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Receita paga",  value: tutorTxns.filter(t => t.type === "receita" && t.status === "pago").reduce((s, t) => s + t.amount, 0), color: "text-forest-700" },
                    { label: "Pendente",      value: tutorTxns.filter(t => t.status === "pendente").reduce((s, t) => s + t.amount, 0), color: "text-amber-700" },
                    { label: "Atrasado",      value: tutorTxns.filter(t => t.status === "atrasado").reduce((s, t) => s + t.amount, 0), color: "text-red-700" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className={cn("text-sm font-bold num-display", color)}>{formatCurrency(value, true)}</p>
                      <p className="text-2xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
                {tutorTxns.slice(0, 10).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-400">{formatDate(tx.dueDate ?? tx.createdAt ?? "")} · {tx.method?.replace("_", " ")}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("text-sm font-semibold num-display", tx.type === "receita" ? "text-forest-700" : "text-red-600")}>
                        {tx.type === "despesa" ? "-" : "+"}{formatCurrency(tx.amount, true)}
                      </span>
                      <span className={cn("badge text-2xs",
                        tx.status === "pago"     ? "bg-forest-100 text-forest-700" :
                        tx.status === "atrasado" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}>{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
