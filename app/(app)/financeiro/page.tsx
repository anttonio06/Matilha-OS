"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle,
  Clock, ArrowUpRight, ArrowDownLeft, Filter, Download, Plus,
  CreditCard, Banknote, Smartphone, Search, X, Zap,
  RefreshCw, ExternalLink, Send, FileText,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { store } from "@/lib/store";
import { cn, formatCurrency, formatDate, percentage } from "@/lib/utils";
import { TransactionDB, TutorDB, useDB, KEYS } from "@/lib/db";
import { computeRevenueChartData } from "@/lib/services/metrics.service";
import { Badge, Button, Card, Input, Progress, StatCard, Tabs } from "@/components/ui";

// ─── Asaas helpers ────────────────────────────────────────────────────────────

function getAsaasConfig(): { apiKey: string; sandbox: boolean } {
  try {
    const s = localStorage.getItem("matilha:asaas:config");
    return s ? JSON.parse(s) : { apiKey: "", sandbox: true };
  } catch { return { apiKey: "", sandbox: true }; }
}

function getAsaasBase(sandbox: boolean) {
  return sandbox ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";
}

const CHARGES_KEY = "matilha:asaas:charges";

interface AsaasCharge {
  id: string;
  tutorId: string;
  tutorName: string;
  description: string;
  value: number;
  dueDate: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED" | "RECEIVED_IN_CASH";
  invoiceUrl?: string;
  pixQrCode?: string;
  asaasId?: string;
  createdAt: string;
}

