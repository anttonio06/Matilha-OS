"use client";

import React, { useState, useMemo, memo } from "react";
import dynamic from "next/dynamic";
import {
  Dog, Hotel, GraduationCap, TrendingUp,
  AlertTriangle, Zap, RefreshCw, CreditCard,
  Calendar, Clock, ChevronRight, Star, ArrowUpRight,
  Syringe, Cake, BarChart3, Target, ArrowRight,
} from "lucide-react";
import { cn, formatCurrency, percentage } from "@/lib/utils";
import { store } from "@/lib/store";
import { useDB, KEYS, DogDB, TutorDB, AppointmentDB, PlanDB, AlertDB } from "@/lib/db";
import { computeDashboardMetrics, computeRevenueChartData } from "@/lib/mock-data";
import { StatCard, Badge, Card, Progress, AlertStrip } from "@/components/ui";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

// ─── Lazy chart components — Recharts (~200KB) deferred until first visit ─────

function ChartSkeleton({ height = 240 }: { height?: number }) {
  return <div className="w-full animate-pulse bg-gray-100 rounded" style={{ height }} />;
}

const RevenueAreaChart = dynamic(
  () => import("@/components/charts/RevenueAreaChart"),
  { ssr: false, loading: () => <ChartSkeleton height={240} /> }
);

const RevenuePieChart = dynamic(
  () => import("@/components/charts/RevenuePieChart"),
  { ssr: false, loading: () => <ChartSkeleton height={180} /> }
);

// ─── Opportunity Card (memoized — pure display) ───────────────────────────────

