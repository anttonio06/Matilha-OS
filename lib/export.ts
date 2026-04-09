/**
 * MATILHA OS — Export Engine v2
 * Professional Excel (xlsx) and PDF exports.
 * Excel: styled headers, column widths, alternating rows, metadata.
 * PDF: landscape A4, forest-green headers, branded footer.
 */

import type { Dog, Tutor, Appointment, Plan, Transaction, Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

// ─── Excel: professional styled workbook ─────────────────────────────────────

export async function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Dados"
): Promise<void> {
  const XLSX = await import("xlsx");
  if (data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto column widths
  const cols = Object.keys(data[0] ?? {});
  ws["!cols"] = cols.map(k => ({
    wch: Math.min(
      45,
      Math.max(
        k.length + 2,
        ...data.map(r => String(r[k] ?? "").length)
      )
    ),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportMultiSheet(
  sheets: { name: string; data: Record<string, unknown>[] }[],
  filename: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb   = XLSX.utils.book_new();

  for (const s of sheets) {
    if (s.data.length === 0) continue;
    const ws = XLSX.utils.json_to_sheet(s.data);
    const cols = Object.keys(s.data[0] ?? {});
    ws["!cols"] = cols.map(k => ({
      wch: Math.min(45, Math.max(k.length + 2, ...s.data.map(r => String(r[k] ?? "").length))),
    }));
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }

  // Metadata sheet
  const meta = XLSX.utils.aoa_to_sheet([
    ["MATILHA OS — Exportação de Dados"],
    [""],
    ["Data/Hora", new Date().toLocaleString("pt-BR")],
    ["Sheets exportadas", sheets.length],
    ["Sistema", "Matilha OS v2.0"],
  ]);
  meta["!cols"] = [{ wch: 28 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, meta, "Metadados");

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── PDF export (jsPDF + autoTable) ──────────────────────────────────────────

export async function exportToPDF(
  title: string,
  columns: { header: string; dataKey: string }[],
  rows: Record<string, unknown>[],
  filename: string
): Promise<void> {
  const { default: jsPDF }     = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(10, 45, 24);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 220, 190);
  doc.text(`MATILHA OS  ·  ${new Date().toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}`, 14, 20);
  doc.text(`${rows.length} registro${rows.length !== 1 ? "s" : ""}`, pageW - 14, 20, { align:"right" });

  autoTable(doc, {
    startY: 33,
    columns,
    body: rows.map(r => columns.map(c => String(r[c.dataKey] ?? "—"))),
    headStyles: {
      fillColor:   [10, 45, 24],
      textColor:   255,
      fontSize:    9,
      fontStyle:   "bold",
      halign:      "left",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize:    8,
      textColor:   [40, 40, 40],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [240, 248, 242],
    },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
    didDrawPage: (data: { pageNumber: number }) => {
      // Footer
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Matilha OS  ·  Página ${data.pageNumber}  ·  Confidencial`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: "center" }
      );
    },
  });

  doc.save(`${filename}.pdf`);
}

// ─── Import: parse Excel / CSV ────────────────────────────────────────────────

export async function parseExcel(file: File): Promise<Record<string, unknown>[]> {
  const XLSX   = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb     = XLSX.read(buffer, { type: "array" });
  const ws     = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

export async function parseCSV(text: string): Promise<Record<string, unknown>[]> {
  const XLSX = await import("xlsx");
  const wb   = XLSX.read(text, { type: "string" });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

// ─── Pre-built report exporters ───────────────────────────────────────────────

export const Reports = {

  dogs: async (data: Dog[], tutorMap: Record<string, string> = {}, fmt: "excel"|"pdf" = "excel") => {
    const now = new Date().toLocaleDateString("pt-BR");
    const rows = data.map(d => ({
      "Nome":                d.name,
      "Raça":                d.breed,
      "Sexo":                d.sex === "macho" ? "Macho" : "Fêmea",
      "Porte":               d.size.charAt(0).toUpperCase() + d.size.slice(1),
      "Peso (kg)":           d.weight,
      "Nascimento":          d.birthDate || "—",
      "Castrado":            d.neutered ? "Sim" : "Não",
      "Energia":             d.energyLevel.replace("_"," "),
      "Sociabilidade":       d.socialLevel.replace("_"," "),
      "Tutor":               tutorMap[d.tutorId] ?? "—",
      "Restrições Saúde":    d.medicalRestrictions || "—",
      "Restrições Compor.":  d.behavioralRestrictions || "—",
      "Ração":               d.foodBrand ? `${d.foodBrand} ${d.foodAmount ?? ""}`.trim() : "—",
      "Cadastrado em":       new Date(d.createdAt).toLocaleDateString("pt-BR"),
      "Exportado em":        now,
    }));
    if (fmt === "excel") return exportToExcel(rows, "MATILHA_Relatorio_Caes");
    return exportToPDF("Relatório de Cães", [
      { header:"Nome",        dataKey:"Nome"        },
      { header:"Raça",        dataKey:"Raça"        },
      { header:"Porte",       dataKey:"Porte"       },
      { header:"Sexo",        dataKey:"Sexo"        },
      { header:"Castrado",    dataKey:"Castrado"    },
      { header:"Energia",     dataKey:"Energia"     },
      { header:"Sociab.",     dataKey:"Sociabilidade"},
      { header:"Tutor",       dataKey:"Tutor"       },
    ], rows as Record<string, unknown>[], "MATILHA_Relatorio_Caes");
  },

  tutors: async (data: Tutor[], fmt: "excel"|"pdf" = "excel") => {
    const now = new Date().toLocaleDateString("pt-BR");
    const rows = data.map(t => ({
      "Nome":           t.name,
      "CPF":            t.cpf || "—",
      "E-mail":         t.email,
      "Telefone":       t.phone,
      "WhatsApp":       t.whatsapp,
      "Endereço":       t.address || "—",
      "Status":         t.status.charAt(0).toUpperCase() + t.status.slice(1),
      "Contato Pref.":  t.preferredContact,
      "Origem":         t.source || "—",
      "Total Gasto":    formatCurrency(t.totalSpent),
      "LTV":            formatCurrency(t.ltv),
      "Planos Ativos":  t.activePlans.length,
      "Tags":           t.tags?.join(", ") || "—",
      "Último Atend.":  t.lastVisit ? new Date(t.lastVisit).toLocaleDateString("pt-BR") : "—",
      "Cadastrado em":  new Date(t.createdAt).toLocaleDateString("pt-BR"),
      "Exportado em":   now,
    }));
    if (fmt === "excel") return exportToExcel(rows, "MATILHA_Relatorio_Tutores");
    return exportToPDF("Relatório de Tutores / Responsáveis", [
      { header:"Nome",         dataKey:"Nome"         },
      { header:"CPF",          dataKey:"CPF"          },
      { header:"Telefone",     dataKey:"Telefone"     },
      { header:"WhatsApp",     dataKey:"WhatsApp"     },
      { header:"Status",       dataKey:"Status"       },
      { header:"Total Gasto",  dataKey:"Total Gasto"  },
      { header:"LTV",          dataKey:"LTV"          },
      { header:"Cadastrado",   dataKey:"Cadastrado em"},
    ], rows as Record<string, unknown>[], "MATILHA_Relatorio_Tutores");
  },

  appointments: async (
    data: Appointment[],
    tutorMap: Record<string, string>,
    dogMap: Record<string, string>,
    fmt: "excel"|"pdf" = "excel"
  ) => {
    const now = new Date().toLocaleDateString("pt-BR");
    const rows = data.map(a => ({
      "Data":          a.date,
      "Horário":       a.startTime,
      "Cão":           dogMap[a.dogId]   ?? "—",
      "Tutor":         tutorMap[a.tutorId] ?? "—",
      "Serviço":       a.serviceType.replace("_"," "),
      "Status":        a.status.replace("_"," "),
      "Valor (R$)":    a.price ?? "—",
      "Observações":   a.notes || "—",
      "Exportado em":  now,
    }));
    if (fmt === "excel") return exportToExcel(rows, "MATILHA_Relatorio_Agendamentos");
    return exportToPDF("Relatório de Agendamentos", [
      { header:"Data",      dataKey:"Data"      },
      { header:"Horário",   dataKey:"Horário"   },
      { header:"Cão",       dataKey:"Cão"       },
      { header:"Tutor",     dataKey:"Tutor"     },
      { header:"Serviço",   dataKey:"Serviço"   },
      { header:"Status",    dataKey:"Status"    },
      { header:"Valor",     dataKey:"Valor (R$)"},
    ], rows as Record<string, unknown>[], "MATILHA_Relatorio_Agendamentos");
  },

  financial: async (data: Transaction[], fmt: "excel"|"pdf" = "excel") => {
    const now = new Date().toLocaleDateString("pt-BR");
    const total = data.reduce((s, t) => s + (t.type === "receita" ? t.amount : -t.amount), 0);
    const rows = [
      ...data.map(t => ({
        "Data":         new Date(t.dueDate).toLocaleDateString("pt-BR"),
        "Tipo":         t.type === "receita" ? "Receita" : "Despesa",
        "Descrição":    t.description,
        "Categoria":    t.category?.charAt(0).toUpperCase() + (t.category?.slice(1) ?? ""),
        "Valor (R$)":   t.type === "receita" ? t.amount : -t.amount,
        "Forma Pagto":  t.method?.replace("_"," ") ?? "—",
        "Status":       t.status ?? "—",
        "Exportado em": now,
      })),
      {
        "Data":"", "Tipo":"", "Descrição":"SALDO TOTAL", "Categoria":"",
        "Valor (R$)": total, "Forma Pagto":"", "Status":"", "Exportado em":"",
      },
    ];
    if (fmt === "excel") return exportToExcel(rows, "MATILHA_Relatorio_Financeiro");
    return exportToPDF("Relatório Financeiro", [
      { header:"Data",       dataKey:"Data"       },
      { header:"Tipo",       dataKey:"Tipo"       },
      { header:"Descrição",  dataKey:"Descrição"  },
      { header:"Categoria",  dataKey:"Categoria"  },
      { header:"Valor (R$)", dataKey:"Valor (R$)" },
      { header:"Forma Pgto", dataKey:"Forma Pagto"},
    ], rows as Record<string, unknown>[], "MATILHA_Relatorio_Financeiro");
  },

  plans: async (data: Plan[], fmt: "excel"|"pdf" = "excel") => {
    const now = new Date().toLocaleDateString("pt-BR");
    const rows = data.map(p => ({
      "Nome do Plano":  p.name,
      "Categoria":      p.category,
      "Status":         p.status,
      "Usos Totais":    p.totalUses ?? "—",
      "Usos Realizados":p.usedUses ?? 0,
      "Usos Restantes": p.totalUses ? (p.totalUses - (p.usedUses ?? 0)) : "—",
      "Valor (R$)":     p.price ?? "—",
      "Início":         p.validFrom  ? new Date(p.validFrom).toLocaleDateString("pt-BR")  : "—",
      "Vencimento":     p.validUntil ? new Date(p.validUntil).toLocaleDateString("pt-BR") : "—",
      "Exportado em":   now,
    }));
    if (fmt === "excel") return exportToExcel(rows, "MATILHA_Relatorio_Planos");
    return exportToPDF("Relatório de Planos", [
      { header:"Nome",       dataKey:"Nome do Plano"   },
      { header:"Categoria",  dataKey:"Categoria"       },
      { header:"Status",     dataKey:"Status"          },
      { header:"Usos Tot.",  dataKey:"Usos Totais"     },
      { header:"Usos Usados",dataKey:"Usos Realizados" },
      { header:"Valor",      dataKey:"Valor (R$)"      },
      { header:"Vencimento", dataKey:"Vencimento"      },
    ], rows as Record<string, unknown>[], "MATILHA_Relatorio_Planos");
  },

  products: async (data: Product[], fmt: "excel"|"pdf" = "excel") => {
    const now = new Date().toLocaleDateString("pt-BR");
    const rows = data.map(p => ({
      "Nome":          p.name,
      "SKU":           p.sku || "—",
      "Categoria":     p.category,
      "Preço (R$)":    p.price,
      "Estoque":       p.stock ?? 0,
      "Unidade":       p.unit ?? "un",
      "Ativo":         p.active ? "Sim" : "Não",
      "Descrição":     p.description || "—",
      "Exportado em":  now,
    }));
    if (fmt === "excel") return exportToExcel(rows, "MATILHA_Relatorio_Produtos");
    return exportToPDF("Relatório de Produtos / Estoque", [
      { header:"Nome",       dataKey:"Nome"      },
      { header:"SKU",        dataKey:"SKU"       },
      { header:"Categoria",  dataKey:"Categoria" },
      { header:"Preço",      dataKey:"Preço (R$)"},
      { header:"Estoque",    dataKey:"Estoque"   },
      { header:"Unidade",    dataKey:"Unidade"   },
      { header:"Ativo",      dataKey:"Ativo"     },
    ], rows as Record<string, unknown>[], "MATILHA_Relatorio_Produtos");
  },

  fullBackup: async (
    dogs: Dog[],
    tutors: Tutor[],
    appointments: Appointment[],
    plans: Plan[],
    transactions: Transaction[],
    products: Product[]
  ) => {
    const now   = new Date().toLocaleDateString("pt-BR");
    const tutorMap = Object.fromEntries(tutors.map(t => [t.id, t.name]));
    const dogMap   = Object.fromEntries(dogs.map(d => [d.id, d.name]));

    await exportMultiSheet([
      {
        name: "Cães",
        data: dogs.map(d => ({
          "Nome":d.name,"Raça":d.breed,"Sexo":d.sex,"Porte":d.size,"Peso":d.weight,
          "Castrado":d.neutered?"Sim":"Não","Energia":d.energyLevel,"Social":d.socialLevel,
          "Tutor":tutorMap[d.tutorId]??"—","Restr. Saúde":d.medicalRestrictions||"—","Exportado em":now,
        })),
      },
      {
        name: "Tutores",
        data: tutors.map(t => ({
          "Nome":t.name,"CPF":t.cpf||"—","Email":t.email,"Tel.":t.phone,"WhatsApp":t.whatsapp,
          "Status":t.status,"LTV":t.ltv,"Total Gasto":t.totalSpent,"Exportado em":now,
        })),
      },
      {
        name: "Agendamentos",
        data: appointments.map(a => ({
          "Data":a.date,"Serviço":a.serviceType,"Cão":dogMap[a.dogId]??"—",
          "Tutor":tutorMap[a.tutorId]??"—","Status":a.status,"Valor":a.price??"—","Exportado em":now,
        })),
      },
      {
        name: "Planos",
        data: plans.map(p => ({
          "Nome":p.name,"Categoria":p.category,"Status":p.status,
          "Usos Tot.":p.totalUses??"—","Usos Usados":p.usedUses??0,"Valor":p.price??"—","Exportado em":now,
        })),
      },
      {
        name: "Financeiro",
        data: transactions.map(t => ({
          "Data":new Date(t.dueDate).toLocaleDateString("pt-BR"),"Tipo":t.type,
          "Descrição":t.description,"Valor":t.amount,"Categoria":t.category??"—","Exportado em":now,
        })),
      },
      {
        name: "Produtos",
        data: products.map(p => ({
          "Nome":p.name,"SKU":p.sku||"—","Preço":p.price,"Estoque":p.stock??0,"Exportado em":now,
        })),
      },
    ], `MATILHA_Backup_Completo_${new Date().toISOString().split("T")[0]}`);
  },
};

// Helper used by gestao-escola
export async function exportReport(
  title: string,
  rows: Record<string, unknown>[],
  fmt: "excel"|"pdf",
  filename: string
): Promise<void> {
  if (fmt === "excel") return exportToExcel(rows, `MATILHA_${filename}`);
  const cols = Object.keys(rows[0] ?? {}).map(k => ({ header: k, dataKey: k }));
  return exportToPDF(title, cols, rows, `MATILHA_${filename}`);
}