function loadCharges(): AsaasCharge[] {
  try {
    const s = localStorage.getItem(CHARGES_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function saveCharges(charges: AsaasCharge[]) {
  localStorage.setItem(CHARGES_KEY, JSON.stringify(charges));
}

// ─── DRE Data ─────────────────────────────────────────────────────────────────

const dreData = [
  { category: "Creche",  revenue: 12100, pct: 53 },
  { category: "Hotel",   revenue: 3400,  pct: 15 },
  { category: "Escola",  revenue: 8390,  pct: 37 },
];

const totalRevenue = dreData.reduce((s, d) => s + d.revenue, 0);

// ─── Transaction Row ──────────────────────────────────────────────────────────

import type { Transaction } from "@/types";

function TxRow({ tx }: { tx: Transaction }) {
  const tutor = tx.tutorId ? TutorDB.get(tx.tutorId) : null;
  const isIncome = tx.type === "receita";
  const methodIcons: Record<string, React.ReactNode> = {
    pix:           <Smartphone className="w-3.5 h-3.5 text-forest-500" />,
    cartao_credito:<CreditCard className="w-3.5 h-3.5 text-blue-500" />,
    cartao_debito: <CreditCard className="w-3.5 h-3.5 text-indigo-500" />,
    dinheiro:      <Banknote className="w-3.5 h-3.5 text-green-500" />,
    plano:         <CreditCard className="w-3.5 h-3.5 text-purple-500" />,
  };

  const statusCfg = {
    pago:     { color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
    pendente: { color: "bg-amber-100 text-amber-700", icon: <Clock className="w-3 h-3" /> },
    atrasado: { color: "bg-red-100 text-red-700",     icon: <AlertTriangle className="w-3 h-3" /> },
    cancelado:{ color: "bg-gray-100 text-gray-600",   icon: <Clock className="w-3 h-3" /> },
  };
  const st = statusCfg[tx.status];

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
            isIncome ? "bg-green-100" : "bg-red-100"
          )}>
            {isIncome
              ? <ArrowDownLeft className="w-3.5 h-3.5 text-green-600" />
              : <ArrowUpRight  className="w-3.5 h-3.5 text-red-600" />}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{tx.description}</p>
            {tutor && <p className="text-xs text-gray-500">{tutor.name}</p>}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded capitalize">
          {tx.category.replace("_", " ")}
        </span>
      </td>
      <td className="px-5 py-3.5">
        {tx.method && (
          <div className="flex items-center gap-1.5">
            {methodIcons[tx.method]}
            <span className="text-xs text-gray-600 capitalize">{tx.method.replace("_", " ")}</span>
          </div>
        )}
      </td>
      <td className="px-5 py-3.5 text-xs text-gray-500 num-display">{formatDate(tx.dueDate)}</td>
      <td className="px-5 py-3.5">
        <div className={cn("badge text-2xs flex items-center gap-1 w-fit", st.color)}>
          {st.icon} {tx.status}
        </div>
      </td>
      <td className="px-5 py-3.5 text-right">
        <p className={cn(
          "text-sm font-bold num-display",
          isIncome ? "text-gray-900" : "text-red-600"
        )}>
          {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
        </p>
      </td>
    </tr>
  );
}

// ─── Nova Cobrança Modal ──────────────────────────────────────────────────────

interface NovaCobrancaModalProps {
  onClose: () => void;
  onCreated: (charge: AsaasCharge) => void;
}

function NovaCobrancaModal({ onClose, onCreated }: NovaCobrancaModalProps) {
  const tutors = TutorDB.list();
  const [tutorId, setTutorId]         = useState("");
  const [value, setValue]             = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate]         = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  });
  const [billingType, setBillingType] = useState<"PIX" | "BOLETO" | "CREDIT_CARD">("PIX");
  const [loading, setLoading]         = useState(false);

  const cfg = getAsaasConfig();
  const hasKey = !!cfg.apiKey;

  async function submit() {
    if (!tutorId || !value || !description || !dueDate) {
      store.toast("error", "Preencha todos os campos obrigatórios.");
      return;
    }
    const tutor = tutors.find(t => t.id === tutorId);
    if (!tutor) return;

    const numValue = parseFloat(value.replace(",", "."));
    if (isNaN(numValue) || numValue <= 0) {
      store.toast("error", "Valor inválido.");
      return;
    }

    setLoading(true);
    try {
      let asaasId: string | undefined;
      let invoiceUrl: string | undefined;
      let pixQrCode: string | undefined;

      if (hasKey) {
        const base = getAsaasBase(cfg.sandbox);
        const headers = { "Content-Type": "application/json", "access_token": cfg.apiKey };

        // Create or find customer
        const cpf = tutor.cpf?.replace(/\D/g, "") || "";
        let customerId: string | undefined;

        if (cpf) {
          const searchRes = await fetch(`${base}/customers?cpfCnpj=${cpf}`, { headers });
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.data?.length > 0) {
              customerId = searchData.data[0].id;
            }
          }
        }

        if (!customerId) {
          const createRes = await fetch(`${base}/customers`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              name: tutor.name,
              cpfCnpj: cpf || undefined,
              email: tutor.email || undefined,
              phone: tutor.phone?.replace(/\D/g, "") || undefined,
            }),
          });
          if (createRes.ok) {
            const cData = await createRes.json();
            customerId = cData.id;
          } else {
            throw new Error("Falha ao cadastrar cliente no Asaas.");
          }
        }

        // Create charge
        const payRes = await fetch(`${base}/payments`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            customer: customerId,
            billingType,
            value: numValue,
            dueDate,
            description,
          }),
        });
        if (!payRes.ok) throw new Error("Falha ao criar cobrança no Asaas.");
        const payData = await payRes.json();
        asaasId    = payData.id;
        invoiceUrl = payData.invoiceUrl;
        pixQrCode  = payData.pixQrCodeImage;
      }

      const charge: AsaasCharge = {
        id: `ch_${Date.now()}`,
        tutorId,
        tutorName: tutor.name,
        description,
        value: numValue,
        dueDate,
        billingType,
        status: "PENDING",
        invoiceUrl,
        pixQrCode,
        asaasId,
        createdAt: new Date().toISOString(),
      };

      const existing = loadCharges();
      saveCharges([charge, ...existing]);
      onCreated(charge);
      store.toast("success", hasKey ? "Cobrança criada no Asaas!" : "Cobrança registrada localmente (sem API key).");
      onClose();
    } catch (err: unknown) {
      store.toast("error", err instanceof Error ? err.message : "Erro ao criar cobrança.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Nova Cobrança</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!hasKey && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              API Asaas não configurada. A cobrança será registrada apenas localmente.{" "}
              <a href="/crm" className="font-semibold underline">Configurar em CRM → Integrações</a>
            </p>
          </div>
        )}

        <div className="px-6 py-5 space-y-4">
          {/* Tutor */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cliente (tutor) *</label>
            <select
              value={tutorId}
              onChange={e => setTutorId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400"
            >
              <option value="">Selecione um tutor...</option>
              {tutors.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descrição *</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="ex: Mensalidade Escola — Julho/2024"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400"
            />
          </div>

          {/* Value + Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Valor (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vencimento *</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400"
              />
            </div>
          </div>

          {/* Billing type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Forma de pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {(["PIX", "BOLETO", "CREDIT_CARD"] as const).map((bt) => {
                const labels: Record<string, string> = { PIX: "PIX", BOLETO: "Boleto", CREDIT_CARD: "Cartão" };
                const icons: Record<string, React.ReactNode> = {
                  PIX: <Smartphone className="w-4 h-4" />,
                  BOLETO: <FileText className="w-4 h-4" />,
                  CREDIT_CARD: <CreditCard className="w-4 h-4" />,
                };
                return (
                  <button
                    key={bt}
                    onClick={() => setBillingType(bt)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-all",
                      billingType === bt
                        ? "border-forest-500 bg-forest-50 text-forest-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {icons[bt]}
                    {labels[bt]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button
            size="sm"
            icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar cobrança"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Charge status config ─────────────────────────────────────────────────────

const CHARGE_STATUS: Record<AsaasCharge["status"], { label: string; color: string }> = {
  PENDING:          { label: "Pendente",   color: "bg-amber-100 text-amber-700" },
  RECEIVED:         { label: "Recebido",   color: "bg-green-100 text-green-700" },
  CONFIRMED:        { label: "Confirmado", color: "bg-green-100 text-green-700" },
  OVERDUE:          { label: "Vencido",    color: "bg-red-100 text-red-700"     },
  REFUNDED:         { label: "Estornado",  color: "bg-gray-100 text-gray-600"   },
  RECEIVED_IN_CASH: { label: "Recebido",   color: "bg-green-100 text-green-700" },
};

// ─── Cobranças Tab ────────────────────────────────────────────────────────────

function TabCobracas() {
  const [charges, setCharges]       = useState<AsaasCharge[]>([]);
  const [showModal, setShowModal]   = useState(false);
  const [search, setSearch]         = useState("");
  const cfg = getAsaasConfig();

  useEffect(() => {
    setCharges(loadCharges());
  }, []);

  const filtered = charges.filter(c =>
    !search ||
    c.tutorName.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending  = charges.filter(c => c.status === "PENDING").reduce((s, c) => s + c.value, 0);
  const totalReceived = charges.filter(c => ["RECEIVED","CONFIRMED","RECEIVED_IN_CASH"].includes(c.status)).reduce((s, c) => s + c.value, 0);
  const totalOverdue  = charges.filter(c => c.status === "OVERDUE").reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-5">
      {/* API status banner */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border text-sm",
        cfg.apiKey
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-amber-50 border-amber-200 text-amber-800"
      )}>
        {cfg.apiKey
          ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
          : <Zap className="w-4 h-4 flex-shrink-0" />}
        <span className="flex-1">
          {cfg.apiKey
            ? `Asaas conectado${cfg.sandbox ? " (modo sandbox)" : " (produção)"}`
            : "API Asaas não configurada — cobranças serão registradas localmente apenas."}
        </span>
        {!cfg.apiKey && (
          <a href="/crm" className="flex items-center gap-1 text-xs font-semibold underline">
            Configurar <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pendente</p>
          <p className="text-xl font-bold text-amber-600 num-display">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{charges.filter(c => c.status === "PENDING").length} cobranças</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recebido</p>
          <p className="text-xl font-bold text-green-600 num-display">{formatCurrency(totalReceived)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{charges.filter(c => ["RECEIVED","CONFIRMED","RECEIVED_IN_CASH"].includes(c.status)).length} cobranças</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Vencido</p>
          <p className="text-xl font-bold text-red-600 num-display">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{charges.filter(c => c.status === "OVERDUE").length} cobranças</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Input
          icon={<Search className="w-3.5 h-3.5" />}
          placeholder="Buscar cobrança ou tutor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Nova Cobrança
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Send className="w-10 h-10 opacity-20 mb-3" />
          <p className="text-sm font-medium">Nenhuma cobrança ainda</p>
          <p className="text-xs mt-1">Crie a primeira cobrança para seus clientes</p>
          <Button className="mt-4" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowModal(true)}>
            Criar primeira cobrança
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["Tutor / Descrição", "Forma", "Vencimento", "Status", "Valor", "Ações"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((charge) => {
                const st = CHARGE_STATUS[charge.status];
                const btLabel: Record<string, string> = { PIX: "PIX", BOLETO: "Boleto", CREDIT_CARD: "Cartão" };
                const btIcon: Record<string, React.ReactNode> = {
                  PIX: <Smartphone className="w-3.5 h-3.5 text-forest-500" />,
                  BOLETO: <FileText className="w-3.5 h-3.5 text-amber-500" />,
                  CREDIT_CARD: <CreditCard className="w-3.5 h-3.5 text-blue-500" />,
                };
                return (
                  <tr key={charge.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{charge.tutorName}</p>
                      <p className="text-xs text-gray-500">{charge.description}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {btIcon[charge.billingType]}
                        <span className="text-xs text-gray-600">{btLabel[charge.billingType]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 num-display">{formatDate(charge.dueDate)}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-2xs font-semibold px-2 py-0.5 rounded-full", st.color)}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-gray-900 num-display">{formatCurrency(charge.value)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {charge.invoiceUrl && (
                          <a href={charge.invoiceUrl} target="_blank" rel="noreferrer"
                            className="text-2xs font-medium text-forest-600 hover:text-forest-800 flex items-center gap-0.5">
                            Ver fatura <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {!charge.invoiceUrl && charge.status === "PENDING" && (
                          <span className="text-2xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-gray-700">Total</td>
                <td className="px-5 py-3 text-sm font-bold text-forest-700 num-display">
                  {formatCurrency(filtered.reduce((s, c) => s + c.value, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {showModal && (
        <NovaCobrancaModal
          onClose={() => setShowModal(false)}
          onCreated={(c) => setCharges(prev => [c, ...prev])}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const transactions     = useDB(() => TransactionDB.list(), KEYS.transactions);
  const revenueChartData = computeRevenueChartData();
  const [tab, setTab] = useState<"visao_geral" | "transacoes" | "dre" | "cobracas">("visao_geral");
  const [search, setSearch] = useState("");

  const totalPaid    = transactions.filter(t => t.status === "pago").reduce((s, t) => s + t.amount, 0);
  const totalPending = transactions.filter(t => t.status === "pendente").reduce((s, t) => s + t.amount, 0);
  const totalOverdue = transactions.filter(t => t.status === "atrasado").reduce((s, t) => s + t.amount, 0);

  const filteredTx = transactions.filter(tx =>
    !search || tx.description.toLowerCase().includes(search.toLowerCase())
  );

  const ticketData = [
    { name: "Hotel",  value: 480 },
    { name: "Escola", value: 360 },
    { name: "Creche", value: 90  },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão operacional · Julho 2024</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Download className="w-4 h-4" />} size="sm"
            onClick={() => store.toast("success", "Exportação iniciada.")}>
            Exportar
          </Button>
          <Button variant="outline" icon={<Filter className="w-4 h-4" />} size="sm">Filtrar</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => store.openModal("novo_lancamento")}>
            Lançamento
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Faturamento mês" value={formatCurrency(totalRevenue, true)}
          icon={<TrendingUp className="w-4 h-4" />} color="green"
          sub={`Meta: ${formatCurrency(25000, true)}`} trend={{ value: 14 }}
        />
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Meta do mês</p>
            <BarChart3 className="w-4 h-4 text-forest-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 num-display leading-none">{formatCurrency(totalRevenue, true)}</p>
          <Progress value={totalRevenue} max={25000} color="green" showLabel />
          <p className="text-xs text-gray-500">{percentage(totalRevenue, 25000)}% da meta atingida</p>
        </Card>
        <StatCard
          label="Recebido" value={formatCurrency(totalPaid, true)}
          icon={<CheckCircle className="w-4 h-4" />} color="green"
        />
        <StatCard
          label="Inadimplência" value={formatCurrency(totalOverdue + totalPending, true)}
          icon={<AlertTriangle className="w-4 h-4" />} color="red"
          sub={`${transactions.filter(t => t.status === "atrasado" || t.status === "pendente").length} cobranças`}
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "visao_geral", label: "Visão Geral" },
          { id: "transacoes",  label: "Transações", count: transactions.length },
          { id: "dre",         label: "DRE Simplificada" },
          { id: "cobracas",    label: "Cobranças Asaas" },
        ]}
        active={tab} onChange={(v) => setTab(v as typeof tab)}
      />

      {/* Content */}
      {tab === "visao_geral" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue trend */}
          <Card className="xl:col-span-2" padding="none">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Receita mensal</h3>
              <p className="text-xs text-gray-500 mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="px-5 py-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueChartData.map(d => ({ ...d, total: d.receita }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => formatCurrency(v, true)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="creche" fill="#2d7a50" radius={[2, 2, 0, 0]} stackId="a" />
                  <Bar dataKey="hotel"  fill="#d97706" radius={[0, 0, 0, 0]} stackId="a" />
                  <Bar dataKey="escola" fill="#7c3aed" radius={[2, 2, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Ticket médio por operação */}
          <Card padding="none">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Ticket médio</h3>
              <p className="text-xs text-gray-500 mt-0.5">Por operação / julho</p>
            </div>
            <div className="p-5 space-y-4">
              {ticketData.map((item) => {
                const max = ticketData[0].value;
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="text-sm font-bold text-gray-900 num-display">{formatCurrency(item.value)}</span>
                    </div>
                    <Progress value={item.value} max={max} size="sm" color="green" />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Pending payments */}
          <Card padding="none">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Cobranças pendentes</h3>
              <Badge variant="amber" size="sm">{transactions.filter(t => t.status !== "pago" && t.status !== "cancelado").length}</Badge>
            </div>
            <div className="divide-y divide-gray-50">
              {transactions.filter(t => t.status !== "pago" && t.status !== "cancelado").map((tx) => {
                const tutor = tx.tutorId ? TutorDB.get(tx.tutorId) : null;
                return (
                  <div key={tx.id} className="px-5 py-3 flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", tx.status === "atrasado" ? "bg-red-500" : "bg-amber-500")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-500">{tutor?.name ?? ""} · Venc. {formatDate(tx.dueDate)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900 num-display">{formatCurrency(tx.amount)}</p>
                      <span className={cn("text-2xs font-semibold", tx.status === "atrasado" ? "text-red-600" : "text-amber-600")}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Methods breakdown */}
          <Card padding="none" className="xl:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Formas de pagamento</h3>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "PIX",            icon: <Smartphone className="w-5 h-5" />, value: 2930, color: "text-forest-600 bg-forest-50" },
                { label: "Cartão Crédito", icon: <CreditCard className="w-5 h-5" />,  value: 1570, color: "text-blue-600 bg-blue-50" },
                { label: "Cartão Débito",  icon: <CreditCard className="w-5 h-5" />,  value: 720,  color: "text-indigo-600 bg-indigo-50" },
                { label: "Dinheiro",       icon: <Banknote className="w-5 h-5" />,    value: 90,   color: "text-green-600 bg-green-50" },
              ].map(({ label, icon, value, color }) => (
                <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 text-center">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", color)}>{icon}</div>
                  <p className="text-xs font-medium text-gray-600">{label}</p>
                  <p className="text-base font-bold text-gray-900 num-display">{formatCurrency(value, true)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "transacoes" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <Input icon={<Search className="w-3.5 h-3.5" />}
              placeholder="Buscar transação..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="w-64" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Descrição", "Categoria", "Método", "Vencimento", "Status", "Valor"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx) => <TxRow key={tx.id} tx={tx} />)}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-gray-700">Total do período</td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-forest-700 num-display">
                    {formatCurrency(filteredTx.filter(t => t.type === "receita").reduce((s, t) => s + t.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {tab === "dre" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card padding="none">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">DRE por centro de receita</h3>
              <p className="text-xs text-gray-500 mt-0.5">Julho 2024</p>
            </div>
            <div className="divide-y divide-gray-50">
              {dreData.map((item) => (
                <div key={item.category} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-800">{item.category}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{item.pct}%</span>
                      <span className="text-sm font-bold text-gray-900 num-display">{formatCurrency(item.revenue, true)}</span>
                    </div>
                  </div>
                  <Progress value={item.revenue} max={totalRevenue} size="sm" color="green" />
                </div>
              ))}
              <div className="px-5 py-4 bg-gray-50 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Total</p>
                <p className="text-lg font-bold text-forest-700 num-display">{formatCurrency(totalRevenue, true)}</p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {[
              { label: "Receita Bruta",         value: totalRevenue,                                                        positive: true  },
              { label: "(-) Comissões (8%)",     value: totalRevenue * 0.08,                                                positive: false },
              { label: "(-) Insumos (5%)",       value: totalRevenue * 0.05,                                                positive: false },
              { label: "(-) Despesas fixas",     value: 4800,                                                               positive: false },
              { label: "Resultado operacional",  value: totalRevenue - totalRevenue * 0.08 - totalRevenue * 0.05 - 4800,   positive: true, bold: true },
            ].map(({ label, value, positive, bold }) => (
              <div key={label} className={cn(
                "flex items-center justify-between p-4 rounded-lg",
                bold ? "bg-forest-50 border border-forest-200" : "bg-gray-50 border border-gray-100"
              )}>
                <p className={cn("text-sm", bold ? "font-bold text-forest-800" : "text-gray-700")}>{label}</p>
                <p className={cn(
                  "text-sm font-bold num-display",
                  bold ? "text-forest-700" : positive ? "text-gray-900" : "text-red-600"
                )}>
                  {positive ? "" : "-"}{formatCurrency(Math.abs(value), true)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "cobracas" && <TabCobracas />}
    </div>
  );
}
