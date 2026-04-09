"use client";

import React, { useState } from "react";
import {
  Plug, CheckCircle, AlertTriangle, Eye, EyeOff,
  Save, RefreshCw, ExternalLink, Copy, MessageCircle,
  CreditCard, Key, Send, Webhook, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { store } from "@/lib/store";
import { Button, Card } from "@/components/ui";

// ─── localStorage helpers ─────────────────────────────────────────────────────

function getAsaasConfig(): { apiKey: string; sandbox: boolean } {
  try {
    const s = localStorage.getItem("matilha:asaas:config");
    return s ? JSON.parse(s) : { apiKey: "", sandbox: true };
  } catch { return { apiKey: "", sandbox: true }; }
}
function saveAsaasConfig(cfg: { apiKey: string; sandbox: boolean }) {
  localStorage.setItem("matilha:asaas:config", JSON.stringify(cfg));
}

function getWAConfig(): { token: string; phoneId: string } {
  try {
    const s = localStorage.getItem("matilha:wa:config");
    return s ? JSON.parse(s) : { token: "", phoneId: "" };
  } catch { return { token: "", phoneId: "" }; }
}
function saveWAConfig(cfg: { token: string; phoneId: string }) {
  localStorage.setItem("matilha:wa:config", JSON.stringify(cfg));
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400 bg-white";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
      ok ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
    )}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {ok ? label : "Não configurado"}
    </span>
  );
}

function HowToBox({ color, steps }: { color: string; steps: string[] }) {
  const cfg: Record<string, string> = {
    blue:   "bg-blue-50 border-blue-100 text-blue-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    green:  "bg-green-50 border-green-100 text-green-700",
  };
  return (
    <div className={cn("p-3 rounded-lg border text-xs", cfg[color] ?? cfg.blue)}>
      <p className="font-semibold mb-1.5">Como configurar:</p>
      <ol className="space-y-0.5 list-decimal list-inside">
        {steps.map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s }} />)}
      </ol>
    </div>
  );
}

// ─── Asaas Card ───────────────────────────────────────────────────────────────