const OpportunityCard = memo(function OpportunityCard({ alert }: {
  alert: { id: string; type: "critical"|"warning"|"opportunity"|"info"; title: string; description: string; actionLabel?: string };
}) {
  const typeConfig = {
    critical:    { border: "border-l-red-500",    bg: "bg-red-50",      icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,    badge: <Badge variant="red"   size="sm">Crítico</Badge> },
    warning:     { border: "border-l-amber-500",  bg: "bg-amber-50/50", icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,  badge: <Badge variant="amber" size="sm">Atenção</Badge> },
    opportunity: { border: "border-l-forest-500", bg: "bg-forest-50/60",icon: <Zap           className="w-3.5 h-3.5 text-forest-500" />, badge: <Badge variant="green" size="sm">Oportunidade</Badge> },
    info:        { border: "border-l-blue-400",   bg: "bg-blue-50/50",  icon: <Star          className="w-3.5 h-3.5 text-blue-500" />,   badge: <Badge variant="blue"  size="sm">Info</Badge> },
  };
  const cfg = typeConfig[alert.type];
  return (
    <div className={cn("border-l-2 rounded-r-lg px-4 py-3 transition-colors hover:brightness-98 cursor-pointer", cfg.border, cfg.bg)}>
      <div className="flex items-start gap-2 mb-1">
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
            {cfg.badge}
          </div>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{alert.description}</p>
        </div>
      </div>
      {alert.actionLabel && (
        <button
          onClick={() => {
            const lbl = alert.actionLabel!.toLowerCase();
            if (lbl.includes("renovar"))    store.openModal("novo_plano");
            else if (lbl.includes("notif") || lbl.includes("whatsapp")) store.openModal("enviar_mensagem");
            else if (lbl.includes("agend")) store.openModal("novo_agendamento");
            else store.toast("info", `${alert.actionLabel}...`);
          }}
          className="text-xs font-semibold text-forest-700 hover:text-forest-600 flex items-center gap-1 mt-2"
        >
          {alert.actionLabel} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
});

// ─── Appointment Row (memoized) ───────────────────────────────────────────────

const STATUS_CFG = {
  agendado:    { label: "Agendado",     color: "bg-blue-100 text-blue-700"    },
  confirmado:  { label: "Confirmado",   color: "bg-green-100 text-green-700"  },
  em_andamento:{ label: "Em andamento", color: "bg-forest-100 text-forest-700"},
  concluido:   { label: "Concluído",    color: "bg-gray-100 text-gray-600"    },
  cancelado:   { label: "Cancelado",    color: "bg-red-100 text-red-600"      },
  no_show:     { label: "Não veio",     color: "bg-red-50 text-red-600"       },
  aguardando:  { label: "Aguardando",   color: "bg-amber-100 text-amber-700"  },
} as const;

const AppointmentRow = memo(function AppointmentRow({ apt }: {
  apt: { id: string; dogId: string; tutorId: string; serviceType: string; startTime: string; endTime?: string; status: string };
}) {
  const dog   = DogDB.get(apt.dogId);
  const tutor = TutorDB.get(apt.tutorId);
  const st    = STATUS_CFG[apt.status as keyof typeof STATUS_CFG] ?? { label: apt.status, color: "bg-gray-100 text-gray-600" };
  return (
    <tr className="hover:bg-gray-50 transition-colors cursor-pointer group">
      <td className="px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-forest-700">{dog?.name[0]}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{dog?.name}</p>
            <p className="text-xs text-gray-500">{tutor?.name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-xs text-gray-700 capitalize">{apt.serviceType.replace("_", " ")}</span>
        </div>
      </td>
      <td className="px-4 py-3 border-b border-gray-50 tabular-nums">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3 text-gray-400" />
          {apt.startTime}{apt.endTime ? ` – ${apt.endTime}` : ""}
        </div>
      </td>
      <td className="px-4 py-3 border-b border-gray-50">
        <span className={cn("badge text-2xs", st.color)}>{st.label}</span>
      </td>
      <td className="px-4 py-3 border-b border-gray-50 text-right">
        <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
          <ChevronRight className="w-4 h-4 inline" />
        </span>
      </td>
    </tr>
  );
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [view, setView]   = useState<"geral" | "creche" | "hotel" | "escola">("geral");
  const [ready, setReady] = useState(false);

  // Live DB subscriptions — only re-render when their specific collection changes
  const todayApts = useDB(() => AppointmentDB.today(), KEYS.appointments);
  const alertList = useDB(() => AlertDB.active(),       KEYS.alerts);
  const planList  = useDB(() => PlanDB.list(),          KEYS.plans);
  const dogList   = useDB(() => DogDB.list(),           KEYS.dogs);

  // Mark ready after first paint to show skeleton briefly instead of blank flash
  React.useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Memoize heavy derivations — recompute only when source data changes
  const m = useMemo(() => computeDashboardMetrics(), [todayApts, planList]);

  const revenueData = useMemo(() => computeRevenueChartData(), []);

  const pieData = useMemo(() => [
    { name: "Creche", value: m.revenueMonth * 0.53, color: "#2d7a50" },
    { name: "Hotel",  value: m.revenueMonth * 0.15, color: "#d97706" },
    { name: "Escola", value: m.revenueMonth * 0.32, color: "#7c3aed" },
  ], [m.revenueMonth]);

  const plansNearLimit = useMemo(
    () => planList.filter(p => p.totalUses && p.usedUses != null && (p.totalUses - (p.usedUses ?? 0)) <= 3),
    [planList]
  );

  const vaccineAlerts = useMemo(
    () => dogList.filter(d => d.tags?.includes("vacina_vencendo")),
    [dogList]
  );

  const birthdays = useMemo(
    () => dogList.filter(d => d.tags?.includes("aniversario_semana")),
    [dogList]
  );

  const criticalAlerts = useMemo(
    () => alertList.filter(a => a.type === "critical"),
    [alertList]
  );

  if (!ready) return <DashboardSkeleton />;

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Unidade Principal
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["geral", "creche", "hotel", "escola"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("pill-tab", view === v && "active")}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-2">
          {criticalAlerts.map((a) => (
            <AlertStrip key={a.id} type="error" title={a.title} description={a.description}
              action={a.actionLabel ? { label: a.actionLabel, onClick: () => {} } : undefined} />
          ))}
        </div>
      )}

      {/* KPI Row 1 — Operação hoje */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard label="Cães hoje"        value={m.dogsToday}   sub="na operação agora"
          icon={<Dog className="w-4 h-4" />} color="green" trend={{ value: 12 }} />
        <StatCard label="Creche"           value={`${m.daycareOccupancy}/${m.daycareCapacity}`}
          sub={`${percentage(m.daycareOccupancy, m.daycareCapacity)}% de ocupação`}
          icon={<Dog className="w-4 h-4" />} color="green" />
        <StatCard label="Hotel"            value={`${m.hotelOccupancy}/${m.hotelCapacity}`}
          sub={`${percentage(m.hotelOccupancy, m.hotelCapacity)}% de ocupação`}
          icon={<Hotel className="w-4 h-4" />} color="amber" />
        <StatCard label="Escola hoje"      value={todayApts.filter(a => a.serviceType === "escola").length}
          sub="alunos presentes" icon={<GraduationCap className="w-4 h-4" />} color="blue" />
        <StatCard label="Check-ins pend."  value={m.pendingCheckIns}  sub="chegada prevista"
          icon={<Clock className="w-4 h-4" />} color="amber" />
        <StatCard label="Check-outs pend." value={m.pendingCheckOuts} sub="saída prevista"
          icon={<ArrowUpRight className="w-4 h-4" />} color="gray" />
      </div>

      {/* KPI Row 2 — Financeiro */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard label="Faturamento hoje"  value={formatCurrency(m.revenueToday)}
          icon={<BarChart3 className="w-4 h-4" />} color="green" trend={{ value: 8 }} />
        <Card className="col-span-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Meta do mês</p>
            <Target className="w-4 h-4 text-forest-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 num-display leading-none">{formatCurrency(m.revenueMonth, true)}</p>
          <Progress value={m.revenueMonth} max={m.revenueTarget} color="green" showLabel />
          <p className="text-xs text-gray-500">de {formatCurrency(m.revenueTarget, true)}</p>
        </Card>
        <StatCard label="Assinaturas ativas" value={m.activeSubscriptions}
          icon={<CreditCard className="w-4 h-4" />} color="green" sub="planos recorrentes" />
        <StatCard label="Ticket médio"       value={formatCurrency(m.avgTicket)}
          icon={<TrendingUp className="w-4 h-4" />} color="blue" trend={{ value: 4 }} />
        <StatCard label="Inadimplência"      value={m.overduePayments}
          icon={<AlertTriangle className="w-4 h-4" />} color="red" sub="cobrança pendente" />
        <StatCard label="Renovações"         value={m.renewalsDue}
          icon={<RefreshCw className="w-4 h-4" />} color="amber" sub="planos quase no limite" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2" padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">Receita por operação</h3>
              <p className="text-xs text-gray-500 mt-0.5">Últimos 12 meses</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <RevenueAreaChart data={revenueData} height={240} />
          </div>
        </Card>

        <Card padding="none">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Mix de receita</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="px-5 py-4">
            <RevenuePieChart data={pieData} />
          </div>
        </Card>
      </div>

      {/* Opportunities + Agenda row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-gray-900">Alertas & Oportunidades</h3>
            </div>
            <Badge variant="amber" size="sm">{alertList.length}</Badge>
          </div>
          <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
            {alertList.length === 0
              ? <p className="text-xs text-gray-400 text-center py-6">Nenhum alerta no momento.</p>
              : alertList.map((alert) => <OpportunityCard key={alert.id} alert={alert} />)
            }
          </div>
        </Card>

        <Card className="xl:col-span-2" padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest-600" />
              <h3 className="font-semibold text-gray-900">Agenda de hoje</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="green" size="sm" dot>
                {todayApts.filter(a => a.status === "em_andamento").length} em andamento
              </Badge>
              <a href="/agenda" className="text-xs text-forest-600 font-semibold hover:underline flex items-center gap-0.5">
                Ver agenda <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <div className="overflow-auto">
            {todayApts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Calendar className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-sm font-medium">Nenhum agendamento hoje</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {["Cão / Tutor","Serviço","Horário","Status",""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-gray-50/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todayApts.slice(0, 15).map((apt) => <AppointmentRow key={apt.id} apt={apt} />)}
                </tbody>
                {todayApts.length > 15 && (
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-xs text-center text-forest-600 border-t border-gray-100">
                        <a href="/agenda" className="hover:underline font-medium">
                          +{todayApts.length - 15} agendamentos — ver agenda completa →
                        </a>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Plans near limit */}
        <Card padding="none">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Planos quase no limite</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {plansNearLimit.length === 0
              ? <p className="text-xs text-gray-400 text-center py-6">Nenhum plano crítico.</p>
              : plansNearLimit.map((plan) => {
                const dog       = DogDB.get(plan.dogId);
                const remaining = (plan.totalUses ?? 0) - (plan.usedUses ?? 0);
                return (
                  <div key={plan.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-amber-700">{dog?.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{dog?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{plan.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-amber-600">{remaining} rest.</p>
                      <a href="/planos" className="text-2xs text-forest-600 hover:underline">Renovar →</a>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </Card>

        {/* Vaccine alerts */}
        <Card padding="none">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Syringe className="w-3.5 h-3.5 text-red-500" />
            <h3 className="text-sm font-semibold text-gray-900">Alertas de vacina</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {vaccineAlerts.length === 0
              ? <p className="text-xs text-gray-400 text-center py-6">Vacinas em dia.</p>
              : vaccineAlerts.map((dog) => (
                <div key={dog.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-700">{dog.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{dog.name}</p>
                    <p className="text-xs text-red-600 truncate">Vacina vencida — {dog.vaccines?.[0]?.name}</p>
                  </div>
                  <Badge variant="red" size="sm">Vencida</Badge>
                </div>
              ))
            }
          </div>
        </Card>

        {/* Birthdays */}
        <Card padding="none">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Cake className="w-3.5 h-3.5 text-pink-500" />
            <h3 className="text-sm font-semibold text-gray-900">Aniversários</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {birthdays.length === 0
              ? <p className="text-xs text-gray-400 text-center py-6">Nenhum aniversário esta semana.</p>
              : birthdays.map((dog) => (
                <div key={dog.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-pink-700">{dog.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{dog.name}</p>
                    <p className="text-xs text-gray-500">Esta semana · {dog.breed}</p>
                  </div>
                  <Badge variant="purple" size="sm">🎂</Badge>
                </div>
              ))
            }
            <div className="px-5 py-3">
              <a href="/crm" className="text-xs text-forest-600 hover:underline">Ver todos →</a>
            </div>
          </div>
        </Card>

        {/* Quick stats */}
        <Card padding="none">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Resumo do mês</h3>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Clientes novos", value: m.newClientsMonth,      max: 20, color: "green" as const },
              { label: "Planos ativos",  value: m.activeSubscriptions,  max: 50, color: "blue"  as const },
              { label: "Inadimplência",  value: m.overduePayments,      max: 10, color: "red"   as const },
            ].map(({ label, value, max, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-600">{label}</span>
                  <span className="text-xs font-bold text-gray-900">{value}</span>
                </div>
                <Progress value={value} max={max} size="sm" color={color} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
