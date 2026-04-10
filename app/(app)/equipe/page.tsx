"use client";

import React, { useState } from "react";
import {
  Users, Plus, Star, Phone, Mail, TrendingUp, Clock,
  CheckCircle, Edit2, ToggleLeft, ToggleRight, BarChart3,
  Scissors, GraduationCap, Shield, ShoppingBag, Dog,
} from "lucide-react";
import { cn, formatCurrency, percentage } from "@/lib/utils";
import { TeamDB, useDB, KEYS } from "@/lib/db";
import { store } from "@/lib/store";
import { Badge, Button, Card, Input, StatCard, Tabs } from "@/components/ui";
import type { TeamMember } from "@/types";

const roleLabel: Record<string, string> = {
  admin:      "Admin",
  gestor:     "Gestor",
  recepcao:   "Recepção",
  banhista:   "Banhista",
  monitor:    "Monitor",
  treinador:  "Treinador",
  financeiro: "Financeiro",
  estoque:    "Estoque",
  franqueado: "Franqueado",
};

const roleColor: Record<string, string> = {
  admin:     "bg-purple-100 text-purple-700",
  gestor:    "bg-blue-100 text-blue-700",
  recepcao:  "bg-teal-100 text-teal-700",
  banhista:  "bg-indigo-100 text-indigo-700",
  monitor:   "bg-forest-100 text-forest-700",
  treinador: "bg-rose-100 text-rose-700",
  financeiro:"bg-amber-100 text-amber-700",
  estoque:   "bg-orange-100 text-orange-700",
};

const roleIcon: Record<string, React.ReactNode> = {
  admin:     <Shield className="w-4 h-4" />,
  banhista:  <Scissors className="w-4 h-4" />,
  treinador: <GraduationCap className="w-4 h-4" />,
  monitor:   <Dog className="w-4 h-4" />,
  recepcao:  <Users className="w-4 h-4" />,
  financeiro:<BarChart3 className="w-4 h-4" />,
  estoque:   <ShoppingBag className="w-4 h-4" />,
};

// Mock performance data
const performance: Record<string, { atendimentos: number; receita: number; satisfacao: number; horasTrabalhadas: number }> = {
  tm_1: { atendimentos: 28, receita: 20160, satisfacao: 98, horasTrabalhadas: 176 },
  tm_2: { atendimentos: 34, receita: 12240, satisfacao: 96, horasTrabalhadas: 176 },
  tm_3: { atendimentos: 120, receita: 0, satisfacao: 97, horasTrabalhadas: 176 },
  tm_4: { atendimentos: 210, receita: 0, satisfacao: 99, horasTrabalhadas: 176 },
  tm_5: { atendimentos: 31, receita: 11160, satisfacao: 94, horasTrabalhadas: 160 },
  tm_6: { atendimentos: 0, receita: 0, satisfacao: 100, horasTrabalhadas: 176 },
};

function MemberCard({ member }: { member: TeamMember }) {
  const [active, setActive] = useState(member.active);
  const perf = performance[member.id];
  const initials = member.name.split(" ").slice(0, 2).map(n => n[0]).join("");

  const toggle = () => {
    setActive(p => !p);
    store.toast("success", `${member.name} ${active ? "desativado" : "ativado"} com sucesso.`);
  };

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold",
          active ? "bg-forest-100 text-forest-700" : "bg-gray-100 text-gray-400"
        )}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{member.name}</p>
            {!active && <Badge variant="gray" size="sm">Inativo</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("badge text-2xs flex items-center gap-1", roleColor[member.role] ?? "bg-gray-100 text-gray-600")}>
              {roleIcon[member.role]} {roleLabel[member.role] ?? member.role}
            </span>
          </div>
        </div>
        <button
          onClick={toggle}
          className={cn("transition-colors flex-shrink-0", active ? "text-forest-500 hover:text-forest-700" : "text-gray-300 hover:text-gray-500")}
          title={active ? "Desativar" : "Ativar"}
        >
          {active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>

      {/* Contact */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Phone className="w-3 h-3 flex-shrink-0" /> {member.phone}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Mail className="w-3 h-3 flex-shrink-0" /> {member.email}
        </div>
      </div>

      {/* Specialties */}
      {member.specialties && member.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {member.specialties.map(s => (
            <span key={s} className="text-2xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
              {s.replace("_", " ")}
            </span>
          ))}
        </div>
      )}

      {/* Performance */}
      {perf && (
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-50">
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-gray-900 num-display">{perf.atendimentos}</p>
            <p className="text-2xs text-gray-500">Atendimentos/mês</p>
          </div>
          {perf.receita > 0 ? (
            <div className="bg-forest-50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-forest-700 num-display">{formatCurrency(perf.receita, true)}</p>
              <p className="text-2xs text-forest-600">Receita gerada</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-gray-900 num-display">{perf.satisfacao}%</p>
              <p className="text-2xs text-gray-500">Satisfação</p>
            </div>
          )}
        </div>
      )}

      {/* Commission */}
      {member.commission && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Comissão</span>
          <span className="font-bold text-gray-800">{member.commission}% · {perf?.receita ? formatCurrency(perf.receita * member.commission / 100) : "—"}</span>
        </div>
      )}

      {/* Capacity */}
      {member.dailyCapacity && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Cap. diária: {member.dailyCapacity} atendimentos
        </div>
      )}

      <div className="flex gap-2 border-t border-gray-50 pt-3">
        <Button size="xs" variant="secondary" icon={<Edit2 className="w-3 h-3" />} className="flex-1"
          onClick={() => store.toast("info", `Editando perfil de ${member.name}...`)}>
          Editar
        </Button>
        <Button size="xs" variant="outline" icon={<BarChart3 className="w-3 h-3" />} className="flex-1"
          onClick={() => store.toast("info", `Relatório de ${member.name} disponível em breve.`)}>
          Relatório
        </Button>
      </div>
    </Card>
  );
}

