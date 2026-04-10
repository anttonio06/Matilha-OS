"use client";

import React, { useState } from "react";
import {
  BarChart3, Download, TrendingUp, TrendingDown, Users, Dog,
  CreditCard, ShoppingBag, RefreshCw, Hotel, GraduationCap,
  FileText,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { cn, formatCurrency, percentage } from "@/lib/utils";
import { store } from "@/lib/store";
import { TutorDB, useDB, KEYS } from "@/lib/db";
import { computeRevenueChartData } from "@/lib/services/metrics.service";
import { Badge, Button, Card, StatCard, Tabs } from "@/components/ui";

const retencaoData = [
  { month: "Nov", retencao: 81 }, { month: "Dez", retencao: 83 },
  { month: "Jan", retencao: 85 }, { month: "Fev", retencao: 87 },
  { month: "Mar", retencao: 84 }, { month: "Abr", retencao: 89 },
];
const ticketData = [
  { month: "Nov", ticket: 241 }, { month: "Dez", ticket: 258 },
  { month: "Jan", ticket: 263 }, { month: "Fev", ticket: 271 },
  { month: "Mar", ticket: 279 }, { month: "Abr", ticket: 287 },
];
const churnData = [
  { month: "Nov", churn: 4 }, { month: "Dez", churn: 3 },
  { month: "Jan", churn: 5 }, { month: "Fev", churn: 2 },
  { month: "Mar", churn: 4 }, { month: "Abr", churn: 2 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-card-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">
            {p.value > 100 ? formatCurrency(p.value, true) : `${p.value}${["retencao","churn"].includes(p.dataKey) ? "%" : ""}`}
          </span>
        </div>
      ))}
    </div>
  );
}

const reportList = [
  { id: "receita",    label: "Receita por Serviço",      icon: <BarChart3 className="w-4 h-4" />,      period: "Abril 2026" },
  { id: "ocupacao",   label: "Ocupação da Creche",        icon: <Dog className="w-4 h-4" />,            period: "Abril 2026" },
  { id: "retencao",   label: "Retenção de Clientes",      icon: <Users className="w-4 h-4" />,          period: "Último trim." },
  { id: "comissoes",  label: "Comissões da Equipe",       icon: <CreditCard className="w-4 h-4" />,     period: "Abril 2026" },
  { id: "loja",       label: "Vendas da Loja",            icon: <ShoppingBag className="w-4 h-4" />,    period: "Abril 2026" },
  { id: "planos",     label: "Planos & Renovações",       icon: <RefreshCw className="w-4 h-4" />,      period: "Atual" },
  { id: "hotel",      label: "Taxa de Ocupação Hotel",    icon: <Hotel className="w-4 h-4" />,           period: "Abril 2026" },
  { id: "comportamental", label: "Progresso Comportamental", icon: <GraduationCap className="w-4 h-4" />, period: "Trimestre" },
];

