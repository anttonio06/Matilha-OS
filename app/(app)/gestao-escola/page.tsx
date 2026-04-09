"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Star, CalendarDays, Dog, Plus, Search,
  ChevronRight, ChevronLeft, CheckCircle, Cake,
  LogIn, AlertTriangle, Edit2, ShoppingCart, UserCheck,
  FileSpreadsheet, FileText, Save, X,
} from "lucide-react";
import { store } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { Button, Input, Pagination } from "@/components/ui";
import { useDB, DogDB, TutorDB, GroupDB, TransactionDB, KEYS } from "@/lib/db";
import { useDebounce, usePagination } from "@/lib/hooks";
import type { Dog as DogType, Tutor } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "visao_geral" | "presenca" | "familias" | "agenda" | "relatorios" | "equipe";

// ─── Constants ────────────────────────────────────────────────────────────────

const GANTT_MONTHS = [
  { nome:"março", abr:"mar", dias:31 },
  { nome:"abril", abr:"abr", dias:30 },
  { nome:"maio",  abr:"mai", dias:31 },
];

// ─── Report helper ────────────────────────────────────────────────────────────

async function exportReport(title: string, data: Record<string, unknown>[], fmt: "excel"|"pdf", filename: string) {
  if (data.length === 0) { store.toast("warning","Nenhum dado para exportar."); return; }
  if (fmt === "excel") {
    const { exportToExcel } = await import("@/lib/export");
    await exportToExcel(data, filename);
  } else {
    const { exportToPDF } = await import("@/lib/export");
    const cols = Object.keys(data[0]).map(k => ({ header: k, dataKey: k }));
    await exportToPDF(title, cols, data, filename);
  }
  store.toast("success", `${title} exportado!`);
}

// ─── Section: Visão Geral ─────────────────────────────────────────────────────

