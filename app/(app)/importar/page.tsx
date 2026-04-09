"use client";

import React, { useState, useRef } from "react";
import {
  Upload, FileSpreadsheet, FileText, Download, CheckCircle,
  AlertTriangle, Trash2, RefreshCw, Database, ArrowRight,
} from "lucide-react";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { BulkImport, DogDB, TutorDB, AppointmentDB, PlanDB, TransactionDB, ProductDB } from "@/lib/db";
import { parseExcel, parseCSV, Reports } from "@/lib/export";
import { useDB } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportTarget = "tutors" | "dogs" | "appointments" | "plans" | "transactions" | "products";

interface ImportResult { success: number; errors: string[]; }

// ─── Template downloads ───────────────────────────────────────────────────────

async function downloadTemplate(target: ImportTarget) {
  const { exportToExcel } = await import("@/lib/export");
  const templates: Record<ImportTarget, Record<string, string>[]> = {
    tutors:  [{ nome:"João Silva", email:"joao@exemplo.com", telefone:"(11)99999-9999", whatsapp:"(11)99999-9999", status:"ativo", origem:"Instagram", contato_preferencial:"whatsapp" }],
    dogs:    [{ nome:"Thor", raca:"Golden Retriever", sexo:"macho", porte:"grande", peso:"32", castrado:"sim", data_nascimento:"2021-03-15", energia:"alta", sociabilidade:"sociavel", id_tutor:"" }],
    appointments: [{ data:"2026-04-08", horario:"09:00", id_cao:"", id_tutor:"", servico:"creche", status:"agendado", valor:"" }],
    plans:   [{ nome:"Plano Creche", categoria:"creche", usos_total:"12", valor:"490", vigencia_inicio:"2026-04-01", vigencia_fim:"2026-04-30", recorrente:"sim", id_cao:"", id_tutor:"" }],
    transactions: [{ tipo:"receita", descricao:"Plano Creche — João", categoria:"creche", valor:"490", status:"pendente", metodo:"pix", vencimento:"2026-04-10" }],
    products:[{ nome:"Mordedor de Couro", categoria:"mordedor", preco:"35.90", estoque:"10", unidade:"un", sku:"PROD-001" }],
  };
  await exportToExcel(templates[target], `Template_${target}`);
  store.toast("success", "Template baixado! Preencha e importe.");
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>, target: ImportTarget): Record<string, unknown> {
  const s = (k: string) => String(row[k] ?? "").trim();
  const n = (k: string) => Number(String(row[k] ?? "0").replace(",", ".")) || 0;
  const b = (k: string) => ["sim","yes","true","1"].includes(s(k).toLowerCase());

  switch (target) {
    case "tutors": return {
      name: s("nome") || s("name"),
      email: s("email"),
      phone: s("telefone") || s("phone"),
      whatsapp: s("whatsapp") || s("telefone"),
      status: (s("status") || "ativo") as "ativo"|"inativo"|"inadimplente",
      source: s("origem") || s("source") || "",
      preferredContact: (s("contato_preferencial") || "whatsapp") as "whatsapp"|"email"|"phone",
      notes: s("observacoes") || s("notes") || "",
      dogs: [], activePlans: [], totalSpent: 0, ltv: 0,
    };
    case "dogs": return {
      name: s("nome") || s("name"),
      breed: s("raca") || s("breed") || "",
      sex: (s("sexo") === "femea" || s("sexo") === "female" ? "femea" : "macho") as "macho"|"femea",
      size: (s("porte") || s("size") || "medio") as "mini"|"pequeno"|"medio"|"grande"|"gigante",
      weight: n("peso") || n("weight"),
      neutered: b("castrado") || b("neutered"),
      birthDate: s("data_nascimento") || s("birthDate") || "",
      tutorId: s("id_tutor") || s("tutorId") || "",
      energyLevel: (s("energia") || s("energyLevel") || "moderada") as "baixa"|"moderada"|"alta"|"muito_alta",
      socialLevel: (s("sociabilidade") || s("socialLevel") || "sociavel") as "reservado"|"seletivo"|"sociavel"|"muito_sociavel",
      foodBrand: s("racao") || s("foodBrand") || "",
      foodAmount: s("quantidade_racao") || s("foodAmount") || "",
      vaccines: [], tags: [],
    };
    case "transactions": return {
      type: (s("tipo") === "despesa" ? "despesa" : "receita") as "receita"|"despesa",
      description: s("descricao") || s("description"),
      category: (s("categoria") || "outros") as "creche"|"banho"|"hotel"|"escola"|"produto"|"outros",
      amount: n("valor") || n("amount"),
      status: (s("status") || "pendente") as "pago"|"pendente"|"atrasado"|"cancelado",
      method: (s("metodo") || s("method") || "pix") as "pix"|"cartao_credito"|"cartao_debito"|"dinheiro"|"plano",
      dueDate: s("vencimento") || s("dueDate") || new Date().toISOString().split("T")[0],
    };
    case "products": return {
      name: s("nome") || s("name"),
      category: (s("categoria") || "outro") as "petisco"|"mordedor"|"enriquecimento"|"higiene"|"acessorio"|"suplemento"|"outro",
      price: n("preco") || n("price"),
      stock: n("estoque") || n("stock"),
      unit: s("unidade") || s("unit") || "un",
      sku: s("sku") || undefined,
      active: true,
    };
    default: return row;
  }
}