export default function RelatoriosPage() {
  const tutors           = useDB(() => TutorDB.list(), KEYS.tutors);
  const revenueChartData = computeRevenueChartData();
  const [tab, setTab] = useState<"visao_geral" | "relatorios" | "exportar">("visao_geral");

  const last = revenueChartData[revenueChartData.length - 1];
  const prev = revenueChartData[revenueChartData.length - 2];
  const totalMes  = last?.receita ?? 0;
  const prevTotal = prev?.receita ?? 0;
  const growthPct = percentage(totalMes - prevTotal, prevTotal);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios & Inteligência</h1>
          <p className="text-sm text-gray-500 mt-0.5">Análise operacional e de negócio</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none">
            <option>Abril 2026</option>
            <option>Março 2026</option>
            <option>Q1 2026</option>
          </select>
          <Button variant="outline" icon={<Download className="w-4 h-4" />} size="sm"
            onClick={() => store.toast("success", "Relatório exportado em PDF!")}>
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Receita total"  value={formatCurrency(totalMes, true)} icon={<TrendingUp className="w-4 h-4" />} color="green" trend={{ value: growthPct }} />
        <StatCard label="Ticket médio"   value={formatCurrency(287)} icon={<BarChart3 className="w-4 h-4" />} color="blue" trend={{ value: 3 }} />
        <StatCard label="Retenção"       value="89%" icon={<RefreshCw className="w-4 h-4" />} color="purple" trend={{ value: 5 }} />
        <StatCard label="Novos clientes" value="3" icon={<Users className="w-4 h-4" />} color="amber" sub="este mês" />
      </div>

      <Tabs
        tabs={[
          { id: "visao_geral", label: "Visão Geral" },
          { id: "relatorios",  label: "Relatórios", count: reportList.length },
          { id: "exportar",    label: "Exportar" },
        ]}
        active={tab} onChange={v => setTab(v as typeof tab)}
      />

      {tab === "visao_geral" && (
        <div className="space-y-6">
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Evolução de receita</h3>
              <Badge variant="green" size="sm" dot>+{growthPct}% vs mês anterior</Badge>
            </div>
            <div className="px-5 py-4">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueChartData.map(d => ({ ...d, total: d.receita }))}>
                  <defs>
                    <linearGradient id="gradRel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d7a50" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2d7a50" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                    tickFormatter={v => formatCurrency(v, true)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Total" stroke="#2d7a50" strokeWidth={2}
                    fill="url(#gradRel)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card padding="none">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Taxa de retenção</h3>
              </div>
              <div className="px-5 py-4">
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={retencaoData}>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[75, 95]} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="retencao" name="Retenção" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3, fill: "#7c3aed" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card padding="none">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Ticket médio</h3>
              </div>
              <div className="px-5 py-4">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={ticketData} barSize={24}>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="ticket" name="Ticket" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card padding="none">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Churn mensal</h3>
              </div>
              <div className="px-5 py-4">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={churnData} barSize={24}>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="churn" name="Churn" fill="#dc2626" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card padding="none">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Clientes mais valiosos (LTV)</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {[...tutors].sort((a, b) => b.ltv - a.ltv).slice(0, 5).map((tutor, i) => (
                <div key={tutor.id} className="flex items-center gap-4 px-5 py-3">
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    i === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{tutor.name}</p>
                    <p className="text-xs text-gray-500">{tutor.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 num-display">{formatCurrency(tutor.ltv, true)}</p>
                    <p className="text-2xs text-gray-400">LTV estimado</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "relatorios" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {reportList.map(r => (
            <Card key={r.id} hover className="flex flex-col gap-4 cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-forest-50 flex items-center justify-center text-forest-600 group-hover:bg-forest-100 transition-colors">
                  {r.icon}
                </div>
                <Badge variant="green" size="sm">Pronto</Badge>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{r.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.period}</p>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button size="xs" variant="secondary" icon={<FileText className="w-3 h-3" />} className="flex-1"
                  onClick={() => store.toast("info", `Abrindo ${r.label}...`)}>Ver</Button>
                <Button size="xs" variant="outline" icon={<Download className="w-3 h-3" />}
                  onClick={() => store.toast("success", `${r.label} exportado!`)}>PDF</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "exportar" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <h3 className="font-semibold text-gray-900">Exportar relatório completo</h3>
            <div className="space-y-3">
              {["PDF executivo", "Excel detalhado", "CSV — Clientes", "CSV — Financeiro"].map(opt => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-forest-600 rounded" />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
            <Button className="w-full" icon={<Download className="w-4 h-4" />}
              onClick={() => store.toast("success", "Exportação iniciada!")}>
              Gerar e exportar
            </Button>
          </Card>
          <Card className="space-y-4">
            <h3 className="font-semibold text-gray-900">Exportações rápidas</h3>
            <div className="space-y-2">
              {[
                { label: "Clientes ativos", icon: <Users className="w-4 h-4" /> },
                { label: "Vacinas vencendo", icon: <Dog className="w-4 h-4" /> },
                { label: "Planos a renovar", icon: <CreditCard className="w-4 h-4" /> },
                { label: "Inadimplências", icon: <TrendingDown className="w-4 h-4" /> },
              ].map(({ label, icon }) => (
                <button key={label}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left group"
                  onClick={() => store.toast("success", `${label} exportado!`)}
                >
                  <span className="text-forest-500">{icon}</span>
                  <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
                  <Download className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
