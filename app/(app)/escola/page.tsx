"use client";

import React, { useState } from "react";
import {
  GraduationCap, Brain, Calendar, Target,
  ChevronRight, Plus, Star, Zap, ArrowRight
} from "lucide-react";
import { store } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";
import { dogs, team, dogById, tutorById } from "@/lib/mock-data";
import type { BehaviorProfile } from "@/types";
const behaviorProfiles: BehaviorProfile[] = [];
import { Button, Card, Progress, StatCard, Tabs } from "@/components/ui";

const trainers = team.filter(t => t.role === "treinador");

const adaptationPhaseConfig = {
  inicial:   { label: "Inicial",   color: "bg-gray-100 text-gray-600",    pct: 20 },
  progresso: { label: "Progresso", color: "bg-blue-100 text-blue-700",    pct: 55 },
  avancado:  { label: "Avançado",  color: "bg-forest-100 text-forest-700",pct: 80 },
  completo:  { label: "Completo",  color: "bg-green-100 text-green-700",  pct: 100 },
};

function BehaviorCard({ profile }: { profile: typeof behaviorProfiles[0] }) {
  const dog   = dogById(profile.dogId);
  const tutor = dog ? tutorById(dogs.find(d => d.id === dog.id)?.tutorId ?? "") : null;
  const phase = profile.adaptationPhase ? adaptationPhaseConfig[profile.adaptationPhase] : null;
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-rose-700">{dog?.name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{dog?.name}</p>
            {phase && <span className={cn("badge text-2xs", phase.color)}>{phase.label}</span>}
          </div>
          <p className="text-xs text-gray-500">{dog?.breed} · {tutor?.name}</p>
          <p className="text-2xs text-gray-400 mt-0.5">Atualizado em {formatDate(profile.updatedAt)}</p>
        </div>
      </div>

      {/* Phase progress */}
      {phase && (
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Fase de adaptação</span>
            <span className="font-semibold text-gray-700">{phase.label}</span>
          </div>
          <Progress value={phase.pct} max={100} size="md" color={phase.pct === 100 ? "green" : "blue"} showLabel />
        </div>
      )}

      {/* Quick profile */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-2xs text-gray-400 mb-1">Energia</p>
          <p className={cn("text-xs font-semibold capitalize",
            profile.energyLevel === "muito_alta" ? "text-red-600" :
            profile.energyLevel === "alta" ? "text-amber-600" : "text-green-600"
          )}>{profile.energyLevel.replace("_"," ")}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-2xs text-gray-400 mb-1">Sociabilidade</p>
          <p className="text-xs font-semibold text-blue-700 capitalize">{profile.socialLevel.replace("_"," ")}</p>
        </div>
      </div>

      {/* Trainer notes */}
      <div className="p-3 bg-forest-50 rounded-lg border border-forest-100">
        <p className="text-2xs font-semibold text-forest-600 mb-1 flex items-center gap-1">
          <Brain className="w-3 h-3" /> Nota do treinador
        </p>
        <p className="text-xs text-forest-900 leading-relaxed">{profile.trainerNotes}</p>
      </div>

      {/* Expand: triggers, challenges, protocols */}
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-forest-700 font-semibold hover:text-forest-600">
        {expanded ? "Ver menos" : "Ver perfil completo"}
        <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-90")} />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          {[
            { label: "Gatilhos", items: profile.triggers, color: "bg-red-50 text-red-700 border border-red-100" },
            { label: "Pontos fortes", items: profile.strengths, color: "bg-green-50 text-green-700 border border-green-100" },
            { label: "Desafios", items: profile.challenges, color: "bg-amber-50 text-amber-700 border border-amber-100" },
          ].map(({ label, items, color }) => (
            <div key={label}>
              <p className="text-2xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">{label}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item, i) => (
                  <span key={i} className={cn("text-2xs px-2 py-1 rounded-full font-medium", color)}>{item}</span>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Protocolos ativos</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.protocols.map((p, i) => (
                <span key={i} className="text-2xs px-2 py-1 rounded-full bg-forest-50 text-forest-700 border border-forest-100 font-medium">
                  {p.replace("protocolo_", "").replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-t border-gray-100 pt-3">
        <Button size="xs" variant="secondary" className="flex-1" icon={<Plus className="w-3 h-3" />} onClick={() => store.toast("success", "Sessão registrada com sucesso.")}>Registrar sessão</Button>
        <Button size="xs" variant="outline" icon={<Target className="w-3 h-3" />}>Metas</Button>
      </div>
    </Card>
  );
}

export default function EscolaPage() {
  const [tab, setTab] = useState<"perfis" | "sessoes" | "protocolos">("perfis");

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escola & Comportamento</h1>
          <p className="text-sm text-gray-500 mt-0.5">Metodologia Matilha Equilibrada · {behaviorProfiles.length} alunos ativos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => store.toast("info", "Nova avaliação comportamental criada.")}>Nova avaliação</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Alunos ativos"    value={behaviorProfiles.length} icon={<GraduationCap className="w-4 h-4" />} color="purple" />
        <StatCard label="Sessões este mês" value="14" icon={<Calendar className="w-4 h-4" />} color="blue" />
        <StatCard label="Em adaptação"     value={behaviorProfiles.filter(p=>p.adaptationPhase==="progresso").length} icon={<Star className="w-4 h-4" />} color="amber" />
        <StatCard label="Treinadores"      value={trainers.length} icon={<Brain className="w-4 h-4" />} color="green" />
      </div>

      {/* Inteligência Matilha */}
      <div className="bg-gradient-to-r from-forest-900 to-forest-700 rounded-xl p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-forest-400/30 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-forest-200" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-forest-100 text-sm mb-1">Inteligência Comportamental Matilha</p>
            <p className="text-forest-300 text-xs leading-relaxed">
              O sistema detectou que <strong className="text-white">Duke</strong> registrou alta excitação na sessão de ontem. Rodrigo deve revisar o protocolo de desaceleração antes da aula de hoje às 11h. Recomendamos 10 min de caminhada lenta pré-sessão.
            </p>
          </div>
          <Button size="xs" variant="secondary" className="flex-shrink-0 bg-white/10 text-white border-white/20 hover:bg-white/20">
            Ver perfil <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "perfis",     label: "Perfis comportamentais", count: behaviorProfiles.length },
          { id: "sessoes",    label: "Sessões" },
          { id: "protocolos", label: "Protocolos" },
        ]}
        active={tab} onChange={(v) => setTab(v as typeof tab)}
      />

      {tab === "perfis" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {behaviorProfiles.map((profile) => (
            <BehaviorCard key={profile.dogId} profile={profile} />
          ))}
        </div>
      )}

      {tab === "sessoes" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["Cão","Treinador","Data","Tipo","Duração","Observação"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { dog: "Duke",  trainer: "Rodrigo Alves", date: "2024-07-03", type: "Individual", duration: "60min", obs: "Alta excitação — protocolo ajustado" },
                { dog: "Thor",  trainer: "Rodrigo Alves", date: "2024-07-01", type: "Individual", duration: "60min", obs: "Excelente progresso com guia" },
                { dog: "Duke",  trainer: "Rodrigo Alves", date: "2024-06-28", type: "Individual", duration: "60min", obs: "Limiar reduzido com estímulo sonoro" },
                { dog: "Thor",  trainer: "Rodrigo Alves", date: "2024-06-25", type: "Individual", duration: "60min", obs: "Introdução ao protocolo de pulos" },
              ].map((session, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{session.dog}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{session.trainer}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 num-display">{formatDate(session.date)}</td>
                  <td className="px-5 py-3.5"><span className="badge text-2xs bg-rose-100 text-rose-700">{session.type}</span></td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">{session.duration}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">{session.obs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "protocolos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { name: "Desaceleração", desc: "Redução de estados de alta excitação através de atividades controladas de baixa intensidade.", dogs: ["Duke"], category: "Regulação emocional" },
            { name: "Limiar",        desc: "Trabalho com estímulos abaixo do limiar reativo, expandindo gradualmente a tolerância.", dogs: ["Duke","Luna"], category: "Reatividade" },
            { name: "Espera",        desc: "Desenvolvimento de autocontrole e capacidade de esperar estímulos sem reação ansiosa.", dogs: ["Duke"], category: "Autocontrole" },
            { name: "Guia",          desc: "Caminhadas sem arraste, passeio prazeroso para ambos.", dogs: ["Thor"], category: "Passeio" },
            { name: "Pulos",         desc: "Redirecting de comportamento de pulos em visitas e cumprimentos.", dogs: ["Thor"], category: "Comportamento social" },
          ].map((protocol) => (
            <Card key={protocol.name} className="flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">Protocolo: {protocol.name}</p>
                </div>
                <span className="badge text-2xs bg-forest-50 text-forest-700">{protocol.category}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{protocol.desc}</p>
              <div>
                <p className="text-2xs text-gray-400 mb-1.5">Alunos neste protocolo</p>
                <div className="flex flex-wrap gap-1.5">
                  {protocol.dogs.map((d) => (
                    <span key={d} className="text-2xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">{d}</span>
                  ))}
                </div>
              </div>
              <Button size="xs" variant="secondary" className="mt-auto">Ver detalhes</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