// ─── Import executor ──────────────────────────────────────────────────────────

async function executeImport(rows: Record<string, unknown>[], target: ImportTarget): Promise<ImportResult> {
  const errors: string[] = [];
  const mapped = rows.map((r, i) => {
    try { return mapRow(r, target); }
    catch (e) { errors.push(`Linha ${i + 2}: ${String(e)}`); return null; }
  }).filter(Boolean) as Record<string, unknown>[];

  switch (target) {
    case "tutors":       BulkImport.tutors(mapped as never[]); break;
    case "dogs":         BulkImport.dogs(mapped as never[]); break;
    case "transactions": BulkImport.transactions(mapped as never[]); break;
    case "products":     BulkImport.products(mapped as never[]); break;
    default:
      errors.push(`Importação de "${target}" via arquivo ainda não suportada. Use os formulários.`);
  }

  return { success: mapped.length - errors.length, errors };
}

// ─── Target config ────────────────────────────────────────────────────────────

const TARGETS: { id: ImportTarget; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { id:"tutors",       label:"Tutores",       icon:<Database className="w-5 h-5"/>,       color:"bg-blue-50 border-blue-200 text-blue-700",   desc:"Responsáveis pelos cães" },
  { id:"dogs",         label:"Cães",          icon:<Database className="w-5 h-5"/>,       color:"bg-forest-50 border-forest-200 text-forest-700", desc:"Perfis dos animais" },
  { id:"transactions", label:"Financeiro",    icon:<FileSpreadsheet className="w-5 h-5"/>,color:"bg-green-50 border-green-200 text-green-700", desc:"Receitas e despesas" },
  { id:"products",     label:"Produtos",      icon:<FileSpreadsheet className="w-5 h-5"/>,color:"bg-orange-50 border-orange-200 text-orange-700",desc:"Catálogo da loja" },
  { id:"appointments", label:"Agendamentos",  icon:<FileSpreadsheet className="w-5 h-5"/>,color:"bg-purple-50 border-purple-200 text-purple-700",desc:"Histórico de atendimentos" },
  { id:"plans",        label:"Planos",        icon:<FileSpreadsheet className="w-5 h-5"/>,color:"bg-amber-50 border-amber-200 text-amber-700", desc:"Assinaturas e pacotes" },
];

// ─── Export section ───────────────────────────────────────────────────────────

