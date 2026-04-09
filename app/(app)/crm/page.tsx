"use client";

import React, { useState, useCallback, useMemo, memo } from "react";
import {
  Search, Plus, ChevronRight, Dog, Phone, Star, AlertTriangle,
  TrendingUp, Users, Syringe, Edit2, Save, X, Send, MessageCircle,
  CreditCard, Settings, Key, CheckCircle, ExternalLink, Trash2,
  Mail, MapPin, Calendar, Weight, Zap, Heart, Filter, DollarSign,
  RefreshCw, Copy, Eye, EyeOff, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { store } from "@/lib/store";
import { cn, formatCurrency, getDogAge, initials } from "@/lib/utils";
import { useDB, DogDB, TutorDB, PlanDB } from "@/lib/db";
import { Badge, Button, Card, Input, Modal, StatCard, Tabs } from "@/components/ui";
import type { Tutor, Dog as DogType } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 bg-white";
const labelCls = "text-xs font-semibold text-gray-600 mb-1.5 block";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2");
}

// ─── Dog Edit Modal ───────────────────────────────────────────────────────────

const DogEditModal = memo(function DogEditModal({ dog, tutors, onClose }: {
  dog: DogType; tutors: Tutor[]; onClose: () => void;
}) {
  const [form, setForm] = useState({
    name:                   dog.name,
    breed:                  dog.breed,
    sex:                    dog.sex,
    size:                   dog.size,
    weight:                 String(dog.weight),
    neutered:               dog.neutered,
    birthDate:              dog.birthDate,
    tutorId:                dog.tutorId,
    energyLevel:            dog.energyLevel,
    socialLevel:            dog.socialLevel,
    foodBrand:              dog.foodBrand ?? "",
    foodAmount:             dog.foodAmount ?? "",
    medicalRestrictions:    dog.medicalRestrictions ?? "",
    behavioralRestrictions: dog.behavioralRestrictions ?? "",
    notes:                  dog.notes ?? "",
  });

  const set = useCallback(<K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v })), []);

  const save = () => {
    DogDB.update(dog.id, {
      name:                  form.name,
      breed:                 form.breed,
      sex:                   form.sex as DogType["sex"],
      size:                  form.size as DogType["size"],
      weight:                Number(form.weight) || dog.weight,
      neutered:              form.neutered,
      birthDate:             form.birthDate,
      tutorId:               form.tutorId,
      energyLevel:           form.energyLevel as DogType["energyLevel"],
      socialLevel:           form.socialLevel as DogType["socialLevel"],
      foodBrand:             form.foodBrand,
      foodAmount:            form.foodAmount,
      medicalRestrictions:   form.medicalRestrictions,
      behavioralRestrictions:form.behavioralRestrictions,
      notes:                 form.notes,
    });
    store.toast("success", `${form.name} atualizado!`);
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="xl" title={`Editar — ${dog.name}`}
      description="Perfil completo do cão"
      footer={
        <>
          <Button variant="outline" onClick={onClose} icon={<X className="w-4 h-4"/>}>Cancelar</Button>
          <Button onClick={save} icon={<Save className="w-4 h-4"/>}>Salvar alterações</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Nome *">
            <input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)}/>
          </Field>
          <Field label="Raça">
            <input className={inputCls} value={form.breed} onChange={e => set("breed", e.target.value)}/>
          </Field>
          <Field label="Tutor responsável">
            <select className={inputCls} value={form.tutorId} onChange={e => set("tutorId", e.target.value)}>
              <option value="">Selecionar...</option>
              {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Sexo">
            <select className={inputCls} value={form.sex} onChange={e => set("sex", e.target.value as DogType["sex"])}>
              <option value="macho">Macho</option>
              <option value="femea">Fêmea</option>
            </select>
          </Field>
          <Field label="Porte">
            <select className={inputCls} value={form.size} onChange={e => set("size", e.target.value as DogType["size"])}>
              {["mini","pequeno","medio","grande","gigante"].map(s =>
                <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Peso (kg)">
            <input className={inputCls} type="number" step="0.1" value={form.weight} onChange={e => set("weight", e.target.value)}/>
          </Field>
          <Field label="Nascimento">
            <input className={inputCls} type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)}/>
          </Field>
        </div>

        <div className="p-4 bg-forest-50 border border-forest-100 rounded-xl space-y-3">
          <p className="text-xs font-bold text-forest-700 uppercase tracking-wide">Perfil comportamental</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nível de energia">
              <div className="flex gap-2 mt-1">
                {(["baixa","moderada","alta","muito_alta"] as const).map(e => (
                  <button key={e} type="button" onClick={() => set("energyLevel", e)}
                    className={cn("flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all",
                      form.energyLevel === e
                        ? e==="muito_alta" ? "border-red-500 bg-red-50 text-red-700"
                          : e==="alta" ? "border-amber-500 bg-amber-50 text-amber-700"
                          : e==="moderada" ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                    )}>
                    {e.replace("_"," ")}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Sociabilidade">
              <div className="flex gap-2 mt-1">
                {(["reservado","seletivo","sociavel","muito_sociavel"] as const).map(s => (
                  <button key={s} type="button" onClick={() => set("socialLevel", s)}
                    className={cn("flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all",
                      form.socialLevel === s
                        ? "border-forest-500 bg-forest-50 text-forest-700"
                        : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                    )}>
                    {s.replace("_"," ")}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="neutered-edit" className="w-4 h-4 accent-forest-600 rounded"
            checked={form.neutered} onChange={e => set("neutered", e.target.checked)}/>
          <label htmlFor="neutered-edit" className="text-sm text-gray-700">Castrado(a)</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ração (marca)">
            <input className={inputCls} placeholder="Ex: Royal Canin" value={form.foodBrand} onChange={e => set("foodBrand", e.target.value)}/>
          </Field>
          <Field label="Quantidade / frequência">
            <input className={inputCls} placeholder="Ex: 300g 2x ao dia" value={form.foodAmount} onChange={e => set("foodAmount", e.target.value)}/>
          </Field>
        </div>
        <Field label="Restrições de saúde">
          <input className={inputCls} placeholder="Alergias, medicamentos..." value={form.medicalRestrictions} onChange={e => set("medicalRestrictions", e.target.value)}/>
        </Field>
        <Field label="Restrições comportamentais">
          <input className={inputCls} placeholder="Reatividade, medos, gatilhos..." value={form.behavioralRestrictions} onChange={e => set("behavioralRestrictions", e.target.value)}/>
        </Field>
        <Field label="Observações gerais">
          <textarea className={cn(inputCls,"resize-none")} rows={3} placeholder="Outros detalhes importantes..."
            value={form.notes} onChange={e => set("notes", e.target.value)}/>
        </Field>
      </div>
    </Modal>
  );
});

// ─── Tutor Edit Modal ─────────────────────────────────────────────────────────

const TutorEditModal = memo(function TutorEditModal({ tutor, onClose }: {
  tutor: Tutor; onClose: () => void;
}) {
  const [form, setForm] = useState({
    name:             tutor.name,
    cpf:              tutor.cpf ?? "",
    email:            tutor.email,
    phone:            tutor.phone,
    whatsapp:         tutor.whatsapp,
    address:          tutor.address ?? "",
    status:           tutor.status,
    preferredContact: tutor.preferredContact,
    source:           tutor.source ?? "",
    notes:            tutor.notes ?? "",
  });

  const set = useCallback(<K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v })), []);

  const save = () => {
    TutorDB.update(tutor.id, {
      name:             form.name,
      cpf:              form.cpf,
      email:            form.email,
      phone:            form.phone,
      whatsapp:         form.whatsapp,
      address:          form.address,
      status:           form.status as Tutor["status"],
      preferredContact: form.preferredContact as Tutor["preferredContact"],
      source:           form.source,
      notes:            form.notes,
    });
    store.toast("success", `${form.name} atualizado!`);
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="xl" title={`Editar tutor — ${tutor.name}`}
      description="Dados completos do responsável"
      footer={
        <>
          <Button variant="outline" onClick={onClose} icon={<X className="w-4 h-4"/>}>Cancelar</Button>
          <Button onClick={save} icon={<Save className="w-4 h-4"/>}>Salvar alterações</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Nome completo *">
            <input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)}/>
          </Field>
          <Field label="CPF">
            <input className={inputCls} placeholder="000.000.000-00" value={form.cpf}
              onChange={e => set("cpf", maskCPF(e.target.value))}/>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="E-mail">
            <input className={inputCls} type="email" value={form.email} onChange={e => set("email", e.target.value)}/>
          </Field>
          <Field label="Telefone">
            <input className={inputCls} placeholder="(00) 00000-0000" value={form.phone}
              onChange={e => set("phone", maskPhone(e.target.value))}/>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="WhatsApp">
            <input className={inputCls} placeholder="(00) 00000-0000" value={form.whatsapp}
              onChange={e => set("whatsapp", maskPhone(e.target.value))}/>
          </Field>
          <Field label="Endereço">
            <input className={inputCls} placeholder="Rua, número, bairro..." value={form.address}
              onChange={e => set("address", e.target.value)}/>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={e => set("status", e.target.value as Tutor["status"])}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="inadimplente">Inadimplente</option>
            </select>
          </Field>
          <Field label="Contato preferido">
            <select className={inputCls} value={form.preferredContact}
              onChange={e => set("preferredContact", e.target.value as Tutor["preferredContact"])}>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
            </select>
          </Field>
          <Field label="Origem">
            <input className={inputCls} placeholder="Instagram, indicação..." value={form.source}
              onChange={e => set("source", e.target.value)}/>
          </Field>
        </div>
        <Field label="Observações">
          <textarea className={cn(inputCls,"resize-none")} rows={3} value={form.notes}
            onChange={e => set("notes", e.target.value)}/>
        </Field>
      </div>
    </Modal>
  );
});

