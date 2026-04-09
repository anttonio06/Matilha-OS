"use client";

import React, { useState, useMemo, memo, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Hotel, TrendingUp, AlertTriangle,
  RefreshCw, CreditCard, Calendar, Clock, ChevronRight,
  Syringe, Target,
  LogIn, LogOut, CheckCircle, TrendingDown,
  Flame, Activity, DollarSign, UserX, Repeat,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { store } from "@/lib/store";
import {
  useDB, KEYS,
  DogDB, TutorDB, AppointmentDB, PlanDB, TransactionDB, HotelDB,
} from "@/lib/db";
import { StatCard, Badge, Card, Progress } from "@/components/ui";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import type { Appointment } from "@/types";

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

function weekEnd() {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

// ─── Action Item (priority panel) ────────────────────────────────────────────

interface ActionItem {
  id: string;
  level: "critical" | "warning" | "info" | "opportunity";
  icon: React.ReactNode;
  title: string;
  sub: string;
  action: string;
  href?: string;
  onClick?: () => void;
}

const LEVEL_CFG = {
  critical:    { bar:"bg-red-500",    bg:"bg-red-50",      ring:"border-red-200",   text:"text-red-700",   badge:"bg-red-100 text-red-700"    },
  warning:     { bar:"bg-amber-400",  bg:"bg-amber-50",    ring:"border-amber-200", text:"text-amber-700", badge:"bg-amber-100 text-amber-700" },
  opportunity: { bar:"bg-forest-500", bg:"bg-forest-50",   ring:"border-forest-200",text:"text-forest-700",badge:"bg-forest-100 text-forest-700"},
  info:        { bar:"bg-blue-400",   bg:"bg-blue-50/60",  ring:"border-blue-200",  text:"text-blue-700",  badge:"bg-blue-100 text-blue-700"   },
};

const ActionCard = memo(function ActionCard({ item }: { item: ActionItem }) {
  const cfg = LEVEL_CFG[item.level];
  const router = useRouter();
  return (
    <div className={cn("relative flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm cursor-pointer group", cfg.bg, cfg.ring)}
      onClick={() => { item.onClick?.(); if (item.href) router.push(item.href); }}>
      <div className={cn("w-1 absolute left-0 top-2 bottom-2 rounded-full", cfg.bar)}/>
      <div className="ml-2 flex-shrink-0 mt-0.5">{item.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold leading-tight", cfg.text)}>{item.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.sub}</p>
      </div>
      <span className={cn("text-2xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 group-hover:opacity-80", cfg.badge)}>
        {item.action}
      </span>
    </div>
  );
});

// ─── Today Appointment Row ────────────────────────────────────────────────────

const STATUS_CFG = {
  agendado:    { label:"Agendado",     color:"bg-blue-100 text-blue-700"    },
  confirmado:  { label:"Confirmado",   color:"bg-green-100 text-green-700"  },
  em_andamento:{ label:"Em andamento", color:"bg-forest-100 text-forest-700"},
  concluido:   { label:"Concluído",    color:"bg-gray-100 text-gray-600"    },
  cancelado:   { label:"Cancelado",    color:"bg-red-100 text-red-600"      },
  no_show:     { label:"Não veio",     color:"bg-red-50 text-red-600"       },
  aguardando:  { label:"Aguardando",   color:"bg-amber-100 text-amber-700"  },
} as const;

const SVC_COLORS: Record<string, string> = {
  creche:"text-forest-600", hotel:"text-amber-600", escola:"text-purple-600",
  banho:"text-blue-600", banho_tosa:"text-indigo-600", avaliacao:"text-rose-600",
};

const AptRow = memo(function AptRow({ apt }: { apt: Appointment }) {
  const dog   = DogDB.get(apt.dogId);
  const tutor = TutorDB.get(apt.tutorId);
  const st    = STATUS_CFG[apt.status as keyof typeof STATUS_CFG] ?? { label: apt.status, color:"bg-gray-100 text-gray-600" };
  const router = useRouter();
  return (
    <tr className="hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={() => router.push(`/checkin`)}>
      <td className="px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-forest-700">{dog?.name[0]}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{dog?.name}</p>
            <button className="text-xs text-gray-500 hover:text-forest-600 hover:underline text-left"
              onClick={e => { e.stopPropagation(); router.push(`/crm`); }}>
              {tutor?.name}
            </button>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 border-b border-gray-50">
        <span className={cn("text-xs font-medium capitalize", SVC_COLORS[apt.serviceType] ?? "text-gray-600")}>
          {apt.serviceType.replace("_"," ")}
        </span>
      </td>
      <td className="px-4 py-3 border-b border-gray-50 tabular-nums">
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400"/>{apt.startTime}
        </span>
      </td>
      <td className="px-4 py-3 border-b border-gray-50">
        <span className={cn("badge text-2xs", st.color)}>{st.label}</span>
      </td>
      <td className="px-4 py-3 border-b border-gray-50 text-right">
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors inline"/>
      </td>
    </tr>
  );
});

// ─── Hotel Guest Row ──────────────────────────────────────────────────────────

function HotelGuestRow({ res }: { res: ReturnType<typeof HotelDB.list>[0] }) {
  const dog   = DogDB.get(res.dogId);
  const tutor = TutorDB.get(res.tutorId);
  const router = useRouter();
  const today = todayStr();
  const isCheckoutToday = res.checkOut === today;
  const isCheckinToday  = res.checkIn  === today;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
      onClick={() => router.push("/hotel")}>
      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-amber-700">{dog?.name[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{dog?.name}</p>
        <p className="text-xs text-gray-500 truncate">{tutor?.name} · saída {res.checkOut}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {(res.medications || res.allergyAlert) && (
          <span title="Alertas médicos">
            <Syringe className="w-3.5 h-3.5 text-red-500"/>
          </span>
        )}
        {isCheckoutToday && <Badge variant="amber" size="sm">Check-out hoje</Badge>}
        {isCheckinToday  && <Badge variant="green" size="sm">Check-in hoje</Badge>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Live subscriptions
  const todayApts   = useDB(() => AppointmentDB.today(), KEYS.appointments);
  const allApts     = useDB(() => AppointmentDB.list(),  KEYS.appointments);
  const allPlans    = useDB(() => PlanDB.list(),         KEYS.plans);
  const allTutors   = useDB(() => TutorDB.list(),        KEYS.tutors);

  const hotelRes    = useDB(() => HotelDB.list(),        KEYS.hotel);
  const allTxns     = useDB(() => TransactionDB.list(),  KEYS.transactions);

  const today   = todayStr();
  const weekEnd_ = weekEnd();

  // ── Derived operational intelligence ──────────────────────────────────────

  const ops = useMemo(() => {
    // Revenue
    const monthStart = today.slice(0, 7);
    const revenueMonth = allTxns
      .filter(t => t.type === "receita" && t.paidAt?.startsWith(monthStart))
      .reduce((s, t) => s + t.amount, 0);
    const revenueToday = allTxns
      .filter(t => t.type === "receita" && t.paidAt === today)
      .reduce((s, t) => s + t.amount, 0);

    // Week forecast: sum of plan prices for appointments this week
    const weekApts = allApts.filter(a => a.date >= today && a.date <= weekEnd_ && a.status !== "cancelado");
    const weekForecast = weekApts.reduce((s, a) => s + (a.price ?? 0), 0);

    // Check-ins / check-outs
    const pendingCheckIns  = todayApts.filter(a => a.status === "agendado" || a.status === "confirmado");
    const active           = todayApts.filter(a => a.status === "em_andamento");
    const completedToday   = todayApts.filter(a => a.status === "concluido");

    // Hotel
    const hotelActive      = hotelRes.filter(r => r.status === "hospedado");
    const hotelCheckoutToday = hotelRes.filter(r => r.checkOut === today && r.status === "hospedado");
    const hotelCheckinToday  = hotelRes.filter(r => r.checkIn  === today && r.status === "reservado");
    const hotelAlerts        = hotelActive.filter(r => r.medications || r.allergyAlert);

    // Plans
    const activePlans      = allPlans.filter(p => p.status === "ativo");
    const expiringWeek     = allPlans.filter(p => {
      if (p.status !== "ativo") return false;
      if (p.validUntil && p.validUntil >= today && p.validUntil <= weekEnd_) return true;
      if (p.totalUses && p.usedUses != null && (p.totalUses - p.usedUses) <= 2) return true;
      return false;
    });
    const overduePlans     = allPlans.filter(p => p.status === "ativo" && p.validUntil && p.validUntil < today);

    // Churn risk: tutors with active plan but no appointments in 30+ days
    const cutoff30 = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const recentActive = new Set(allApts.filter(a => a.date >= cutoff30).map(a => a.tutorId));
    const churnRisk    = allTutors.filter(t =>
      t.status === "ativo" && !recentActive.has(t.id) && allPlans.some(p => p.tutorId === t.id && p.status === "ativo")
    );

    // Overdue payments
    const overduePayments = allTxns.filter(t => t.status === "atrasado");

    // Occupation
    const creche    = todayApts.filter(a => a.serviceType === "creche" && a.status === "em_andamento").length;
    const escola    = todayApts.filter(a => a.serviceType === "escola").length;
    const MRR       = activePlans.reduce((s, p) => s + (p.recurrent ? (p.price ?? 0) : 0), 0);
    const avgTicket = allTxns.filter(t => t.type === "receita").length > 0
      ? allTxns.filter(t => t.type === "receita").reduce((s, t) => s + t.amount, 0) / allTxns.filter(t => t.type === "receita").length
      : 0;

    return {
      revenueMonth, revenueToday, weekForecast,
      pendingCheckIns, active, completedToday,
      hotelActive, hotelCheckoutToday, hotelCheckinToday, hotelAlerts,
      activePlans, expiringWeek, overduePlans,
      churnRisk, overduePayments,
      creche, escola, MRR, avgTicket,
    };
  }, [todayApts, allApts, allPlans, allTutors, allTxns, hotelRes, today, weekEnd_]);

  // ── Agenda + revenue data ──────────────────────────────────────────────────

  const revenueData = useMemo(() => {
    const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const byMonth: Record<number, { creche: number; hotel: number; escola: number }> = {};
    for (let i = 0; i < 12; i++) byMonth[i] = { creche: 0, hotel: 0, escola: 0 };
    allTxns.forEach(t => {
      if (t.type !== "receita" || !t.paidAt) return;
      const m = parseInt(t.paidAt.slice(5, 7), 10) - 1;
      const cat = t.category ?? "creche";
      if (cat in byMonth[m]) (byMonth[m] as Record<string, number>)[cat] += t.amount;
      else byMonth[m].creche += t.amount;
    });
    return months.map((name, i) => ({
      month: name,
      creche:  byMonth[i].creche,
      hotel:   byMonth[i].hotel,
      escola:  byMonth[i].escola,
      receita: byMonth[i].creche + byMonth[i].hotel + byMonth[i].escola,
      despesa: 0,
    }));
  }, [allTxns]);

  const pieData = useMemo(() => {
    const sums: Record<string, number> = { Creche: 0, Hotel: 0, Escola: 0, Outros: 0 };
    allTxns.filter(t => t.type === "receita").forEach(t => {
      const cat = t.category ?? "outros";
      if (cat === "creche") sums.Creche += t.amount;
      else if (cat === "hotel") sums.Hotel += t.amount;
      else if (cat === "escola") sums.Escola += t.amount;
      else sums.Outros += t.amount;
    });
    return [
      { name: "Creche", value: sums.Creche || ops.revenueMonth * 0.53, color: "#2d7a50" },
      { name: "Hotel",  value: sums.Hotel  || ops.revenueMonth * 0.15, color: "#d97706" },
      { name: "Escola", value: sums.Escola || ops.revenueMonth * 0.32, color: "#7c3aed" },
    ];
  }, [allTxns, ops.revenueMonth]);

  // ── Build action items (intelligence panel) ────────────────────────────────

  const actionItems = useMemo((): ActionItem[] => {
    const items: ActionItem[] = [];

    ops.pendingCheckIns.slice(0, 3).forEach(apt => {
      const dog = DogDB.get(apt.dogId);
      items.push({
        id: `ci-${apt.id}`, level: "warning",
        icon: <LogIn className="w-4 h-4 text-amber-600"/>,
        title: `Check-in pendente — ${dog?.name ?? "Cão"}`,
        sub: `${apt.serviceType.replace("_", " ")} · ${apt.startTime}`,
        action: "Fazer check-in", href: "/checkin",
      });
    });

    ops.hotelCheckoutToday.forEach(r => {
      const dog = DogDB.get(r.dogId);
      items.push({
        id: `hco-${r.id}`, level: "critical",
        icon: <LogOut className="w-4 h-4 text-red-500"/>,
        title: `Check-out hotel hoje — ${dog?.name ?? "Cão"}`,
        sub: r.belongingsList?.length ? `${r.belongingsList.length} pertences para devolver` : "Saída agendada hoje",
        action: "Ver hotel", href: "/hotel",
      });
    });

    ops.hotelAlerts.forEach(r => {
      const dog = DogDB.get(r.dogId);
      items.push({
        id: `ha-${r.id}`, level: "critical",
        icon: <Syringe className="w-4 h-4 text-red-600"/>,
        title: `Alerta médico — ${dog?.name ?? "Cão"} (hotel)`,
        sub: r.medications ?? r.allergyAlert ?? "Verificar alertas",
        action: "Ver hotel", href: "/hotel",
      });
    });

    ops.expiringWeek.slice(0, 3).forEach(p => {
      const dog   = DogDB.get(p.dogId);
      const left  = p.totalUses ? (p.totalUses - (p.usedUses ?? 0)) : null;
      items.push({
        id: `exp-${p.id}`, level: "opportunity",
        icon: <RefreshCw className="w-4 h-4 text-forest-600"/>,
        title: `Plano vencendo — ${dog?.name ?? ""} · ${p.name}`,
        sub: left !== null ? `${left} uso(s) restantes` : `Vence em ${p.validUntil}`,
        action: "Renovar",
        onClick: () => store.openModal("renovar_plano", { planId: p.id }),
      });
    });

    ops.churnRisk.slice(0, 3).forEach(t => {
      const lastApt = allApts.filter(a => a.tutorId === t.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      const days = lastApt ? daysBetween(lastApt.date, today) : 99;
      items.push({
        id: `churn-${t.id}`, level: "warning",
        icon: <UserX className="w-4 h-4 text-amber-600"/>,
        title: `Risco de churn — ${t.name}`,
        sub: `Sem visita há ${days} dias · plano ativo`,
        action: "Contatar", onClick: () => store.openModal("enviar_mensagem", { tutorId: t.id }),
      });
    });

    ops.overduePayments.slice(0, 2).forEach(txn => {
      const tutor = allTutors.find(t => t.id === txn.tutorId);
      items.push({
        id: `ov-${txn.id}`, level: "critical",
        icon: <AlertTriangle className="w-4 h-4 text-red-500"/>,
        title: `Inadimplência — ${tutor?.name ?? "Cliente"}`,
        sub: `${formatCurrency(txn.amount)} em aberto · vencimento ${txn.dueDate}`,
        action: "Ver financeiro", href: "/financeiro",
      });
    });

    ops.hotelCheckinToday.forEach(r => {
      const dog = DogDB.get(r.dogId);
      items.push({
        id: `hci-${r.id}`, level: "info",
        icon: <Hotel className="w-4 h-4 text-blue-500"/>,
        title: `Check-in hotel esperado — ${dog?.name ?? "Cão"}`,
        sub: `Entrada hoje · ${r.checkOut ? `saída ${r.checkOut}` : ""}`,
        action: "Ver hotel", href: "/hotel",
      });
    });

    // Sort: critical first, then warning, then opportunity, then info
    const order: Record<string, number> = { critical: 0, warning: 1, opportunity: 2, info: 3 };
    return items.sort((a, b) => (order[a.level] ?? 3) - (order[b.level] ?? 3));
  }, [ops, allApts, allTutors, today]);

  if (!ready) return <DashboardSkeleton />;

  const revenueTarget = 35000;

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Centro de Operações</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · "}<span className="text-forest-600 font-medium">{ops.active.length} presentes agora</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => store.openModal("novo_agendamento")}
            className="px-3 py-1.5 text-xs font-semibold bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5"/> Novo agendamento
          </button>
          <button onClick={() => store.openModal("nova_reserva")}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <Hotel className="w-3.5 h-3.5"/> Nova reserva
          </button>
        </div>
      </div>

      {/* ── KPI Row — Operação agora ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Check-ins pendentes"
          value={ops.pendingCheckIns.length}
          sub="aguardando chegada"
          icon={<LogIn className="w-4 h-4"/>} color={ops.pendingCheckIns.length > 0 ? "amber" : "gray"}
          onClick={() => router.push("/checkin")}/>
        <StatCard label="Presentes agora"
          value={ops.active.length}
          sub="em atendimento"
          icon={<Activity className="w-4 h-4"/>} color="green"/>
        <StatCard label="Saídas hoje"
          value={ops.hotelCheckoutToday.length + ops.completedToday.length}
          sub="check-outs previstos"
          icon={<LogOut className="w-4 h-4"/>} color="gray"/>
        <StatCard label="Hotel — hóspedes"
          value={ops.hotelActive.length}
          sub={ops.hotelAlerts.length > 0 ? `⚠ ${ops.hotelAlerts.length} com alertas` : "sem alertas"}
          icon={<Hotel className="w-4 h-4"/>} color={ops.hotelAlerts.length > 0 ? "red" : "amber"}
          onClick={() => router.push("/hotel")}/>
        <StatCard label="Planos vencendo"
          value={ops.expiringWeek.length}
          sub="esta semana"
          icon={<RefreshCw className="w-4 h-4"/>} color={ops.expiringWeek.length > 0 ? "amber" : "gray"}
          onClick={() => router.push("/planos")}/>
        <StatCard label="Risco de churn"
          value={ops.churnRisk.length}
          sub="sem visita 30+ dias"
          icon={<TrendingDown className="w-4 h-4"/>} color={ops.churnRisk.length > 0 ? "red" : "gray"}
          onClick={() => router.push("/crm")}/>
      </div>

      {/* ── KPI Row — Financeiro ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Receita hoje"
          value={formatCurrency(ops.revenueToday)}
          icon={<DollarSign className="w-4 h-4"/>} color="green"/>
        <Card className="col-span-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Meta do mês</p>
            <Target className="w-4 h-4 text-forest-500"/>
          </div>
          <p className="text-2xl font-bold text-gray-900 num-display leading-none">{formatCurrency(ops.revenueMonth, true)}</p>
          <Progress value={ops.revenueMonth} max={revenueTarget} color="green" showLabel/>
          <p className="text-xs text-gray-500">de {formatCurrency(revenueTarget, true)}</p>
        </Card>
        <StatCard label="Previsão semana"
          value={formatCurrency(ops.weekForecast, true)}
          sub="agendamentos pendentes"
          icon={<TrendingUp className="w-4 h-4"/>} color="blue"/>
        <StatCard label="MRR"
          value={formatCurrency(ops.MRR, true)}
          sub="planos recorrentes"
          icon={<Repeat className="w-4 h-4"/>} color="blue"/>
        <StatCard label="Inadimplência"
          value={ops.overduePayments.length}
          sub={`${formatCurrency(ops.overduePayments.reduce((s, t) => s + t.amount, 0), true)} em aberto`}
          icon={<AlertTriangle className="w-4 h-4"/>} color={ops.overduePayments.length > 0 ? "red" : "gray"}
          onClick={() => router.push("/financeiro")}/>
        <StatCard label="Planos ativos"
          value={ops.activePlans.length}
          sub="assinaturas vigentes"
          icon={<CreditCard className="w-4 h-4"/>} color="green"
          onClick={() => router.push("/planos")}/>
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Painel de ação — intelligence */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500"/>
              <h3 className="font-semibold text-gray-900">O que fazer agora</h3>
            </div>
            {actionItems.length > 0 && (
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {actionItems.filter(i => i.level === "critical").length} crítico(s)
              </span>
            )}
          </div>
          <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
            {actionItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <CheckCircle className="w-8 h-8 opacity-30"/>
                <p className="text-sm font-medium">Tudo em ordem por agora.</p>
              </div>
            ) : actionItems.map(item => <ActionCard key={item.id} item={item}/>)}
          </div>
        </Card>

        {/* Agenda de hoje */}
        <Card className="xl:col-span-2" padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest-600"/>
              <h3 className="font-semibold text-gray-900">Agenda de hoje</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-forest-400 inline-block"/>
                {ops.active.length} em andamento
              </div>
              <a href="/agenda" className="text-xs text-forest-600 font-semibold hover:underline flex items-center gap-0.5">
                Ver tudo <ChevronRight className="w-3.5 h-3.5"/>
              </a>
            </div>
          </div>
          {todayApts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <Calendar className="w-8 h-8 opacity-20 mb-2"/>
              <p className="text-sm font-medium">Nenhum agendamento hoje</p>
              <button onClick={() => store.openModal("novo_agendamento")}
                className="mt-3 text-xs text-forest-600 font-semibold hover:underline flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5"/> Criar agendamento
              </button>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {["Cão / Tutor","Serviço","Horário","Status",""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-gray-50/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todayApts.slice(0, 12).map(apt => <AptRow key={apt.id} apt={apt}/>)}
                </tbody>
                {todayApts.length > 12 && (
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-xs text-center border-t border-gray-100">
                        <a href="/agenda" className="text-forest-600 hover:underline font-medium">
                          +{todayApts.length - 12} agendamentos — agenda completa →
                        </a>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2" padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">Receita por operação</h3>
              <p className="text-xs text-gray-500 mt-0.5">Últimos 12 meses</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <RevenueAreaChart data={revenueData} height={220}/>
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
            <RevenuePieChart data={pieData}/>
          </div>
        </Card>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Hotel: hóspedes atuais */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Hotel className="w-3.5 h-3.5 text-amber-500"/>
              <h3 className="text-sm font-semibold text-gray-900">Hotel — hóspedes</h3>
            </div>
            <a href="/hotel" className="text-xs text-forest-600 hover:underline">Ver tudo →</a>
          </div>
          {ops.hotelActive.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Nenhum hóspede no momento</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {ops.hotelActive.slice(0, 8).map(r => <HotelGuestRow key={r.id} res={r}/>)}
            </div>
          )}
        </Card>

        {/* Planos vencendo */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-amber-500"/>
              <h3 className="text-sm font-semibold text-gray-900">Planos vencendo esta semana</h3>
            </div>
            <a href="/planos" className="text-xs text-forest-600 hover:underline">Ver todos →</a>
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {ops.expiringWeek.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Nenhum plano crítico esta semana</p>
            ) : ops.expiringWeek.map(plan => {
              const dog = DogDB.get(plan.dogId);
              const tutor = TutorDB.get(plan.tutorId);
              const rem = plan.totalUses ? (plan.totalUses - (plan.usedUses ?? 0)) : null;
              return (
                <div key={plan.id} className="px-5 py-3 flex items-center gap-3 hover:bg-amber-50/50 cursor-pointer"
                  onClick={() => store.openModal("renovar_plano", { planId: plan.id })}>
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-700">{dog?.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{dog?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{tutor?.name} · {plan.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {rem !== null
                      ? <p className="text-xs font-bold text-amber-600">{rem} rest.</p>
                      : <p className="text-xs font-bold text-red-600">Vence {plan.validUntil}</p>
                    }
                    <p className="text-2xs text-forest-600 font-semibold">Renovar →</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Clientes em risco */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <UserX className="w-3.5 h-3.5 text-red-500"/>
              <h3 className="text-sm font-semibold text-gray-900">Clientes em risco</h3>
            </div>
            <a href="/crm" className="text-xs text-forest-600 hover:underline">Ver CRM →</a>
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {ops.churnRisk.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                <CheckCircle className="w-6 h-6 opacity-30"/>
                <p className="text-xs font-medium">Nenhum cliente em risco</p>
              </div>
            ) : ops.churnRisk.slice(0, 6).map(tutor => {
              const lastApt = allApts.filter(a => a.tutorId === tutor.id).sort((a, b) => b.date.localeCompare(a.date))[0];
              const days = lastApt ? daysBetween(lastApt.date, today) : 99;
              const plan = allPlans.find(p => p.tutorId === tutor.id && p.status === "ativo");
              return (
                <div key={tutor.id} className="px-5 py-3 flex items-center gap-3 hover:bg-red-50/30 cursor-pointer"
                  onClick={() => store.openModal("enviar_mensagem", { tutorId: tutor.id })}>
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-700">{tutor.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tutor.name}</p>
                    <p className="text-xs text-gray-500">{plan?.name ?? "Plano ativo"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-red-600">{days}d s/ visita</p>
                    <p className="text-2xs text-forest-600 font-semibold">Contatar →</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
