"use client";

import React, { useState } from "react";
import {
  MessageSquare, Send, Phone, CheckCircle,
  Plus, Search, Zap, Star, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { store } from "@/lib/store";
import { tutors } from "@/lib/mock-data";
import { Badge, Button, Card, Input, StatCard, Tabs } from "@/components/ui";

const mockMessages = [
  { id: "m1", tutorId: "tutor_1", text: "Oi! Thor pode ficar até as 19h hoje?", time: "2026-04-06T09:15:00", from: "tutor", read: true },
  { id: "m2", tutorId: "tutor_1", text: "Claro! Sem problema. Avisaremos quando ele estiver pronto para retirada.", time: "2026-04-06T09:18:00", from: "sistema", read: true },
  { id: "m3", tutorId: "tutor_2", text: "A Luna tomou o remédio esta manhã?", time: "2026-04-06T10:30:00", from: "tutor", read: false },
  { id: "m4", tutorId: "tutor_6", text: "Rex está bem? Pode me mandar uma foto?", time: "2026-04-06T11:00:00", from: "tutor", read: false },
  { id: "m5", tutorId: "tutor_7", text: "Obrigada pelo cuidado com a Pipoca! 🐾", time: "2026-04-06T08:00:00", from: "tutor", read: true },
];

const templates = [
  { id: "checkin",     label: "Check-in realizado",    emoji: "✅", text: "Oi! {nome} chegou bem e já está curtindo o dia com a turma! 😄" },
  { id: "checkout",    label: "Check-out / resumo",    emoji: "🏠", text: "Oi! {nome} foi incrível hoje. Nos vemos na próxima! 🐕" },
  { id: "renovacao",   label: "Renovação de plano",    emoji: "🔄", text: "Oi! O plano de {nome} está próximo do limite. Gostaria de renovar?" },
  { id: "vacina",      label: "Lembrete de vacina",    emoji: "💉", text: "Lembrete: a vacina de {nome} vence em breve. Podemos ajudar a agendar?" },
  { id: "aniversario", label: "Aniversário do cão",    emoji: "🎂", text: "Feliz aniversário para {nome}! 🎂 Hoje tem petisco especial!" },
  { id: "upsell",      label: "Oferta especial",       emoji: "⭐", text: "Oi! Temos uma oferta especial para {nome} esta semana. Posso te contar?" },
  { id: "hotel",       label: "Atualização hotel",     emoji: "🏨", text: "Oi! {nome} está bem aqui no hotel. Segue foto do dia! 📸" },
  { id: "falta",       label: "Falta registrada",      emoji: "📋", text: "Registramos a falta de {nome} hoje. Tudo bem? Precisam reagendar?" },
];

export default function ComunicacaoPage() {
  const [tab, setTab] = useState<"conversas" | "templates" | "disparos">("conversas");
  const [selectedTutor, setSelectedTutor] = useState<string>("tutor_1");
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [, setSelectedTemplate] = useState<string | null>(null);
  const [disparo, setDisparo] = useState({ template: "renovacao", segmento: "plano_vencendo" });

  const tutor = tutors.find(t => t.id === selectedTutor);
  const convMsgs = mockMessages.filter(m => m.tutorId === selectedTutor);
  const unreadCount = mockMessages.filter(m => !m.read).length;

  const sendReply = () => {
    if (!reply.trim()) return;
    setReply("");
    store.toast("success", `Mensagem enviada para ${tutor?.name}!`);
  };

  const sendTemplate = (tpl: typeof templates[0]) => {
    store.toast("success", `"${tpl.label}" enviado para ${tutor?.name}!`);
    setSelectedTemplate(null);
  };

  const sendDisparo = () => {
    store.toast("success", "Disparo agendado para os clientes selecionados!");
  };

  const filteredTutors = tutors.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicação</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mensagens, templates e disparos em massa</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />}
          onClick={() => store.openModal("enviar_mensagem")}>
          Nova mensagem
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Não lidas"       value={unreadCount} icon={<MessageSquare className="w-4 h-4" />} color="amber" />
        <StatCard label="Enviadas hoje"   value="12" icon={<Send className="w-4 h-4" />} color="green" />
        <StatCard label="Taxa de resposta" value="94%" icon={<CheckCircle className="w-4 h-4" />} color="blue" />
        <StatCard label="Templates ativos" value={templates.length} icon={<Star className="w-4 h-4" />} color="purple" />
      </div>

      <Tabs
        tabs={[
          { id: "conversas",  label: "Conversas",  count: unreadCount || undefined },
          { id: "templates",  label: "Templates",  count: templates.length },
          { id: "disparos",   label: "Disparos em massa" },
        ]}
        active={tab} onChange={v => setTab(v as typeof tab)}
      />

      {tab === "conversas" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-[600px]">
          {/* Tutor list */}
          <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <Input icon={<Search className="w-3.5 h-3.5" />} placeholder="Buscar tutor..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {filteredTutors.map(t => {
                const msgs = mockMessages.filter(m => m.tutorId === t.id);
                const unread = msgs.filter(m => !m.read).length;
                const last = msgs[msgs.length - 1];
                return (
                  <button key={t.id} onClick={() => setSelectedTutor(t.id)}
                    className={cn("w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                      selectedTutor === t.id && "bg-forest-50 border-r-2 border-forest-500"
                    )}>
                    <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-forest-700">{t.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                        {unread > 0 && (
                          <span className="w-4 h-4 bg-forest-500 text-white text-2xs font-bold rounded-full flex items-center justify-center flex-shrink-0">{unread}</span>
                        )}
                      </div>
                      {last && <p className="text-xs text-gray-400 truncate">{last.text}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat */}
          <div className="xl:col-span-2 flex flex-col bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
              <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-forest-700">{tutor?.name[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{tutor?.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {tutor?.whatsapp}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button size="xs" variant="outline" icon={<Phone className="w-3 h-3" />}
                  onClick={() => store.toast("info", `Ligando para ${tutor?.name}...`)}>Ligar</Button>
                <Button size="xs" variant="secondary" icon={<Zap className="w-3 h-3" />}
                  onClick={() => setSelectedTemplate("template")}>Template</Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {convMsgs.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                  <MessageSquare className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                </div>
              )}
              {convMsgs.map(msg => (
                <div key={msg.id} className={cn("flex", msg.from === "sistema" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-xs px-4 py-2.5 rounded-2xl text-sm",
                    msg.from === "sistema"
                      ? "bg-forest-600 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-card"
                  )}>
                    <p>{msg.text}</p>
                    <p className={cn("text-2xs mt-1", msg.from === "sistema" ? "text-forest-200" : "text-gray-400")}>
                      {new Date(msg.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            <div className="p-3 border-t border-gray-100 flex items-center gap-2">
              <input
                value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendReply()}
                placeholder="Digite a mensagem..."
                className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500"
              />
              <Button size="sm" icon={<Send className="w-3.5 h-3.5" />} onClick={sendReply}>
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {templates.map(tpl => (
            <Card key={tpl.id} hover className="flex flex-col gap-3 cursor-pointer group">
              <div className="flex items-start justify-between">
                <span className="text-2xl">{tpl.emoji}</span>
                <Badge variant="green" size="sm">Ativo</Badge>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{tpl.label}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{tpl.text}</p>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button size="xs" variant="secondary" icon={<Send className="w-3 h-3" />} className="flex-1"
                  onClick={() => sendTemplate(tpl)}>
                  Disparar
                </Button>
                <Button size="xs" variant="outline"
                  onClick={() => store.toast("info", `Editando template "${tpl.label}"...`)}>
                  Editar
                </Button>
              </div>
            </Card>
          ))}
          <Card hover className="flex flex-col items-center justify-center gap-3 py-8 cursor-pointer border-dashed border-2 border-gray-200"
            onClick={() => store.toast("info", "Editor de templates em breve.")}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">Novo template</p>
          </Card>
        </div>
      )}

      {tab === "disparos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <h3 className="font-semibold text-gray-900">Configurar disparo</h3>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Template</label>
              <div className="grid grid-cols-2 gap-2">
                {templates.slice(0, 6).map(tpl => (
                  <button key={tpl.id}
                    onClick={() => setDisparo(d => ({ ...d, template: tpl.id }))}
                    className={cn("text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                      disparo.template === tpl.id
                        ? "border-forest-500 bg-forest-50 text-forest-800"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                    )}>
                    {tpl.emoji} {tpl.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Segmento alvo</label>
              <select value={disparo.segmento}
                onChange={e => setDisparo(d => ({ ...d, segmento: e.target.value }))}
                className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-forest-500/20">
                <option value="todos">Todos os tutores ativos ({tutors.filter(t => t.status === "ativo").length})</option>
                <option value="plano_vencendo">Planos vencendo (3)</option>
                <option value="sem_visita">Sem visita há 30+ dias (2)</option>
                <option value="hotel_hoje">Hóspedes atuais (2)</option>
                <option value="aniversario">Aniversário esta semana (1)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Canal</label>
              <div className="flex gap-2">
                {[["whatsapp","WhatsApp"],["email","E-mail"]].map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <input type="checkbox" defaultChecked={v === "whatsapp"} className="accent-forest-600" />
                    <span className="text-sm text-gray-700">{l}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full" icon={<RefreshCw className="w-4 h-4" />} onClick={sendDisparo}>
              Agendar disparo
            </Button>
          </Card>

          <Card className="space-y-4">
            <h3 className="font-semibold text-gray-900">Histórico de disparos</h3>
            <div className="space-y-3">
              {[
                { label: "Renovação de plano", date: "03/04/2026", enviados: 3, abertos: 2, canal: "WhatsApp" },
                { label: "Aniversário do cão", date: "01/04/2026", enviados: 1, abertos: 1, canal: "WhatsApp" },
                { label: "Check-out / resumo", date: "28/03/2026", enviados: 4, abertos: 4, canal: "WhatsApp" },
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{d.label}</p>
                    <p className="text-xs text-gray-500">{d.date} · {d.canal}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-800">{d.abertos}/{d.enviados}</p>
                    <p className="text-2xs text-gray-400">abertos</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