function ExportSection() {
  const dogs         = useDB(() => DogDB.list());
  const tutors       = useDB(() => TutorDB.list());
  const appointments = useDB(() => AppointmentDB.list());
  const plans        = useDB(() => PlanDB.list());
  const transactions = useDB(() => TransactionDB.list());
  const products     = useDB(() => ProductDB.list());

  const dogMap   = Object.fromEntries(dogs.map(d => [d.id, d.name]));
  const tutorMap = Object.fromEntries(tutors.map(t => [t.id, t.name]));

  const exportItems = [
    { label:"Cães",          count:dogs.length,         fn:(fmt:"excel"|"pdf") => Reports.dogs(dogs, tutorMap, fmt) },
    { label:"Tutores",       count:tutors.length,       fn:(fmt:"excel"|"pdf") => Reports.tutors(tutors, fmt) },
    { label:"Agendamentos",  count:appointments.length, fn:(fmt:"excel"|"pdf") => Reports.appointments(appointments, tutorMap, dogMap, fmt) },
    { label:"Planos",        count:plans.length,        fn:(fmt:"excel"|"pdf") => Reports.plans(plans, fmt) },
    { label:"Financeiro",    count:transactions.length, fn:(fmt:"excel"|"pdf") => Reports.financial(transactions, fmt) },
    { label:"Produtos",      count:products.length,     fn:(fmt:"excel"|"pdf") => Reports.products(products, fmt) },
  ];

  const handleBackup = async () => {
    await Reports.fullBackup(dogs, tutors, appointments, plans, transactions, products);
    store.toast("success", "Backup completo exportado!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Exportar dados</h2>
          <p className="text-sm text-gray-500 mt-0.5">Baixe seus dados em Excel ou PDF</p>
        </div>
        <Button variant="outline" icon={<Download className="w-4 h-4"/>} onClick={handleBackup}>
          Backup completo (Excel)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {exportItems.map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">{item.label}</h3>
              <span className="text-xs font-bold text-gray-400 num-display">{item.count} registros</span>
            </div>
            {item.count === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhum dado cadastrado.</p>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { item.fn("excel"); store.toast("success", `${item.label} exportado em Excel!`); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5"/> Excel
                </button>
                <button
                  onClick={() => { item.fn("pdf"); store.toast("success", `${item.label} exportado em PDF!`); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5"/> PDF
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reset section ────────────────────────────────────────────────────────────

function ResetSection() {
  const [confirming, setConfirming] = useState(false);
  const handleReset = () => {
    BulkImport.reset();
    setConfirming(false);
    store.toast("success", "Todos os dados foram apagados. Sistema limpo para novo cadastro.");
  };
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"/>
        <div className="flex-1">
          <h3 className="font-semibold text-red-800">Limpar todos os dados</h3>
          <p className="text-sm text-red-600 mt-1">
            Remove todos os registros do banco local. Use antes de importar dados reais de outro sistema.
            Esta ação não pode ser desfeita.
          </p>
          {!confirming ? (
            <button onClick={() => setConfirming(true)} className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4"/> Limpar tudo
            </button>
          ) : (
            <div className="mt-3 flex items-center gap-3">
              <p className="text-sm font-semibold text-red-700">Tem certeza?</p>
              <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm font-bold hover:bg-red-800 transition-colors">Sim, limpar</button>
              <button onClick={() => setConfirming(false)} className="px-4 py-2 rounded-lg bg-white border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">Cancelar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportarPage() {
  const [target, setTarget]   = useState<ImportTarget>("tutors");
  const [rows, setRows]       = useState<Record<string, unknown>[]>([]);
  const [filename, setFilename] = useState("");
  const [result, setResult]   = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState<"import"|"export">("import");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setResult(null);
    setFilename(file.name);
    try {
      let parsed: Record<string, unknown>[] = [];
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        parsed = await parseCSV(text);
      } else {
        parsed = await parseExcel(file);
      }
      setRows(parsed);
      store.toast("info", `${parsed.length} linhas lidas de "${file.name}"`);
    } catch {
      store.toast("error", "Erro ao ler o arquivo. Verifique o formato.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!rows.length) return store.toast("warning", "Nenhum dado carregado.");
    setLoading(true);
    try {
      const res = await executeImport(rows, target);
      setResult(res);
      if (res.success > 0) store.toast("success", `${res.success} registros importados com sucesso!`);
      if (res.errors.length) store.toast("warning", `${res.errors.length} linha(s) com erro. Verifique abaixo.`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setRows([]); setFilename(""); setResult(null); };

  const targetCfg = TARGETS.find(t => t.id === target)!;

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importar / Exportar dados</h1>
          <p className="text-sm text-gray-500 mt-0.5">Traga dados de outro sistema ou exporte relatórios</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[["import","↑ Importar dados"],["export","↓ Exportar / Relatórios"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id as "import"|"export")}
            className={cn("px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px",
              tab === id ? "border-forest-600 text-forest-700" : "border-transparent text-gray-500 hover:text-gray-700"
            )}>{label}</button>
        ))}
      </div>

      {tab === "export" ? <ExportSection /> : (
        <div className="space-y-6">
          {/* Step 1 — choose target */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">1. O que você quer importar?</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {TARGETS.map(t => (
                <button key={t.id} onClick={() => { setTarget(t.id); reset(); }}
                  className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-xs font-semibold transition-all",
                    target === t.id ? t.color + " border-current" : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                  )}>
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">2. Carregue o arquivo</p>
              <button onClick={() => downloadTemplate(target)}
                className="flex items-center gap-1.5 text-xs font-semibold text-forest-600 hover:text-forest-700 px-3 py-1.5 rounded-lg hover:bg-forest-50 transition-colors">
                <Download className="w-3.5 h-3.5"/> Baixar template Excel
              </button>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
                rows.length > 0
                  ? "border-forest-400 bg-forest-50"
                  : "border-gray-200 hover:border-forest-300 hover:bg-gray-50"
              )}
            >
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {rows.length > 0 ? (
                <div className="space-y-2">
                  <CheckCircle className="w-10 h-10 text-forest-500 mx-auto"/>
                  <p className="font-semibold text-forest-800">{filename}</p>
                  <p className="text-sm text-forest-600 num-display">{rows.length} linhas prontas para importar</p>
                  <button onClick={e => { e.stopPropagation(); reset(); }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline mt-1">trocar arquivo</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-10 h-10 text-gray-300 mx-auto"/>
                  <div>
                    <p className="font-semibold text-gray-600">Arraste um arquivo ou clique para selecionar</p>
                    <p className="text-sm text-gray-400 mt-1">Suporta .xlsx, .xls e .csv</p>
                    <p className="text-xs text-gray-400 mt-2">Também aceita exportações de outros sistemas de pet shop</p>
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            {rows.length > 0 && (
              <div className="mt-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600">Prévia — primeiras 5 linhas</p>
                  <span className="text-xs text-gray-400 num-display">{rows.length} linhas no total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full min-w-max">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {Object.keys(rows[0]).map(k => (
                          <th key={k} className="text-left px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">{String(v).slice(0, 40)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Step 3 — import */}
          {rows.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">3. Confirmar importação</p>
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                <div className={cn("px-3 py-2 rounded-lg border text-sm font-semibold", targetCfg.color)}>
                  {rows.length} {targetCfg.label}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400"/>
                <span className="text-sm text-gray-600">Banco de dados local (MATILHA OS)</span>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" icon={<RefreshCw className="w-4 h-4"/>} onClick={reset}>Limpar</Button>
                  <Button icon={<Upload className="w-4 h-4"/>} onClick={handleImport} disabled={loading}>
                    {loading ? "Importando..." : `Importar ${rows.length} registros`}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={cn("rounded-xl border p-5", result.errors.length > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200")}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600"/>
                <p className="font-semibold text-green-800 num-display">{result.success} registros importados com sucesso</p>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-amber-700 mb-2">{result.errors.length} erro(s):</p>
                  <ul className="space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/> {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Reset DB */}
          <ResetSection/>
        </div>
      )}
    </div>
  );
}