export default function EquipePage() {
  const team = useDB(() => TeamDB.list(), KEYS.team);
  const [tab, setTab] = useState<"membros" | "permissoes" | "comissoes">("membros");
  const [search, setSearch] = useState("");

  const filtered = team.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    roleLabel[m.role]?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCommission = team
    .filter(m => m.commission && performance[m.id]?.receita)
    .reduce((s, m) => s + (performance[m.id]?.receita ?? 0) * (m.commission ?? 0) / 100, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          <p className="text-sm text-gray-500 mt-0.5">{team.filter(m => m.active).length} membros ativos</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />}
          onClick={() => store.toast("info", "Formulário de novo membro em breve.")}>
          Novo membro
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Membros ativos" value={team.filter(m => m.active).length} icon={<Users className="w-4 h-4" />} color="green" />
        <StatCard label="Banhistas" value={team.filter(m => m.role === "banhista").length} icon={<Scissors className="w-4 h-4" />} color="blue" />
        <StatCard label="Treinadores" value={team.filter(m => m.role === "treinador").length} icon={<GraduationCap className="w-4 h-4" />} color="purple" />
        <StatCard label="Comissões/mês" value={formatCurrency(totalCommission, true)} icon={<TrendingUp className="w-4 h-4" />} color="amber" />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs
          tabs={[
            { id: "membros",    label: "Membros",     count: filtered.length },
            { id: "permissoes", label: "Permissões" },
            { id: "comissoes",  label: "Comissões" },
          ]}
          active={tab} onChange={v => setTab(v as typeof tab)}
        />
        <Input
          icon={<Users className="w-3.5 h-3.5" />}
          placeholder="Buscar membro..." value={search}
          onChange={e => setSearch(e.target.value)} className="w-48"
        />
      </div>

      {tab === "membros" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => <MemberCard key={m.id} member={m} />)}
        </div>
      )}

      {tab === "permissoes" && (
        <Card padding="none">
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-widest text-gray-400">Perfil</th>
                  {["Dashboard","Agenda","Check-in","Creche","Escola","Hotel","Banho","CRM","Planos","Financeiro","Loja","Equipe"].map(h => (
                    <th key={h} className="text-center px-2 py-3 text-2xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { role: "Admin",       perms: [1,1,1,1,1,1,1,1,1,1,1,1] },
                  { role: "Gestor",      perms: [1,1,1,1,1,1,1,1,1,1,1,0] },
                  { role: "Recepção",    perms: [1,1,1,1,0,0,1,1,0,0,1,0] },
                  { role: "Banhista",    perms: [0,1,1,0,0,0,1,0,0,0,1,0] },
                  { role: "Monitor",     perms: [0,1,1,1,0,0,0,0,0,0,0,0] },
                  { role: "Treinador",   perms: [0,1,0,0,1,0,0,1,0,0,0,0] },
                  { role: "Financeiro",  perms: [1,0,0,0,0,0,0,1,1,1,0,0] },
                  { role: "Estoque",     perms: [0,0,0,0,0,0,0,0,0,0,1,0] },
                ].map(row => (
                  <tr key={row.role} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-gray-800">{row.role}</td>
                    {row.perms.map((p, i) => (
                      <td key={i} className="text-center px-2 py-3">
                        {p ? <CheckCircle className="w-4 h-4 text-forest-500 mx-auto" /> : <span className="text-gray-200 text-base mx-auto block text-center">–</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "comissoes" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Profissional","Função","Receita gerada","% Comissão","Valor a pagar","Período"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {team.filter(m => m.commission).map(m => {
                  const perf = performance[m.id];
                  const value = (perf?.receita ?? 0) * (m.commission ?? 0) / 100;
                  return (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("badge text-2xs", roleColor[m.role])}>{roleLabel[m.role]}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 num-display">
                        {formatCurrency(perf?.receita ?? 0)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">{m.commission}%</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-forest-700 num-display">
                        {formatCurrency(value)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">Abril 2026</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={4} className="px-5 py-3 text-sm font-bold text-gray-900">Total a pagar</td>
                  <td className="px-5 py-3 text-sm font-bold text-forest-700 num-display">{formatCurrency(totalCommission)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <Button variant="outline" icon={<CheckCircle className="w-4 h-4" />}
            onClick={() => store.toast("success", "Comissões marcadas como pagas para abril 2026.")}>
            Marcar todas como pagas
          </Button>
        </div>
      )}
    </div>
  );
}