function AsaasCard() {
  const [cfg, setCfg]       = useState(getAsaasConfig);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving]   = useState(false);

  function save() {
    setSaving(true);
    saveAsaasConfig(cfg);
    setTimeout(() => setSaving(false), 600);
    store.toast("success", "Configuração do Asaas salva!");
  }

  return (
    <Card className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Asaas — Cobranças</h3>
            <p className="text-xs text-gray-500">Geração de PIX, boleto e cartão</p>
          </div>
        </div>
        <StatusBadge ok={!!cfg.apiKey} label="Conectado" />
      </div>

      {/* How to */}
      <HowToBox color="purple" steps={[
        "Acesse sua conta em <strong>asaas.com</strong>",
        "Vá em <strong>Configurações → Integrações → API</strong>",
        "Copie sua <strong>API Key</strong> e cole abaixo",
        "Use Sandbox para testes antes do ambiente real",
      ]} />

      {/* Environment toggle */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-600">Ambiente:</span>
        <div className="flex gap-2">
          {[{ v: true, l: "Sandbox (testes)" }, { v: false, l: "Produção" }].map(({ v, l }) => (
            <button
              key={String(v)}
              onClick={() => setCfg(c => ({ ...c, sandbox: v }))}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg border font-medium transition-all",
                cfg.sandbox === v
                  ? "border-forest-500 bg-forest-50 text-forest-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <Field label="API Key" hint="Começa com $aact_... — mantenha em sigilo">
        <div className="relative">
          <input
            className={cn(inputCls, "pr-10")}
            type={showKey ? "text" : "password"}
            placeholder="$aact_YourKeyHere"
            value={cfg.apiKey}
            onChange={e => setCfg(c => ({ ...c, apiKey: e.target.value }))}
          />
          <button
            onClick={() => setShowKey(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <a
          href="https://www.asaas.com/login"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-forest-600 hover:text-forest-800 flex items-center gap-1 font-medium"
        >
          Acessar painel Asaas <ExternalLink className="w-3 h-3" />
        </a>
        <Button
          size="sm"
          icon={saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          onClick={save}
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Card>
  );
}

// ─── WhatsApp Card ────────────────────────────────────────────────────────────

function WhatsAppCard() {
  const [cfg, setCfg]         = useState(getWAConfig);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving]     = useState(false);
  const isOk = !!(cfg.token && cfg.phoneId);

  function save() {
    setSaving(true);
    saveWAConfig(cfg);
    setTimeout(() => setSaving(false), 600);
    store.toast("success", "Configuração do WhatsApp salva!");
  }

  return (
    <Card className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">WhatsApp Business API</h3>
            <p className="text-xs text-gray-500">Envio de mensagens via Meta Cloud</p>
          </div>
        </div>
        <StatusBadge ok={isOk} label="Conectado" />
      </div>

      {/* How to */}
      <HowToBox color="blue" steps={[
        "Crie um app no <strong>Meta for Developers</strong>",
        "Adicione o produto <strong>WhatsApp Business</strong>",
        "Copie o <strong>Phone Number ID</strong> e o <strong>Token de Acesso</strong>",
        "Cole abaixo e salve · Sem configuração, o sistema abrirá o WhatsApp Web",
      ]} />

      {/* Fields */}
      <Field label="Phone Number ID">
        <input
          className={inputCls}
          placeholder="Ex: 123456789012345"
          value={cfg.phoneId}
          onChange={e => setCfg(c => ({ ...c, phoneId: e.target.value }))}
        />
      </Field>

      <Field label="Token de Acesso (Bearer)" hint="Começa com EAA... — mantenha em sigilo">
        <div className="relative">
          <input
            className={cn(inputCls, "pr-10")}
            type={showToken ? "text" : "password"}
            placeholder="EAAxxxxxxxx..."
            value={cfg.token}
            onChange={e => setCfg(c => ({ ...c, token: e.target.value }))}
          />
          <button
            onClick={() => setShowToken(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <a
          href="https://developers.facebook.com"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-forest-600 hover:text-forest-800 flex items-center gap-1 font-medium"
        >
          Meta for Developers <ExternalLink className="w-3 h-3" />
        </a>
        <Button
          size="sm"
          icon={saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          onClick={save}
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Card>
  );
}

// ─── WA Templates Card ────────────────────────────────────────────────────────

const WA_TEMPLATES = [
  { label: "Confirmação de agendamento", msg: "Olá! Confirmamos o agendamento do(a) {nome_cao} para {data} às {hora}. 🐾" },
  { label: "Lembrete de vacina",         msg: "Olá {tutor}! A vacina do(a) {nome_cao} vence em {data}. Agende com seu vet! 💉" },
  { label: "Cobrança pendente",          msg: "Olá {tutor}! Identificamos uma cobrança em aberto. Entre em contato. 🙏" },
  { label: "Boas-vindas",               msg: "Seja bem-vindo(a) à Matilha! Estamos felizes em ter o {nome_cao} na nossa família. 🐶❤️" },
];

function TemplatesCard() {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
          <Send className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Templates de Mensagem</h3>
          <p className="text-xs text-gray-500">Modelos prontos para WhatsApp</p>
        </div>
      </div>
      <div className="space-y-2">
        {WA_TEMPLATES.map(({ label, msg }) => (
          <div key={label} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg group">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700">{label}</p>
              <p className="text-xs text-gray-500 truncate">{msg}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(msg); store.toast("success", "Copiado!"); }}
              className="p-1.5 rounded text-gray-400 hover:text-forest-600 hover:bg-forest-50 transition-colors flex-shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Variáveis disponíveis: <code className="bg-gray-100 px-1 rounded">{"{tutor}"}</code>{" "}
        <code className="bg-gray-100 px-1 rounded">{"{nome_cao}"}</code>{" "}
        <code className="bg-gray-100 px-1 rounded">{"{data}"}</code>{" "}
        <code className="bg-gray-100 px-1 rounded">{"{hora}"}</code>
      </p>
    </Card>
  );
}

// ─── Webhooks placeholder ────────────────────────────────────────────────────

function WebhooksCard() {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
          <Webhook className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Webhooks</h3>
          <p className="text-xs text-gray-500">Notificações automáticas para sistemas externos</p>
        </div>
        <span className="ml-auto text-2xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Em breve</span>
      </div>
      <div className="flex flex-col items-center justify-center py-8 text-gray-300">
        <Globe className="w-10 h-10 mb-3" />
        <p className="text-sm font-medium text-gray-400">Webhooks personalizados</p>
        <p className="text-xs text-gray-400 mt-1 text-center max-w-xs">
          Configure endpoints para receber eventos como novos check-ins, pagamentos confirmados e alertas de vacina.
        </p>
      </div>
    </Card>
  );
}

// ─── Generic API placeholder ──────────────────────────────────────────────────

function CustomApiCard() {
  const [name, setName]   = useState("");
  const [url, setUrl]     = useState("");
  const [token, setToken] = useState("");

  function save() {
    if (!name || !url) { store.toast("error", "Nome e URL são obrigatórios."); return; }
    const existing = JSON.parse(localStorage.getItem("matilha:custom:apis") || "[]");
    existing.push({ id: Date.now(), name, url, token, createdAt: new Date().toISOString() });
    localStorage.setItem("matilha:custom:apis", JSON.stringify(existing));
    store.toast("success", `Integração "${name}" salva!`);
    setName(""); setUrl(""); setToken("");
  }

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-forest-100 flex items-center justify-center">
          <Key className="w-5 h-5 text-forest-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">API Personalizada</h3>
          <p className="text-xs text-gray-500">Adicione qualquer integração via API Key</p>
        </div>
      </div>
      <Field label="Nome da integração">
        <input className={inputCls} placeholder="Ex: ERP Interno, Petshop Manager..." value={name} onChange={e => setName(e.target.value)} />
      </Field>
      <Field label="URL da API">
        <input className={inputCls} placeholder="https://api.exemplo.com/v1" value={url} onChange={e => setUrl(e.target.value)} />
      </Field>
      <Field label="Token / API Key" hint="Armazenado apenas no seu navegador (localStorage)">
        <input className={inputCls} type="password" placeholder="sk_..." value={token} onChange={e => setToken(e.target.value)} />
      </Field>
      <div className="flex justify-end pt-1">
        <Button size="sm" icon={<Save className="w-3.5 h-3.5" />} onClick={save}>
          Salvar integração
        </Button>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegracoesPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center">
          <Plug className="w-5 h-5 text-forest-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie as APIs e conexões externas do sistema</p>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
        As credenciais são salvas localmente no seu navegador (localStorage) e nunca enviadas ao servidor.
        Mantenha-as em sigilo e não compartilhe este dispositivo com pessoas não autorizadas.
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AsaasCard />
        <WhatsAppCard />
        <TemplatesCard />
        <WebhooksCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomApiCard />
      </div>
    </div>
  );
}