// ─── WhatsApp Send Modal ──────────────────────────────────────────────────────

function WhatsAppModal({ phone, name, onClose }: { phone: string; name: string; onClose: () => void }) {
  const [msg, setMsg] = useState(
    `Olá ${name.split(" ")[0]}! 😊 Aqui é da Matilha. Como posso ajudar?`
  );
  const [sending, setSending] = useState(false);
  const cfg = getWAConfig();

  const sendViaAPI = async () => {
    if (!cfg.token || !cfg.phoneId) return;
    setSending(true);
    try {
      const num = phone.replace(/\D/g,"");
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${cfg.phoneId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type":"application/json", Authorization:`Bearer ${cfg.token}` },
          body: JSON.stringify({
            messaging_product:"whatsapp", to:`55${num}`,
            type:"text", text:{ body: msg },
          }),
        }
      );
      if (res.ok) { store.toast("success","Mensagem enviada via WhatsApp API!"); onClose(); }
      else { const d = await res.json(); store.toast("error", d.error?.message || "Erro ao enviar"); }
    } catch { store.toast("error","Falha na conexão com WhatsApp API"); }
    setSending(false);
  };

  const openWhatsApp = () => {
    const num = phone.replace(/\D/g,"");
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, "_blank");
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="md" title="Enviar mensagem" description={`Para: ${name} — ${phone}`}
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={onClose} className="w-auto">Cancelar</Button>
          {cfg.token && cfg.phoneId ? (
            <Button onClick={sendViaAPI} disabled={sending} className="flex-1"
              icon={sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}>
              {sending ? "Enviando..." : "Enviar via API"}
            </Button>
          ) : (
            <Button onClick={openWhatsApp} className="flex-1"
              icon={<ExternalLink className="w-4 h-4"/>}>
              Abrir no WhatsApp
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {!cfg.token && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"/>
            <p className="text-xs text-amber-700">API do WhatsApp não configurada. Configure em <strong>Integrações</strong> para envio direto. Por ora, será aberto o WhatsApp.</p>
          </div>
        )}
        <Field label="Mensagem">
          <textarea className={cn(inputCls,"resize-none")} rows={5} value={msg} onChange={e => setMsg(e.target.value)}/>
        </Field>
        <p className="text-xs text-gray-400">{msg.length} caracteres</p>
      </div>
    </Modal>
  );
}