function SectionVisaoGeral() {
  const dogs   = useDB(() => DogDB.list(),   KEYS.dogs);
  const groups = useDB(() => GroupDB.list(), KEYS.groups);

  const present  = dogs.slice(0, 12);
  const daycareN = 4;
  const hotelN   = 8;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-forest-600 flex items-center justify-center">
              <Dog className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 num-display">{dogs.length}</p>
              <p className="text-xs text-gray-400">cadastrados</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 num-display">{present.length}</p>
              <p className="text-xs text-gray-400">presentes hoje</p>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          {[
            { l:"Daycare",  v:daycareN, cls:"bg-blue-100 text-blue-700"   },
            { l:"Pernoite", v:0,        cls:"bg-gray-100 text-gray-600"   },
            { l:"Hotel",    v:hotelN,   cls:"bg-amber-100 text-amber-700" },
          ].map(s => (
            <div key={s.l} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold", s.cls)}>
              {s.l} <span className="num-display">{s.v}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 text-sm font-semibold">
            <Cake className="w-4 h-4" /><span className="num-display">0</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Turmas</h2>
          <span className="text-xs text-gray-400 num-display">{groups.length} grupos cadastrados</span>
        </div>
        {groups.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum grupo cadastrado ainda.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {groups.map((g, i) => (
              <div key={g.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", g.color || "bg-forest-100")}>
                  <span className="text-xs font-bold text-forest-600">{i + 1}</span>
                </div>
                <span className="flex-1 text-sm font-medium text-blue-600 hover:text-blue-800">{g.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-1.5 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-forest-400" style={{ width:`${Math.min(100,(g.currentCount/g.capacity)*100)}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 num-display w-20 text-right">{g.currentCount} / {g.capacity}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section: Lista de Presença ───────────────────────────────────────────────

function SectionPresenca() {
  const dogs   = useDB(() => DogDB.list(),   KEYS.dogs);
  const tutors = useDB(() => TutorDB.list(), KEYS.tutors);
  const [search, setSearch]       = useState("");
  const [presencas, setPresencas] = useState<Record<string, { cafe:boolean; almoco:boolean; jantar:boolean }>>({});

  // Debounce search: filter only after user stops typing (200ms)
  const debouncedSearch = useDebounce(search, 200);

  const tutorMap = useMemo(
    () => Object.fromEntries(tutors.map(t => [t.id, t.name])),
    [tutors]
  );

  const toggled = (id: string, meal: "cafe"|"almoco"|"jantar") => {
    setPresencas(p => ({ ...p, [id]: { ...{ cafe:false, almoco:false, jantar:false }, ...p[id], [meal]:!(p[id]?.[meal] ?? false) } }));
  };

  const allPresent = dogs.slice(0, 12);
  const filtered = useMemo(() => allPresent.filter(d => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return d.name.toLowerCase().includes(q) || tutorMap[d.tutorId]?.toLowerCase().includes(q);
  }), [allPresent, debouncedSearch, tutorMap]);

  const { paginated, page, setPage, totalPages, total } = usePagination(filtered, 20);
  const daycareN = Math.floor(filtered.length * 0.33);
  const hotelN   = filtered.length - daycareN;

  const handleExport = async (fmt: "excel"|"pdf") => {
    const rows = filtered.map(d => ({
      "Nome":   d.name, "Raça": d.breed, "Tutor": tutorMap[d.tutorId] ?? "",
      "Café":   presencas[d.id]?.cafe   ? "✓" : "",
      "Almoço": presencas[d.id]?.almoco ? "✓" : "",
      "Jantar": presencas[d.id]?.jantar ? "✓" : "",
    }));
    await exportReport("Lista de Presença", rows, fmt, "Lista_Presenca_" + new Date().toLocaleDateString("pt-BR").replace(/\//g,"-"));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-bold text-gray-900 num-display">Lista {new Date().toLocaleDateString("pt-BR")}</h2>
        <div className="flex gap-2">
          <button onClick={() => handleExport("excel")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5"/> Excel
          </button>
          <button onClick={() => handleExport("pdf")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">
            <FileText className="w-3.5 h-3.5"/> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { l:"Total",   v:filtered.length, cls:"bg-green-100 text-green-700" },
            { l:"Daycare", v:daycareN,        cls:"bg-blue-100 text-blue-700"   },
            { l:"Hotel",   v:hotelN,          cls:"bg-amber-100 text-amber-700" },
          ].map(s => (
            <div key={s.l} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold", s.cls)}>
              {s.l} <span className="num-display">{s.v}</span>
            </div>
          ))}
          <div className="ml-auto">
            <Input placeholder="Buscar..." value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              icon={<Search className="w-3.5 h-3.5"/>} className="w-44"/>
          </div>
        </div>
      </div>

      {dogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Dog className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-gray-400">Nenhum cão cadastrado</p>
          <p className="text-xs text-gray-300 mt-1">Cadastre cães no CRM para ver a lista de presença</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="w-8 px-4 py-3"><input type="checkbox" className="rounded"/></th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700">Nome</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700">Tutor</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700">Serviço</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">Café</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">Almoço</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">Jantar</th>
                  <th className="px-3 py-3"/>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((dog, i) => {
                  const p   = presencas[dog.id] ?? { cafe:false, almoco:false, jantar:false };
                  const svc = i % 3 === 0 ? "daycare" : "hotel";
                  return (
                    <tr key={dog.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-2.5"><input type="checkbox" className="rounded"/></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {dog.tags?.includes("vip") && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400"/>}
                          <span className="font-medium text-blue-600">{dog.name}</span>
                          <span className="text-gray-400 text-xs">({dog.breed})</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs">{tutorMap[dog.tutorId] ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
                          svc === "daycare" ? "bg-blue-500 text-white" : "bg-amber-500 text-white")}>
                          {svc === "daycare" ? "Daycare" : "Hotel"}
                        </span>
                      </td>
                      {(["cafe","almoco","jantar"] as const).map(meal => (
                        <td key={meal} className="px-3 py-2.5 text-center">
                          <button onClick={() => toggled(dog.id, meal)}
                            className={cn("w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors",
                              p[meal] ? "bg-green-500 text-white" : "border border-gray-300 hover:bg-gray-100")}>
                            {p[meal] && <CheckCircle className="w-3.5 h-3.5"/>}
                          </button>
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-0.5">
                          <button className="w-7 h-7 rounded flex items-center justify-center text-blue-500 hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5"/></button>
                          <button className="w-7 h-7 rounded flex items-center justify-center text-blue-500 hover:bg-blue-50"><ShoppingCart className="w-3.5 h-3.5"/></button>
                          <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100"><UserCheck className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page} totalPages={totalPages} total={total}
            perPage={20} onPage={setPage}
            className="border-t border-gray-100 bg-gray-50"
          />
        </div>
      )}
    </div>
  );
}

// ─── Section: Famílias ────────────────────────────────────────────────────────

function sendWhatsApp(phone: string, name: string, template?: string) {
  const num = phone.replace(/\D/g,"");
  if (!num) { store.toast("error","Número não cadastrado."); return; }
  const msg = template ?? `Olá, ${name.split(" ")[0]}! 🐾 Aqui é da Matilha. Como posso ajudar?`;
  const cfg = (() => { try { return JSON.parse(localStorage.getItem("matilha:wa:config")??"{}"); } catch { return {}; } })();
  if (cfg.token && cfg.phoneId) {
    fetch(`https://graph.facebook.com/v19.0/${cfg.phoneId}/messages`, {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${cfg.token}`},
      body:JSON.stringify({ messaging_product:"whatsapp", to:`55${num}`, type:"text", text:{body:msg} }),
    }).then(r => {
      if (r.ok) store.toast("success",`Mensagem enviada para ${name}!`);
      else window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`,"_blank");
    }).catch(() => window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`,"_blank"));
  } else {
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`,"_blank");
    store.toast("success",`WhatsApp aberto para ${name}`);
  }
}

function WAMenu({ tutor, dogName, onClose }: { tutor: Tutor; dogName: string; onClose: () => void }) {
  const phone = tutor.whatsapp || tutor.phone;
  const msgs = [
    { label:"Boas-vindas",       msg:`Olá, ${tutor.name.split(" ")[0]}! Bem-vindo(a) à Matilha! Estamos felizes em ter o(a) ${dogName} na nossa família. 🐶❤️` },
    { label:"Confirmação",       msg:`Olá, ${tutor.name.split(" ")[0]}! Confirmamos a presença do(a) ${dogName} para hoje. Qualquer dúvida estamos aqui! 🐾` },
    { label:"Atualização diária",msg:`Olá, ${tutor.name.split(" ")[0]}! ${dogName} está ótimo(a), curtindo o dia com a turma! 😄` },
    { label:"Lembrete vacina",   msg:`Olá, ${tutor.name.split(" ")[0]}! 💉 A vacina de ${dogName} vence em breve. Precisa de ajuda para agendar?` },
    { label:"Renovação plano",   msg:`Olá, ${tutor.name.split(" ")[0]}! O plano de ${dogName} está próximo do limite. Gostaria de renovar? 🐾` },
  ];
  const [custom, setCustom] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">WhatsApp — {tutor.name.split(" ")[0]}</p>
              <p className="text-xs text-gray-500">{phone || "Sem número"}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400"/></button>
          </div>
          <div className="space-y-1.5">
            {msgs.map((m,i) => (
              <button key={i} onClick={() => { sendWhatsApp(phone, tutor.name, m.msg); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 text-left transition-all group">
                <span className="text-base">💬</span>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-green-800">{m.label}</span>
              </button>
            ))}
            <div className="space-y-1.5 pt-1 border-t border-gray-100">
              <textarea value={custom} onChange={e => setCustom(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-forest-400"
                rows={2} placeholder="Mensagem personalizada..."/>
              <button onClick={() => { if(custom.trim()) { sendWhatsApp(phone,tutor.name,custom); onClose(); } }}
                disabled={!custom.trim()}
                className="w-full py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-40 transition-colors">
                Enviar personalizada
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionFamilias() {
  const dogs   = useDB(() => DogDB.list(),   KEYS.dogs);
  const tutors = useDB(() => TutorDB.list(), KEYS.tutors);
  const [tab, setTab]       = useState("ativos");
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const [waMenu, setWaMenu] = useState<{ tutor: Tutor; dogName: string } | null>(null);
  const PER_PAGE = 15;

  const STATUS_TABS   = ["ativos","inativos","afastados","expulsos","falecidos","pre_cadastro"];
  const STATUS_LABELS: Record<string,string> = { ativos:"Ativos", inativos:"Inativos", afastados:"Afastados", expulsos:"Expulsos", falecidos:"Falecidos", pre_cadastro:"Pré Cadastro" };

  const filteredDogs = dogs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    tutors.find(t => t.id === d.tutorId)?.name.toLowerCase().includes(search.toLowerCase()) ||
    d.breed.toLowerCase().includes(search.toLowerCase())
  );
  const paginated  = filteredDogs.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filteredDogs.length / PER_PAGE);

  const handleExport = async (fmt: "excel"|"pdf") => {
    const { Reports } = await import("@/lib/export");
    const tutorMap = Object.fromEntries(tutors.map(t=>[t.id,t.name]));
    await Reports.dogs(filteredDogs, tutorMap, fmt);
  };

  return (
    <div className="space-y-4">
      {waMenu && <WAMenu tutor={waMenu.tutor} dogName={waMenu.dogName} onClose={() => setWaMenu(null)}/>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Famílias</h2>
          <p className="text-sm text-gray-500">{dogs.length} cães cadastrados · {tutors.length} tutores</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => handleExport("excel")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700">
            <FileSpreadsheet className="w-3.5 h-3.5"/> Excel
          </button>
          <button onClick={() => handleExport("pdf")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700">
            <FileText className="w-3.5 h-3.5"/> PDF
          </button>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5"/>} onClick={() => store.openModal("novo_cao")}>Novo cão</Button>
        </div>
      </div>

      <div className="flex items-center gap-0.5 flex-wrap border-b border-gray-200">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={cn("px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
              tab === t ? "border-forest-600 text-forest-700" : "border-transparent text-gray-500 hover:text-gray-700"
            )}>
            {STATUS_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Input placeholder="Buscar por nome, raça ou tutor..." value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
          icon={<Search className="w-4 h-4"/>} className="w-72"/>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 mr-1 num-display">{filteredDogs.length} registros</span>
          <button disabled={page===1} onClick={() => setPage(p=>p-1)}
            className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <ChevronLeft className="w-3.5 h-3.5"/>
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_,i) => i+1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={cn("w-7 h-7 rounded text-xs font-semibold transition-colors",
              page===p ? "bg-forest-600 text-white" : "text-gray-600 hover:bg-gray-100")}>{p}</button>
          ))}
          <button disabled={page===totalPages||totalPages===0} onClick={() => setPage(p=>p+1)}
            className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <ChevronRight className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>

      {dogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Dog className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
          <p className="text-sm text-gray-400">Nenhuma família cadastrada ainda.</p>
          <button onClick={() => store.openModal("novo_cao")}
            className="mt-3 px-4 py-2 rounded-lg bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700 transition-colors">
            Cadastrar primeiro cão
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Cão</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Raça</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Tutor / Responsável</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">WhatsApp</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Porte</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Energia</th>
                <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Social</th>
                <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Contato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(d => {
                const t        = tutors.find(x => x.id === d.tutorId);
                const hasPhone = !!(t?.whatsapp || t?.phone);
                return (
                  <tr key={d.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-forest-700">{d.name[0]}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            {d.tags?.includes("vip") && <Star className="w-3 h-3 text-amber-400 fill-amber-400"/>}
                            <span className="font-semibold text-gray-900 text-sm">{d.name}</span>
                          </div>
                          {(d.medicalRestrictions || d.behavioralRestrictions) && (
                            <span className="text-2xs text-red-500 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5"/> Alerta</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{d.breed || "—"}</td>
                    <td className="px-4 py-3">
                      {t ? (
                        <div>
                          <p className="text-sm font-medium text-gray-800">{t.name}</p>
                          <p className="text-xs text-gray-400">{t.email || "—"}</p>
                        </div>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 num-display">
                      {t?.whatsapp || t?.phone || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs font-semibold text-gray-600 capitalize">{d.size}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("text-xs font-bold capitalize px-2 py-0.5 rounded-full",
                        d.energyLevel==="muito_alta" ? "bg-red-100 text-red-700" :
                        d.energyLevel==="alta"       ? "bg-amber-100 text-amber-700" :
                        d.energyLevel==="moderada"   ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      )}>{d.energyLevel.replace("_"," ")}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full font-semibold capitalize">
                        {d.socialLevel.replace("_"," ")}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {t && (
                        <button
                          onClick={() => setWaMenu({ tutor: t, dogName: d.name })}
                          disabled={!hasPhone}
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                            hasPhone ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}>
                          <span>💬</span> WA
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500 num-display">{filteredDogs.length} registros totais</p>
            <div className="flex gap-1">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5"/></button>
              <button disabled={page>=totalPages} onClick={() => setPage(p=>p+1)} className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5"/></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Activity types ───────────────────────────────────────────────────────────

const ACTIVITY_TYPES = [
  { id:"adestramento",      label:"Aula de Adestramento",    emoji:"🎓", color:"bg-forest-100 text-forest-700 border-forest-300"  },
  { id:"comportamental",    label:"Consulta Comportamental", emoji:"🧠", color:"bg-purple-100 text-purple-700 border-purple-300"  },
  { id:"alinhamento_tutor", label:"Alinhamento com Tutor",   emoji:"🤝", color:"bg-blue-100 text-blue-700 border-blue-300"       },
  { id:"avaliacao",         label:"Avaliação Comportamental",emoji:"📋", color:"bg-amber-100 text-amber-700 border-amber-300"    },
  { id:"sociabilizacao",    label:"Sessão de Sociabilização",emoji:"🐾", color:"bg-rose-100 text-rose-700 border-rose-300"       },
  { id:"reforco_positivo",  label:"Reforço Positivo",        emoji:"⭐", color:"bg-yellow-100 text-yellow-700 border-yellow-300" },
  { id:"enriquecimento",    label:"Enriquecimento Ambiental",emoji:"🧩", color:"bg-indigo-100 text-indigo-700 border-indigo-300" },
  { id:"outro",             label:"Outro",                   emoji:"📝", color:"bg-gray-100 text-gray-700 border-gray-300"       },
] as const;

type ActivityType = typeof ACTIVITY_TYPES[number]["id"];

interface SchoolActivity {
  id: string; type: ActivityType; title: string; dogId: string;
  date: string; time: string; duration: number;
  responsible: string; notes: string; createdAt: string;
}

const ACT_KEY = "matilha:escola:activities";
function loadActivities(): SchoolActivity[] {
  try { return JSON.parse(localStorage.getItem(ACT_KEY) ?? "[]"); } catch { return []; }
}
function saveActivities(list: SchoolActivity[]) { localStorage.setItem(ACT_KEY, JSON.stringify(list)); }

// ─── Add Activity Modal ───────────────────────────────────────────────────────

function AddActivityModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const dogs = useDB(() => DogDB.list(), KEYS.dogs);
  const now  = new Date();
  const [form, setForm] = useState({
    type: "adestramento" as ActivityType, title: "",
    dogId: "", date: now.toISOString().split("T")[0],
    time: "09:00", duration: 60, responsible: "", notes: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(f => ({ ...f, [k]: v }));
  const selectedType = ACTIVITY_TYPES.find(t => t.id === form.type)!;
  const dog = dogs.find(d => d.id === form.dogId);

  const submit = () => {
    if (!form.dogId)       return store.toast("warning","Selecione o cão.");
    if (!form.responsible) return store.toast("warning","Informe o responsável.");
    const act: SchoolActivity = {
      id: `act_${Date.now()}`, type: form.type,
      title: form.title || selectedType.label, dogId: form.dogId,
      date: form.date, time: form.time, duration: form.duration,
      responsible: form.responsible, notes: form.notes, createdAt: new Date().toISOString(),
    };
    saveActivities([...loadActivities(), act]);
    store.toast("success", `Atividade "${act.title}" agendada para ${dog?.name}!`);
    onSaved(); onClose();
  };

  const iCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Adicionar Atividade</h2>
              <p className="text-xs text-gray-500 mt-0.5">Agenda da escola</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4"/></button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Tipo de atividade *</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => set("type", t.id)}
                  className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-left",
                    form.type === t.id ? t.color : "border-gray-100 text-gray-500 hover:border-gray-200")}>
                  <span className="text-base flex-shrink-0">{t.emoji}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Cão *</label>
              <select className={iCls} value={form.dogId} onChange={e => set("dogId", e.target.value)}>
                <option value="">Selecionar...</option>
                {dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Título (opcional)</label>
              <input className={iCls} placeholder={selectedType.label} value={form.title} onChange={e => set("title", e.target.value)}/>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Data *</label>
              <input className={iCls} type="date" value={form.date} onChange={e => set("date", e.target.value)}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Horário</label>
              <input className={iCls} type="time" value={form.time} onChange={e => set("time", e.target.value)}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Duração (min)</label>
              <select className={iCls} value={form.duration} onChange={e => set("duration", Number(e.target.value))}>
                {[30,45,60,90,120].map(n => <option key={n} value={n}>{n} min</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Responsável *</label>
            <input className={iCls} placeholder="Nome do adestrador / educador" value={form.responsible} onChange={e => set("responsible", e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Observações</label>
            <textarea className={cn(iCls,"resize-none")} rows={2} placeholder="Objetivos, histórico, pontos de atenção..." value={form.notes} onChange={e => set("notes", e.target.value)}/>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700 flex items-center justify-center gap-2">
              <Save className="w-4 h-4"/> Salvar atividade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ act, dogs }: { act: SchoolActivity; dogs: DogType[] }) {
  const dog  = dogs.find(d => d.id === act.dogId);
  const type = ACTIVITY_TYPES.find(t => t.id === act.type) ?? ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
  const isPast = act.date < new Date().toISOString().split("T")[0];

  return (
    <div className={cn("bg-white rounded-xl border-2 p-4 space-y-2", type.color.split(" ")[2] ?? "border-gray-200", isPast ? "opacity-60" : "")}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{type.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{act.title}</p>
          <p className="text-xs text-gray-500">{dog?.name ?? "—"} · {act.responsible}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-bold text-gray-700 num-display">{act.time}</p>
          <p className="text-2xs text-gray-400">{act.duration}min</p>
        </div>
      </div>
      {act.notes && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{act.notes}</p>}
      <p className="text-2xs text-gray-400 num-display">{new Date(act.date + "T12:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}</p>
    </div>
  );
}

// ─── Section: Agenda ──────────────────────────────────────────────────────────

function SectionAgenda() {
  const dogs = useDB(() => DogDB.list(), KEYS.dogs);
  const [months, setMonths]       = useState(3);
  const [showModal, setShowModal] = useState(false);
  const [activities, setActivities] = useState<SchoolActivity[]>(loadActivities);
  const [filterType, setFilterType] = useState<"todos"|ActivityType>("todos");
  const [viewMode, setViewMode]   = useState<"gantt"|"list">("list");

  const refresh  = () => setActivities(loadActivities());
  const today    = new Date().toISOString().split("T")[0];
  const upcoming = activities.filter(a => a.date >= today);
  const past     = activities.filter(a => a.date < today);
  const filtered = (list: SchoolActivity[]) => filterType === "todos" ? list : list.filter(a => a.type === filterType);
  const rows = [{ id:"tarefas", label:"Tarefas", bg:"bg-yellow-50/40" }, { id:"aulas", label:"Aulas", bg:"" }];

  return (
    <div className="space-y-5">
      {showModal && <AddActivityModal onClose={() => setShowModal(false)} onSaved={refresh}/>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Agenda da Escola</h2>
          <p className="text-sm text-gray-500">{upcoming.length} atividade{upcoming.length !== 1?"s":""} agendadas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {[{v:"list",l:"Lista"},{v:"gantt",l:"Gantt"}].map(({v,l}) => (
              <button key={v} onClick={() => setViewMode(v as typeof viewMode)}
                className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  viewMode===v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>{l}</button>
            ))}
          </div>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5"/>} onClick={() => setShowModal(true)}>Adicionar Atividade</Button>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilterType("todos")}
          className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
            filterType==="todos" ? "bg-forest-600 text-white border-forest-600" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
          Todos
        </button>
        {ACTIVITY_TYPES.map(t => (
          <button key={t.id} onClick={() => setFilterType(t.id)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filterType===t.id ? t.color : "border-gray-200 text-gray-600 hover:border-gray-300")}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {viewMode === "list" ? (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Próximas atividades ({filtered(upcoming).length})</p>
            {filtered(upcoming).length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
                <CalendarDays className="w-10 h-10 opacity-20"/>
                <p className="text-sm font-medium">Nenhuma atividade agendada</p>
                <button onClick={() => setShowModal(true)} className="text-xs font-bold text-forest-600 hover:underline">+ Adicionar primeira atividade</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered(upcoming).sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                  .map(act => <ActivityCard key={act.id} act={act} dogs={dogs}/>)}
              </div>
            )}
          </div>
          {filtered(past).length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Realizadas ({filtered(past).length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered(past).sort((a,b) => b.date.localeCompare(a.date)).slice(0,6)
                  .map(act => <ActivityCard key={act.id} act={act} dogs={dogs}/>)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex">
              <button className="w-8 h-8 flex items-center justify-center rounded-l-md border border-gray-200 bg-white hover:bg-gray-50"><ChevronLeft className="w-4 h-4 text-gray-500"/></button>
              <button className="px-3 h-8 border-t border-b border-gray-200 bg-white text-sm font-medium hover:bg-gray-50">Hoje</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-r-md border border-gray-200 bg-white hover:bg-gray-50"><ChevronRight className="w-4 h-4 text-gray-500"/></button>
            </div>
            <select value={months} onChange={e => setMonths(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white">
              <option value={1}>1 Mês</option><option value={3}>3 Meses</option>
            </select>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div style={{ minWidth: GANTT_MONTHS.slice(0,months).reduce((s,m)=>s+m.dias*28,0)+192 }}>
                <div className="flex border-b border-gray-200 bg-gray-50">
                  <div className="w-48 flex-shrink-0 border-r border-gray-200 px-4 py-2.5">
                    <span className="text-sm font-semibold text-gray-700">Calendário</span>
                  </div>
                  {GANTT_MONTHS.slice(0,months).map(m => (
                    <div key={m.nome} className="border-r border-gray-100 py-2.5 text-center" style={{ width:m.dias*28 }}>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{m.abr}</span>
                    </div>
                  ))}
                </div>
                <div className="flex border-b border-gray-200">
                  <div className="w-48 flex-shrink-0 border-r border-gray-200"/>
                  {GANTT_MONTHS.slice(0,months).flatMap(m =>
                    Array.from({ length:m.dias }, (_,d) => (
                      <div key={`h-${m.nome}-${d}`} className="w-7 flex-shrink-0 text-center py-1.5 border-r border-gray-50 bg-gray-50/60">
                        <span className="text-2xs text-gray-400 num-display">{d+1}</span>
                      </div>
                    ))
                  )}
                </div>
                {rows.map(row => (
                  <div key={row.id} className={cn("flex border-b border-gray-100 last:border-b-0", row.bg)}>
                    <div className="w-48 flex-shrink-0 border-r border-gray-200 px-4 py-4">
                      <span className="text-sm font-medium text-gray-700">{row.label}</span>
                    </div>
                    {GANTT_MONTHS.slice(0,months).flatMap(m =>
                      Array.from({ length:m.dias }, (_,d) => (
                        <div key={`${row.id}-${m.nome}-${d}`} onClick={() => setShowModal(true)}
                          className="w-7 flex-shrink-0 border-r border-gray-50 py-4 hover:bg-forest-50/40 cursor-pointer transition-colors"/>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Relatórios ──────────────────────────────────────────────────────

function SectionRelatorios() {
  const dogs   = useDB(() => DogDB.list(),          KEYS.dogs);
  const tutors = useDB(() => TutorDB.list(),         KEYS.tutors);
  const groups = useDB(() => GroupDB.list(),         KEYS.groups);
  const txns   = useDB(() => TransactionDB.list(),   KEYS.transactions);
  const tutorMap = Object.fromEntries(tutors.map(t => [t.id, t.name]));

  const RELATORIOS: { label: string; fn: (fmt:"excel"|"pdf") => Promise<void> }[] = [
    { label:"Lista de cães", fn: async fmt => {
      const rows = dogs.map(d => ({ Nome:d.name, Raça:d.breed, Sexo:d.sex, Porte:d.size, Peso:d.weight, Castrado:d.neutered?"Sim":"Não", Energia:d.energyLevel, Sociabilidade:d.socialLevel, Tutor:tutorMap[d.tutorId]??"" }));
      await exportReport("Lista de Cães", rows, fmt, "Lista_Caes");
    }},
    { label:"Lista de tutores", fn: async fmt => {
      const rows = tutors.map(t => ({ Nome:t.name, Email:t.email, Telefone:t.phone, Status:t.status, Origem:t.source??"" }));
      await exportReport("Lista de Tutores", rows, fmt, "Lista_Tutores");
    }},
    { label:"Relatório por raça", fn: async fmt => {
      const racas: Record<string,number> = {};
      dogs.forEach(d => { racas[d.breed] = (racas[d.breed]??0)+1; });
      const rows = Object.entries(racas).sort((a,b)=>b[1]-a[1]).map(([Raça,Quantidade]) => ({ Raça, Quantidade }));
      await exportReport("Cães por Raça", rows, fmt, "Relatorio_Racas");
    }},
    { label:"Relatório de energia", fn: async fmt => {
      const lvls: Record<string,number> = { baixa:0, moderada:0, alta:0, muito_alta:0 };
      dogs.forEach(d => { lvls[d.energyLevel]++; });
      const rows = Object.entries(lvls).map(([Nível,Quantidade]) => ({ Nível, Quantidade }));
      await exportReport("Distribuição de Energia", rows, fmt, "Relatorio_Energia");
    }},
    { label:"Relatório de sociabilidade", fn: async fmt => {
      const lvls: Record<string,number> = { reservado:0, seletivo:0, sociavel:0, muito_sociavel:0 };
      dogs.forEach(d => { lvls[d.socialLevel]++; });
      const rows = Object.entries(lvls).map(([Nível,Quantidade]) => ({ Nível, Quantidade }));
      await exportReport("Distribuição de Sociabilidade", rows, fmt, "Relatorio_Sociabilidade");
    }},
    { label:"Relatório de porte", fn: async fmt => {
      const portes: Record<string,number> = {};
      dogs.forEach(d => { portes[d.size] = (portes[d.size]??0)+1; });
      const rows = Object.entries(portes).map(([Porte,Quantidade]) => ({ Porte, Quantidade }));
      await exportReport("Cães por Porte", rows, fmt, "Relatorio_Porte");
    }},
    { label:"Ocupação por turma", fn: async fmt => {
      const rows = groups.map(g => ({ Turma:g.name, Capacidade:g.capacity, Inscritos:g.currentCount, Livres:g.capacity-g.currentCount, Ocupação:`${Math.round((g.currentCount/g.capacity)*100)}%` }));
      await exportReport("Ocupação por Turma", rows, fmt, "Relatorio_Ocupacao");
    }},
    { label:"Relatório financeiro", fn: async fmt => {
      const rows = txns.map(t => ({ Tipo:t.type, Descrição:t.description, Valor:formatCurrency(t.amount), Status:t.status, Vencimento:t.dueDate }));
      await exportReport("Relatório Financeiro", rows, fmt, "Relatorio_Financeiro");
    }},
    { label:"Cães castrados vs não", fn: async fmt => {
      const sim = dogs.filter(d=>d.neutered).length;
      const rows = [{ Situação:"Castrado", Quantidade:sim }, { Situação:"Não castrado", Quantidade:dogs.length-sim }];
      await exportReport("Castração", rows, fmt, "Relatorio_Castracao");
    }},
    { label:"Relatório de vacinas", fn: async fmt => {
      const hoje = new Date();
      const rows = dogs.flatMap(d => d.vaccines.map(v => ({
        Cão:d.name, Tutor:tutorMap[d.tutorId]??"",
        Vacina:v.name, Aplicada:v.appliedAt, Vence:v.expiresAt,
        Status: new Date(v.expiresAt) < hoje ? "Vencida" : "Válida",
      })));
      await exportReport("Relatório de Vacinas", rows, fmt, "Relatorio_Vacinas");
    }},
    { label:"Aniversariantes do mês", fn: async fmt => {
      const mesAtual = new Date().getMonth()+1;
      const rows = dogs.filter(d => d.birthDate && new Date(d.birthDate).getMonth()+1 === mesAtual)
        .map(d => ({ Nome:d.name, Nascimento:d.birthDate, Tutor:tutorMap[d.tutorId]??"" }));
      await exportReport("Aniversariantes do Mês", rows.length ? rows : [{ Info:"Nenhum aniversariante este mês" }], fmt, "Aniversariantes");
    }},
    { label:"Backup completo", fn: async () => {
      const { Reports } = await import("@/lib/export");
      const plans       = (await import("@/lib/db")).PlanDB.list();
      const appointments= (await import("@/lib/db")).AppointmentDB.list();
      const products    = (await import("@/lib/db")).ProductDB.list();
      await Reports.fullBackup(dogs, tutors, appointments, plans, txns, products);
    }},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Relatórios</h2>
        <p className="text-xs text-gray-400">{dogs.length} cães · {tutors.length} tutores</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {RELATORIOS.map(r => (
          <div key={r.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">{r.label}</p>
            <div className="flex gap-2">
              <button onClick={() => r.fn("excel")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors">
                <FileSpreadsheet className="w-3.5 h-3.5"/> Excel
              </button>
              <button onClick={() => r.fn("pdf")} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">
                <FileText className="w-3.5 h-3.5"/> PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Equipe ──────────────────────────────────────────────────────────

function SectionEquipe() {
  const [members, setMembers] = useState([
    { id:"e1", nome:"Carlos Silva",      cargo:"Cuidador",      status:"ativo"   as const, turno:"Manhã",    atend:45, email:"carlos@matilha.com"   },
    { id:"e2", nome:"Ana Paula Ribeiro", cargo:"Treinadora",    status:"ativo"   as const, turno:"Tarde",    atend:32, email:"ana@matilha.com"       },
    { id:"e3", nome:"Felipe Santos",     cargo:"Recepcionista", status:"ativo"   as const, turno:"Integral", atend:0,  email:"felipe@matilha.com"    },
    { id:"e4", nome:"Mariana Costa",     cargo:"Cuidadora",     status:"ativo"   as const, turno:"Manhã",    atend:51, email:"mariana@matilha.com"   },
    { id:"e5", nome:"Roberto Alves",     cargo:"Veterinário",   status:"inativo" as const, turno:"—",        atend:0,  email:"roberto@matilha.com"   },
  ]);
  const [editId, setEditId]   = useState<string|null>(null);
  const [editForm, setEditForm] = useState({ nome:"", cargo:"", turno:"" });

  const startEdit = (m: typeof members[0]) => { setEditId(m.id); setEditForm({ nome:m.nome, cargo:m.cargo, turno:m.turno }); };
  const saveEdit  = () => { setMembers(ms => ms.map(m => m.id===editId ? { ...m, ...editForm } : m)); store.toast("success","Membro atualizado!"); setEditId(null); };
  const toggle    = (id: string) => { setMembers(ms => ms.map(m => m.id===id ? { ...m, status: m.status==="ativo"?"inativo":"ativo" } : m)); store.toast("info","Status atualizado."); };

  const handleExport = async (fmt:"excel"|"pdf") => {
    const rows = members.map(m => ({ Nome:m.nome, Cargo:m.cargo, Status:m.status, Turno:m.turno, Atendimentos:m.atend, Email:m.email }));
    await exportReport("Relatório de Equipe", rows, fmt, "Relatorio_Equipe");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-900">Equipe da Escola</h2>
        <div className="flex gap-2">
          <button onClick={() => handleExport("excel")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"><FileSpreadsheet className="w-3.5 h-3.5"/> Excel</button>
          <button onClick={() => handleExport("pdf")}   className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"><FileText className="w-3.5 h-3.5"/> PDF</button>
          <Button icon={<Plus className="w-4 h-4"/>} size="sm" onClick={() => store.toast("info","Convite enviado!")}>Adicionar</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(m => (
          <div key={m.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-forest-700">{m.nome.split(" ").map(w=>w[0]).slice(0,2).join("")}</span>
              </div>
              <div className="flex-1 min-w-0">
                {editId===m.id ? (
                  <input value={editForm.nome} onChange={e=>setEditForm(f=>({...f,nome:e.target.value}))}
                    className="w-full px-2 py-1 text-sm border border-forest-300 rounded-lg focus:outline-none"/>
                ) : <p className="font-semibold text-gray-900 text-sm truncate">{m.nome}</p>}
                {editId===m.id ? (
                  <input value={editForm.cargo} onChange={e=>setEditForm(f=>({...f,cargo:e.target.value}))}
                    className="w-full mt-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none"/>
                ) : <p className="text-xs text-gray-500">{m.cargo}</p>}
              </div>
              <button onClick={() => toggle(m.id)}
                className={cn("w-10 h-5 rounded-full flex-shrink-0 transition-colors relative", m.status==="ativo"?"bg-forest-500":"bg-gray-200")}>
                <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", m.status==="ativo"?"left-5":"left-0.5")}/>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div><p className="font-semibold text-gray-800">{m.turno}</p><p className="text-gray-500">Turno</p></div>
              <div><p className="font-semibold text-gray-800 num-display">{m.atend}</p><p className="text-gray-500">Atend./mês</p></div>
            </div>
            {editId===m.id ? (
              <div className="flex gap-2">
                <button onClick={saveEdit} className="flex-1 py-1.5 rounded-lg bg-forest-600 text-white text-xs font-semibold hover:bg-forest-700 flex items-center justify-center gap-1"><Save className="w-3 h-3"/> Salvar</button>
                <button onClick={() => setEditId(null)} className="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">Cancelar</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => startEdit(m)} className="flex-1 text-xs py-1.5 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold flex items-center justify-center gap-1"><Edit2 className="w-3 h-3"/> Editar</button>
                <button onClick={() => store.openModal("enviar_mensagem")} className="flex-1 text-xs py-1.5 rounded-md bg-forest-50 text-forest-700 hover:bg-forest-100 font-semibold">Mensagem</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SECTION_TITLES: Record<Section, string> = {
  visao_geral: "Visão Geral",
  presenca:    "Lista de Presença",
  familias:    "Famílias",
  agenda:      "Agenda",
  relatorios:  "Relatórios",
  equipe:      "Equipe",
};

export default function GestaoDaEscolaPage() {
  const [section, setSection] = useState<Section>("visao_geral");

  // Read hash on mount and on change
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#","") as Section;
      if (h && h in SECTION_TITLES) setSection(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const renderSection = () => {
    switch (section) {
      case "visao_geral": return <SectionVisaoGeral/>;
      case "presenca":    return <SectionPresenca/>;
      case "familias":    return <SectionFamilias/>;
      case "agenda":      return <SectionAgenda/>;
      case "relatorios":  return <SectionRelatorios/>;
      case "equipe":      return <SectionEquipe/>;
    }
  };

  return (
    <div className="p-6 max-w-[1400px] space-y-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{SECTION_TITLES[section]}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestão da Escola · Matilha Equilibrada</p>
      </div>
      {renderSection()}
    </div>
  );
}
