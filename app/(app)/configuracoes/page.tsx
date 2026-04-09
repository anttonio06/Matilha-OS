"use client";

import React, { useState } from "react";
import {
  Settings, Building2, Bell, Shield, CreditCard, Palette,
  Dog, Globe, Save, CheckCircle, ToggleLeft, ToggleRight,
  Plus, Trash2, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { store } from "@/lib/store";
import { Button, Card, Input, Select, Tabs } from "@/components/ui";

const sections = [
  { id: "unidade",       label: "Unidade",        icon: <Building2 className="w-4 h-4" /> },
  { id: "operacao",      label: "Operação",        icon: <Dog className="w-4 h-4" /> },
  { id: "notificacoes",  label: "Notificações",    icon: <Bell className="w-4 h-4" /> },
  { id: "planos_config", label: "Planos & Preços", icon: <CreditCard className="w-4 h-4" /> },
  { id: "permissoes",    label: "Permissões",      icon: <Shield className="w-4 h-4" /> },
  { id: "aparencia",     label: "Aparência",       icon: <Palette className="w-4 h-4" /> },
  { id: "integracao",    label: "Integrações",     icon: <Globe className="w-4 h-4" /> },
];

function ToggleRow({ label, sub, defaultOn = true }: { label: string; sub?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <button onClick={() => { setOn(p => !p); store.toast("success", `${label} ${!on ? "ativado" : "desativado"}.`); }}
        className={cn("transition-colors flex-shrink-0", on ? "text-forest-500 hover:text-forest-700" : "text-gray-300 hover:text-gray-500")}>
        {on ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
      </button>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [activeSection, setActiveSection] = useState("unidade");

  const [unidade, setUnidade] = useState({
    nome: "Matilha Equilibrada", cnpj: "12.345.678/0001-99",
    telefone: "(11) 3456-7890", email: "contato@matilhaequilibrada.com.br",
    endereco: "Rua das Flores, 123 — Vila Madalena, São Paulo/SP",
    horarioAbertura: "07:00", horarioFechamento: "19:00",
    capacidadeCreche: "15", capacidadeHotel: "8",
  });

  const save = () => store.toast("success", "Configurações salvas com sucesso!");

  return (
    <div className="p-6 max-w-[1200px]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie sua unidade e preferências do sistema</p>
        </div>
        <Button icon={<Save className="w-4 h-4" />} onClick={save}>Salvar alterações</Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                  activeSection === s.id
                    ? "bg-forest-50 text-forest-700 border border-forest-100"
                    : "text-gray-600 hover:bg-gray-100"
                )}>
                <span className={cn(activeSection === s.id ? "text-forest-500" : "text-gray-400")}>{s.icon}</span>
                {s.label}
                {activeSection === s.id && <ChevronRight className="w-3.5 h-3.5 ml-auto text-forest-400" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "unidade" && (
            <Card className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Dados da Unidade</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nome da unidade" value={unidade.nome}
                  onChange={e => setUnidade(u => ({ ...u, nome: e.target.value }))} />
                <Input label="CNPJ" value={unidade.cnpj}
                  onChange={e => setUnidade(u => ({ ...u, cnpj: e.target.value }))} />
                <Input label="Telefone" value={unidade.telefone}
                  onChange={e => setUnidade(u => ({ ...u, telefone: e.target.value }))} />
                <Input label="E-mail" value={unidade.email}
                  onChange={e => setUnidade(u => ({ ...u, email: e.target.value }))} />
              </div>
              <Input label="Endereço completo" value={unidade.endereco}
                onChange={e => setUnidade(u => ({ ...u, endereco: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Horário de abertura" type="time" value={unidade.horarioAbertura}
                  onChange={e => setUnidade(u => ({ ...u, horarioAbertura: e.target.value }))} />
                <Input label="Horário de fechamento" type="time" value={unidade.horarioFechamento}
                  onChange={e => setUnidade(u => ({ ...u, horarioFechamento: e.target.value }))} />
                <Input label="Capacidade da creche" type="number" value={unidade.capacidadeCreche}
                  onChange={e => setUnidade(u => ({ ...u, capacidadeCreche: e.target.value }))} />
                <Input label="Capacidade do hotel" type="number" value={unidade.capacidadeHotel}
                  onChange={e => setUnidade(u => ({ ...u, capacidadeHotel: e.target.value }))} />
              </div>
              <Button icon={<Save className="w-4 h-4" />} onClick={save}>Salvar</Button>
            </Card>
          )}

          {activeSection === "operacao" && (
            <Card className="space-y-1">
              <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-2">Regras operacionais</h3>
              <ToggleRow label="Bloquear check-in com vacina vencida" sub="Impede check-in automático de cães com vacinas expiradas" />
              <ToggleRow label="Alertar renovação de plano" sub="Notificar quando restar ≤ 3 usos de qualquer plano" />
              <ToggleRow label="Sugestão de banho automática" sub="Sugerir banho quando cão da creche estiver há 30+ dias sem banho" />
              <ToggleRow label="Sugestão de upsell contextual" sub="Exibir oportunidades de venda baseadas no perfil do cão" defaultOn />
              <ToggleRow label="Atualização diária do hotel" sub="Lembrar equipe de enviar atualização aos tutores de hóspedes" />
              <ToggleRow label="Motor de oportunidades ativo" sub="Analisar perfil de cada cão para gerar sugestões inteligentes" />
              <ToggleRow label="Confirmação automática de agendamento" sub="Enviar WhatsApp de confirmação ao criar agendamento" />
              <ToggleRow label="Registro de estado emocional obrigatório" sub="Exigir preenchimento no check-in" defaultOn={false} />
            </Card>
          )}

          {activeSection === "notificacoes" && (
            <Card className="space-y-1">
              <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-2">Preferências de notificação</h3>
              <ToggleRow label="Notificações no sistema" />
              <ToggleRow label="E-mail para relatórios" sub="Receber resumo diário por e-mail" />
              <ToggleRow label="Alerta de inadimplência" sub="Notificar quando cobrança vencer sem pagamento" />
              <ToggleRow label="Alerta de vacina próxima do vencimento" />
              <ToggleRow label="Alerta de plano no limite" />
              <ToggleRow label="Aniversário do cão" sub="Lembrar 1 dia antes" />
              <ToggleRow label="Alertas de equipe sobrecarregada" defaultOn={false} />
              <ToggleRow label="Resumo semanal executivo" />
            </Card>
          )}

          {activeSection === "planos_config" && (
            <div className="space-y-4">
              <Card className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Preços padrão dos serviços</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Diária de creche (avulso)", "90"],
                    ["Banho (médio porte)", "85"],
                    ["Banho & Tosa (médio porte)", "150"],
                    ["Hotel (standard/noite)", "120"],
                    ["Sessão de treino (1h)", "180"],
                    ["Avaliação comportamental", "250"],
                  ].map(([label, value]) => (
                    <Input key={label} label={label} defaultValue={value}
                      icon={<span className="text-gray-400 text-sm">R$</span>} />
                  ))}
                </div>
                <Button icon={<Save className="w-4 h-4" />} onClick={save}>Salvar preços</Button>
              </Card>
              <Card className="space-y-1">
                <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-2">Políticas de plano</h3>
                <ToggleRow label="Permitir congelamento de plano" sub="Tutores podem pausar planos por até 15 dias" />
                <ToggleRow label="Renovação automática padrão" sub="Renovar automaticamente planos recorrentes" />
                <ToggleRow label="Permitir upgrade de plano ativo" />
                <ToggleRow label="Desconto por fidelidade" sub="5% de desconto após 6 meses de plano ativo" defaultOn={false} />
              </Card>
            </div>
          )}

          {activeSection === "permissoes" && (
            <Card className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Controle de acesso</h3>
              <p className="text-sm text-gray-500">Configure quais funcionalidades cada perfil pode acessar. Alterações entram em vigor no próximo login.</p>
              {["Admin","Gestor","Recepção","Banhista","Monitor","Treinador"].map(role => (
                <div key={role} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{role}</p>
                    <p className="text-xs text-gray-500">
                      {role === "Admin" ? "Acesso total ao sistema" :
                       role === "Gestor" ? "Acesso a tudo exceto equipe" :
                       role === "Recepção" ? "Check-in, agenda, CRM, loja" :
                       role === "Banhista" ? "Agenda e banho" :
                       role === "Monitor" ? "Creche e check-in" :
                       "Escola, CRM e agenda"}
                    </p>
                  </div>
                  <Button size="xs" variant="outline"
                    onClick={() => store.toast("info", `Editando permissões de ${role}...`)}>
                    Editar
                  </Button>
                </div>
              ))}
            </Card>
          )}

          {activeSection === "aparencia" && (
            <Card className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Aparência</h3>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Tema</p>
                <div className="flex gap-3">
                  {[
                    { id: "light", label: "Claro", active: true },
                    { id: "dark",  label: "Escuro", active: false },
                    { id: "auto",  label: "Automático", active: false },
                  ].map(t => (
                    <button key={t.id} onClick={() => store.toast("info", `Tema ${t.label} será aplicado em breve.`)}
                      className={cn("px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        t.active ? "border-forest-500 bg-forest-50 text-forest-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Cor de destaque</p>
                <div className="flex gap-2">
                  {["#2d7a50","#2563eb","#7c3aed","#d97706","#dc2626"].map(color => (
                    <button key={color} onClick={() => store.toast("info", "Cor aplicada!")}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                      style={{ background: color }} />
                  ))}
                </div>
              </div>
              <ToggleRow label="Mostrar avatares de cães na agenda" />
              <ToggleRow label="Animações da interface" />
              <ToggleRow label="Modo denso (menos espaçamento)" defaultOn={false} />
            </Card>
          )}

          {activeSection === "integracao" && (
            <div className="space-y-4">
              {[
                { name: "WhatsApp Business API", status: "conectado", desc: "Envio de mensagens automatizadas e templates" },
                { name: "Stripe / Pagamentos",    status: "pendente",  desc: "Cobrança online, PIX e cartão via API" },
                { name: "Google Calendar",        status: "pendente",  desc: "Sincronização bidirecional de agenda" },
                { name: "Asaas",                  status: "pendente",  desc: "Gestão de cobranças e inadimplência" },
                { name: "Zapier / Make",           status: "pendente",  desc: "Automações com ferramentas externas" },
              ].map(integ => (
                <Card key={integ.name} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{integ.name}</p>
                    <p className="text-xs text-gray-500">{integ.desc}</p>
                  </div>
                  {integ.status === "conectado" ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-700 font-semibold">Conectado</span>
                    </div>
                  ) : (
                    <Button size="xs" variant="outline"
                      onClick={() => store.toast("info", `Configurando ${integ.name}...`)}>
                      Configurar
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