// ─── Asaas Charge Modal ───────────────────────────────────────────────────────

function AsaasChargeModal({ tutor, onClose }: { tutor: Tutor; onClose: () => void }) {
  const [form, setForm] = useState({
    description: "Mensalidade Matilha",
    value: "",
    dueDate: new Date(Date.now() + 7*86400000).toISOString().split("T")[0],
    billingType: "BOLETO" as "BOLETO"|"PIX"|"CREDIT_CARD"|"UNDEFINED",
    installments: "1",
  });
  const [sending, setSending] = useState(false);
  const cfg = getAsaasConfig();

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const send = async () => {
    if (!cfg.apiKey) { store.toast("error","Configure a chave de API do Asaas em Integrações."); return; }
    if (!form.value || isNaN(Number(form.value))) { store.toast("error","Informe o valor da cobrança."); return; }
    setSending(true);
    try {
      // First, search or create customer in Asaas
      const cpf = tutor.cpf?.replace(/\D/g,"") || "";
      const baseUrl = cfg.sandbox ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";
      const headers = { "Content-Type":"application/json", "access_token": cfg.apiKey };

      // Create charge directly (Asaas accepts externalReference)
      const res = await fetch(`${baseUrl}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          customer: "", // Asaas requires customer ID — in real integration, create customer first
          billingType: form.billingType,
          value: Number(form.value),
          dueDate: form.dueDate,
          description: form.description,
          externalReference: tutor.id,
          postalService: false,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        store.toast("success", `Cobrança de R$ ${form.value} criada com sucesso!`);
        onClose();
      } else {
        store.toast("error", data.errors?.[0]?.description || "Erro ao criar cobrança");
      }
    } catch { store.toast("error","Falha na conexão com Asaas"); }
    setSending(false);
  };

  return (
    <Modal open onClose={onClose} size="md" title="Gerar cobrança" description={`Para: ${tutor.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={send} disabled={sending}
            icon={sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <DollarSign className="w-4 h-4"/>}>
            {sending ? "Gerando..." : "Gerar cobrança"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {!cfg.apiKey && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"/>
            <p className="text-xs text-amber-700">Asaas não configurado. Vá em <strong>Integrações → Asaas</strong> para inserir sua API key.</p>
          </div>
        )}
        <Field label="Descrição">
          <input className={inputCls} value={form.description} onChange={e => set("description", e.target.value)}/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <input className={inputCls} type="number" step="0.01" min="0" placeholder="0,00"
              value={form.value} onChange={e => set("value", e.target.value)}/>
          </Field>
          <Field label="Vencimento">
            <input className={inputCls} type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)}/>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Forma de pagamento">
            <select className={inputCls} value={form.billingType} onChange={e => set("billingType", e.target.value as typeof form.billingType)}>
              <option value="PIX">PIX</option>
              <option value="BOLETO">Boleto</option>
              <option value="CREDIT_CARD">Cartão de crédito</option>
              <option value="UNDEFINED">Qualquer forma</option>
            </select>
          </Field>
          <Field label="Parcelas">
            <select className={inputCls} value={form.installments} onChange={e => set("installments", e.target.value)}>
              {[1,2,3,6,12].map(n => <option key={n} value={String(n)}>{n}x</option>)}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

// ─── Config helpers (localStorage) ───────────────────────────────────────────

function getWAConfig() {
  try {
    const s = localStorage.getItem("matilha:wa:config");
    return s ? JSON.parse(s) : { token: "", phoneId: "" };
  } catch { return { token: "", phoneId: "" }; }
}
function saveWAConfig(cfg: { token: string; phoneId: string }) {
  localStorage.setItem("matilha:wa:config", JSON.stringify(cfg));
}

function getAsaasConfig() {
  try {
    const s = localStorage.getItem("matilha:asaas:config");
    return s ? JSON.parse(s) : { apiKey: "", sandbox: true };
  } catch { return { apiKey: "", sandbox: true }; }
}
function saveAsaasConfig(cfg: { apiKey: string; sandbox: boolean }) {
  localStorage.setItem("matilha:asaas:config", JSON.stringify(cfg));
}

// ─── Tab: Integrations ────────────────────────────────────────────────────────

function TabIntegracoes() {
  const [wa, setWa]       = useState<{ token: string; phoneId: string }>(getWAConfig);
  const [asaas, setAsaas] = useState<{ apiKey: string; sandbox: boolean }>(getAsaasConfig);
  const [showWaToken, setShowWaToken] = useState(false);
  const [showAsaasKey, setShowAsaasKey] = useState(false);

  const saveWA = () => { saveWAConfig(wa); store.toast("success","Configuração do WhatsApp salva!"); };
  const saveAsaas = () => { saveAsaasConfig(asaas); store.toast("success","Configuração do Asaas salva!"); };

  const Section = ({ icon, title, badge, children }: {
    icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode;
  }) => (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-forest-100 rounded-xl flex items-center justify-center text-forest-700">{icon}</div>
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          {badge && <span className="text-xs text-forest-600 bg-forest-50 border border-forest-100 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
        </div>
      </div>
      {children}
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* WhatsApp Business API */}
      <Section icon={<MessageCircle className="w-5 h-5"/>} title="WhatsApp Business API"
        badge="Meta Cloud API">
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">Como configurar:</p>
            <ol className="text-xs text-blue-600 space-y-0.5 list-decimal list-inside">
              <li>Crie um app no Meta for Developers</li>
              <li>Adicione o produto WhatsApp Business</li>
              <li>Copie o <strong>Phone Number ID</strong> e o <strong>Token de Acesso</strong></li>
              <li>Cole abaixo e salve</li>
            </ol>
          </div>
          <Field label="Phone Number ID">
            <input className={inputCls} placeholder="Ex: 123456789012345"
              value={wa.phoneId} onChange={e => setWa(c => ({ ...c, phoneId: e.target.value }))}/>
          </Field>
          <Field label="Token de Acesso (Bearer)">
            <div className="relative">
              <input className={cn(inputCls,"pr-10")} type={showWaToken ? "text" : "password"}
                placeholder="EAA..." value={wa.token} onChange={e => setWa(c => ({ ...c, token: e.target.value }))}/>
              <button onClick={() => setShowWaToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showWaToken ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </Field>
          <div className="flex items-center gap-2">
            {wa.token && wa.phoneId && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5"/> Configurado
              </span>
            )}
            <Button onClick={saveWA} size="sm" icon={<Save className="w-3.5 h-3.5"/>} className="ml-auto">
              Salvar configuração
            </Button>
          </div>
          <p className="text-xs text-gray-400">Sem configuração, o sistema abrirá o WhatsApp Web automaticamente.</p>
        </div>
      </Section>

      {/* Asaas */}
      <Section icon={<CreditCard className="w-5 h-5"/>} title="Asaas — Cobranças"
        badge="API v3">
        <div className="space-y-3">
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
            <p className="text-xs text-purple-700 font-medium mb-1">Como configurar:</p>
            <ol className="text-xs text-purple-600 space-y-0.5 list-decimal list-inside">
              <li>Acesse sua conta em asaas.com</li>
              <li>Vá em Configurações → Integrações → API</li>
              <li>Copie sua <strong>API Key</strong> e cole abaixo</li>
              <li>Use Sandbox para testes antes do ambiente real</li>
            </ol>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-600">Ambiente:</label>
            <div className="flex gap-2">
              {[{ v:true, l:"Sandbox (testes)" },{ v:false, l:"Produção" }].map(({ v, l }) => (
                <button key={String(v)} onClick={() => setAsaas(c => ({ ...c, sandbox: v }))}
                  className={cn("text-xs px-3 py-1.5 rounded-lg border font-medium transition-all",
                    asaas.sandbox === v
                      ? "border-forest-500 bg-forest-50 text-forest-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Field label="API Key">
            <div className="relative">
              <input className={cn(inputCls,"pr-10")} type={showAsaasKey ? "text" : "password"}
                placeholder="$aact_..." value={asaas.apiKey}
                onChange={e => setAsaas(c => ({ ...c, apiKey: e.target.value }))}/>
              <button onClick={() => setShowAsaasKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showAsaasKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </Field>
          <div className="flex items-center gap-2">
            {asaas.apiKey && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5"/> Configurado
              </span>
            )}
            <Button onClick={saveAsaas} size="sm" icon={<Save className="w-3.5 h-3.5"/>} className="ml-auto">
              Salvar configuração
            </Button>
          </div>
        </div>
      </Section>

      {/* WhatsApp Templates */}
      <Section icon={<Send className="w-5 h-5"/>} title="Templates de Mensagem">
        <div className="space-y-2">
          {[
            { label: "Confirmação de agendamento", msg: "Olá! Confirmamos o agendamento do(a) {nome_cao} para {data} às {hora}. 🐾" },
            { label: "Lembrete de vacina", msg: "Olá {tutor}! A vacina do(a) {nome_cao} vence em {data}. Agende com seu vet! 💉" },
            { label: "Cobrança pendente", msg: "Olá {tutor}! Identificamos uma cobrança em aberto. Entre em contato. 🙏" },
            { label: "Boas-vindas", msg: "Seja bem-vindo(a) à Matilha! Estamos felizes em ter o {nome_cao} na nossa família. 🐶❤️" },
          ].map(({ label, msg }) => (
            <div key={label} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                <p className="text-xs text-gray-500 truncate">{msg}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(msg); store.toast("success","Copiado!"); }}
                className="text-gray-400 hover:text-forest-600 p-1.5 rounded hover:bg-forest-50 transition-colors flex-shrink-0">
                <Copy className="w-3.5 h-3.5"/>
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Asaas Quick Stats */}
      <Section icon={<DollarSign className="w-5 h-5"/>} title="Cobranças Recentes">
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          {asaas.apiKey ? (
            <>
              <RefreshCw className="w-8 h-8 opacity-20 mb-3"/>
              <p className="text-sm font-medium">Histórico de cobranças</p>
              <p className="text-xs mt-1">Conecte e gere cobranças via CRM</p>
            </>
          ) : (
            <>
              <Key className="w-8 h-8 opacity-20 mb-3"/>
              <p className="text-sm font-medium">Configure o Asaas</p>
              <p className="text-xs mt-1">Insira a API key para ver cobranças</p>
            </>
          )}
        </div>
      </Section>
    </div>
  );
}

// ─── Tutor Row (table) ────────────────────────────────────────────────────────

const TutorRow = memo(function TutorRow({ tutor, dogs, onEdit, onMessage, onCharge }: {
  tutor: Tutor;
  dogs: DogType[];
  onEdit: (t: Tutor) => void;
  onMessage: (t: Tutor) => void;
  onCharge: (t: Tutor) => void;
}) {
  const tutorDogs = dogs.filter(d => d.tutorId === tutor.id);
  const statusCfg = {
    ativo:        { color:"bg-green-100 text-green-700",  dot:"bg-green-500",  label:"Ativo"         },
    inativo:      { color:"bg-gray-100 text-gray-600",    dot:"bg-gray-400",   label:"Inativo"       },
    inadimplente: { color:"bg-red-100 text-red-700",      dot:"bg-red-500",    label:"Inadimplente"  },
  }[tutor.status];

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-forest-700">{initials(tutor.name)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{tutor.name}</p>
            {tutor.cpf && <p className="text-xs text-gray-400">{tutor.cpf}</p>}
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm text-gray-600">{tutor.whatsapp || tutor.phone}</p>
        <p className="text-xs text-gray-400 truncate max-w-[160px]">{tutor.email}</p>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {tutorDogs.length === 0 ? (
            <span className="text-xs text-gray-400">—</span>
          ) : tutorDogs.slice(0,3).map(d => (
            <span key={d.id} className="text-xs bg-forest-50 text-forest-700 border border-forest-100 rounded-full px-2 py-0.5 font-medium">
              {d.name}
            </span>
          ))}
          {tutorDogs.length > 3 && (
            <span className="text-xs text-gray-400">+{tutorDogs.length - 3}</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", statusCfg.color)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)}/>
          {statusCfg.label}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <p className="text-sm font-bold text-gray-900 num-display">{formatCurrency(tutor.ltv, true)}</p>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onMessage(tutor)} title="WhatsApp"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors">
            <MessageCircle className="w-3.5 h-3.5"/>
          </button>
          <button onClick={() => onCharge(tutor)} title="Gerar cobrança"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors">
            <DollarSign className="w-3.5 h-3.5"/>
          </button>
          <button onClick={() => onEdit(tutor)} title="Editar"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-forest-50 hover:text-forest-600 transition-colors">
            <Edit2 className="w-3.5 h-3.5"/>
          </button>
          <button onClick={() => {
            if (confirm(`Remover tutor ${tutor.name}?`)) { TutorDB.delete(tutor.id); store.toast("success","Tutor removido."); }
          }} title="Remover"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
        </div>
      </td>
    </tr>
  );
});

// ─── Dog Row (table) ──────────────────────────────────────────────────────────

const DogRow = memo(function DogRow({ dog, tutors, onEdit }: {
  dog: DogType; tutors: Tutor[]; onEdit: (d: DogType) => void;
}) {
  const tutor = tutors.find(t => t.id === dog.tutorId);
  const hasExpiredVaccine = dog.vaccines.some(v => new Date(v.expiresAt) < new Date());

  const energyCfg: Record<string, string> = {
    baixa:     "bg-green-100 text-green-700",
    moderada:  "bg-blue-100 text-blue-700",
    alta:      "bg-amber-100 text-amber-700",
    muito_alta:"bg-red-100 text-red-700",
  };
  const socialCfg = "bg-forest-50 text-forest-700 border border-forest-100";

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sand-200 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-sand-800">{dog.name[0]}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900">{dog.name}</p>
              {hasExpiredVaccine && <span title="Vacina vencida"><Syringe className="w-3 h-3 text-red-400"/></span>}
            </div>
            <p className="text-xs text-gray-400">{dog.breed}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm text-gray-600">{tutor?.name ?? <span className="text-gray-300">—</span>}</p>
        <p className="text-xs text-gray-400">{tutor?.whatsapp || tutor?.phone}</p>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col gap-1">
          <span className={cn("inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize", energyCfg[dog.energyLevel])}>
            ⚡ {dog.energyLevel.replace("_"," ")}
          </span>
          <span className={cn("inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize", socialCfg)}>
            ♥ {dog.socialLevel.replace("_"," ")}
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="text-xs text-gray-600 space-y-0.5">
          <p><span className="text-gray-400">Porte:</span> <span className="capitalize font-medium">{dog.size}</span></p>
          <p><span className="text-gray-400">Peso:</span> <span className="font-medium">{dog.weight}kg</span></p>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="text-xs text-gray-600 space-y-0.5">
          <p>{getDogAge(dog.birthDate) || "—"}</p>
          <span className={cn("font-semibold", dog.neutered ? "text-green-600" : "text-gray-400")}>
            {dog.neutered ? "Castrado" : "Não castrado"}
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(dog)} title="Editar"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-forest-50 hover:text-forest-600 transition-colors">
            <Edit2 className="w-3.5 h-3.5"/>
          </button>
          <button onClick={() => {
            if (confirm(`Remover ${dog.name}?`)) { DogDB.delete(dog.id); store.toast("success",`${dog.name} removido.`); }
          }} title="Remover"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
        </div>
      </td>
    </tr>
  );
});

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabKey = "tutores" | "caes" | "integracoes";

export default function CrmPage() {
  const dogs   = useDB(() => DogDB.list());
  const tutors = useDB(() => TutorDB.list());
  const plans  = useDB(() => PlanDB.list());

  const [tab, setTab]           = useState<TabKey>("tutores");
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos"|"ativo"|"inadimplente"|"inativo">("todos");
  const [sortBy, setSortBy]     = useState<"name"|"ltv"|"createdAt">("name");
  const [sortAsc, setSortAsc]   = useState(true);
  const [editTutor, setEditTutor]   = useState<Tutor | null>(null);
  const [editDog, setEditDog]       = useState<DogType | null>(null);
  const [msgTutor, setMsgTutor]     = useState<Tutor | null>(null);
  const [chargeTutor, setChargeTutor] = useState<Tutor | null>(null);

  const openEdit    = useCallback((t: Tutor)   => setEditTutor(t),   []);
  const openMessage = useCallback((t: Tutor)   => setMsgTutor(t),    []);
  const openCharge  = useCallback((t: Tutor)   => setChargeTutor(t), []);
  const openEditDog = useCallback((d: DogType) => setEditDog(d),     []);

  const filteredTutors = useMemo(() => {
    let list = tutors
      .filter(t => statusFilter === "todos" || t.status === statusFilter)
      .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.cpf && t.cpf.includes(search)) ||
        t.email.toLowerCase().includes(search.toLowerCase()) ||
        t.whatsapp.includes(search));
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name")      cmp = a.name.localeCompare(b.name);
      else if (sortBy === "ltv")  cmp = a.ltv - b.ltv;
      else                        cmp = a.createdAt.localeCompare(b.createdAt);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [tutors, statusFilter, search, sortBy, sortAsc]);

  const filteredDogs = useMemo(() =>
    dogs.filter(d => !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.breed.toLowerCase().includes(search.toLowerCase()) ||
      tutors.find(t => t.id === d.tutorId)?.name.toLowerCase().includes(search.toLowerCase())
    ), [dogs, tutors, search]);

  const totalLtv    = useMemo(() => tutors.reduce((s, t) => s + t.ltv, 0), [tutors]);
  const activeCount = useMemo(() => tutors.filter(t => t.status === "ativo").length, [tutors]);
  const inadeCount  = useMemo(() => tutors.filter(t => t.status === "inadimplente").length, [tutors]);

  const SortHeader = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button onClick={() => { if (sortBy === col) setSortAsc(v => !v); else { setSortBy(col); setSortAsc(true); } }}
      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors">
      {label}
      {sortBy === col ? (sortAsc ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>) : null}
    </button>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Modals */}
      {editTutor   && <TutorEditModal tutor={editTutor}   onClose={() => setEditTutor(null)}/>}
      {editDog     && <DogEditModal   dog={editDog} tutors={tutors} onClose={() => setEditDog(null)}/>}
      {msgTutor    && <WhatsAppModal  phone={msgTutor.whatsapp || msgTutor.phone} name={msgTutor.name} onClose={() => setMsgTutor(null)}/>}
      {chargeTutor && <AsaasChargeModal tutor={chargeTutor} onClose={() => setChargeTutor(null)}/>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM de Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5 num-display">
            {tutors.length} tutores · {dogs.length} cães cadastrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<Plus className="w-4 h-4"/>} onClick={() => store.openModal("novo_tutor")}>
            Novo tutor
          </Button>
          <Button variant="outline" icon={<Plus className="w-4 h-4"/>} onClick={() => store.openModal("novo_cao")}>
            Novo cão
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tutores ativos"    value={activeCount}               icon={<Users className="w-4 h-4"/>}        color="green" trend={{ value: 8 }}/>
        <StatCard label="Inadimplentes"     value={inadeCount}                icon={<AlertTriangle className="w-4 h-4"/>} color="red"/>
        <StatCard label="LTV total"         value={formatCurrency(totalLtv,true)} icon={<TrendingUp className="w-4 h-4"/>} color="blue"/>
        <StatCard label="Cães cadastrados"  value={dogs.length}               icon={<Dog className="w-4 h-4"/>}          color="green"/>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs
          tabs={[
            { id:"tutores",     label:"Tutores",     count: filteredTutors.length },
            { id:"caes",        label:"Cães",        count: filteredDogs.length   },
            { id:"integracoes", label:"Integrações"                                },
          ]}
          active={tab}
          onChange={v => { setTab(v as TabKey); setSearch(""); }}
        />
        {tab !== "integracoes" && (
          <div className="flex items-center gap-2 flex-wrap">
            {tab === "tutores" && (
              <div className="flex items-center gap-1">
                {(["todos","ativo","inadimplente","inativo"] as const).map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className={cn("pill-tab", statusFilter === f && "active")}>
                    {f.charAt(0).toUpperCase()+f.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 w-56 bg-white"
                placeholder={tab === "tutores" ? "Buscar por nome, CPF, telefone..." : "Buscar por nome, raça, tutor..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {tab === "integracoes" ? (
        <TabIntegracoes/>
      ) : tab === "tutores" ? (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-4 text-left">
                    <SortHeader col="name" label="Tutor / CPF"/>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contato</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cães</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <SortHeader col="ltv" label="LTV"/>
                  </th>
                  <th className="py-3 px-4 w-28"/>
                </tr>
              </thead>
              <tbody>
                {filteredTutors.map(t => (
                  <TutorRow key={t.id} tutor={t} dogs={dogs}
                    onEdit={openEdit} onMessage={openMessage} onCharge={openCharge}/>
                ))}
              </tbody>
            </table>
            {filteredTutors.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
                <Users className="w-12 h-12 opacity-20"/>
                <p className="text-sm font-medium">
                  {tutors.length === 0 ? "Aguardando cadastro de tutores..." : "Nenhum tutor encontrado para essa busca"}
                </p>
              </div>
            )}
          </div>
          {filteredTutors.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">{filteredTutors.length} de {tutors.length} tutores</p>
              <p className="text-xs text-gray-400 num-display">
                LTV total filtrado: <span className="font-semibold text-gray-700">
                  {formatCurrency(filteredTutors.reduce((s,t) => s+t.ltv,0), true)}
                </span>
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cão / Raça</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tutor</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Porte / Peso</span>
                  </th>
                  <th className="py-3 px-4 text-left">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Idade</span>
                  </th>
                  <th className="py-3 px-4 w-20"/>
                </tr>
              </thead>
              <tbody>
                {filteredDogs.map(d => (
                  <DogRow key={d.id} dog={d} tutors={tutors} onEdit={openEditDog}/>
                ))}
              </tbody>
            </table>
            {filteredDogs.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
                <Dog className="w-12 h-12 opacity-20"/>
                <p className="text-sm font-medium">
                  {dogs.length === 0 ? "Aguardando cadastro de cães..." : "Nenhum cão encontrado para essa busca"}
                </p>
              </div>
            )}
          </div>
          {filteredDogs.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">{filteredDogs.length} de {dogs.length} cães</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
