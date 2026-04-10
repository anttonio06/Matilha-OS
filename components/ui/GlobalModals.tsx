"use client";

import React, { useState } from "react";
import {
  CalendarDays, Dog, Users, CreditCard, Hotel, ShoppingBag,
  BarChart3, MessageSquare, CheckCircle
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useStore, store } from "@/lib/store";
import { Modal, Button, Input, Select } from "@/components/ui/index";
import { DogDB, TutorDB, TransactionDB, ProductDB, PlanDB, useDB, KEYS } from "@/lib/db";
import type { Plan } from "@/types";
import {
  ModalNovoAgendamento,
  ModalNovoTutor,
  ModalNovaReserva,
  ModalEnviarMensagem,
} from "@/components/modals";

// ─── Shared field row ─────────────────────────────────────────────────────────
function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <div className={cn("grid gap-3", cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-2" : "grid-cols-3")}>
      {children}
    </div>
  );
}

// ─── Modal: Novo Cão ─────────────────────────────────────────────────────────

function ModalNovoCao({ onClose }: { onClose: () => void }) {
  const tutors = useDB(() => TutorDB.list());
  const [form, setForm] = useState({
    name: "", breed: "", sex: "macho", birthDate: "", weight: "",
    size: "medio", neutered: false, tutorId: "",
    energyLevel: "moderada", socialLevel: "sociavel",
    foodBrand: "", foodAmount: "", medicalRestrictions: "", behavioralRestrictions: "",
  });

  const submit = () => {
    if (!form.name || !form.tutorId) return store.toast("warning", "Preencha nome e tutor.");
    DogDB.create({
      name: form.name, breed: form.breed,
      sex: form.sex as "macho" | "femea",
      birthDate: form.birthDate, weight: Number(form.weight) || 0,
      size: form.size as "mini"|"pequeno"|"medio"|"grande"|"gigante",
      neutered: form.neutered, tutorId: form.tutorId,
      energyLevel: form.energyLevel as "baixa"|"moderada"|"alta"|"muito_alta",
      socialLevel: form.socialLevel as "reservado"|"seletivo"|"sociavel"|"muito_sociavel",
      foodBrand: form.foodBrand, foodAmount: form.foodAmount,
      medicalRestrictions: form.medicalRestrictions,
      behavioralRestrictions: form.behavioralRestrictions,
      vaccines: [], tags: [],
    });
    onClose();
    store.toast("success", `${form.name} cadastrado! Não esqueça de adicionar as vacinas.`);
  };

  return (
    <Modal open onClose={onClose} size="xl" title="Novo Cão"
      description="Perfil completo do animal"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} icon={<CheckCircle className="w-4 h-4" />}>Salvar cão</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldRow cols={3}>
          <Input label="Nome do cão *" placeholder="Ex: Thor"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Raça" placeholder="Ex: Golden Retriever"
            value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} />
          <Select label="Tutor responsável *" value={form.tutorId}
            options={[{ value: "", label: "Selecionar tutor..." }, ...tutors.map(t => ({ value: t.id, label: t.name }))]}
            onChange={e => setForm(f => ({ ...f, tutorId: e.target.value }))} />
        </FieldRow>
        <FieldRow cols={3}>
          <Select label="Sexo" value={form.sex}
            options={[{ value: "macho", label: "Macho" }, { value: "femea", label: "Fêmea" }]}
            onChange={e => setForm(f => ({ ...f, sex: e.target.value }))} />
          <Select label="Porte" value={form.size}
            options={["mini","pequeno","medio","grande","gigante"].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
            onChange={e => setForm(f => ({ ...f, size: e.target.value }))} />
          <Input label="Peso (kg)" type="number" placeholder="Ex: 28.5"
            value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
        </FieldRow>
        <FieldRow>
          <Input label="Data de nascimento" type="date" value={form.birthDate}
            onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Castrado</label>
            <div className="flex gap-3 h-9 items-center">
              {[["Sim", true], ["Não", false]].map(([l, v]) => (
                <label key={String(l)} className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input type="radio" name="neutered" className="accent-forest-600"
                    checked={form.neutered === v} onChange={() => setForm(f => ({ ...f, neutered: v as boolean }))} />
                  {String(l)}
                </label>
              ))}
            </div>
          </div>
        </FieldRow>
        <FieldRow>
          <Select label="Nível de energia" value={form.energyLevel}
            options={["baixa","moderada","alta","muito_alta"].map(v => ({ value: v, label: v.replace("_"," ").replace(/^\w/, c => c.toUpperCase()) }))}
            onChange={e => setForm(f => ({ ...f, energyLevel: e.target.value }))} />
          <Select label="Sociabilidade" value={form.socialLevel}
            options={["reservado","seletivo","sociavel","muito_sociavel"].map(v => ({ value: v, label: v.replace("_"," ").replace(/^\w/, c => c.toUpperCase()) }))}
            onChange={e => setForm(f => ({ ...f, socialLevel: e.target.value }))} />
        </FieldRow>
        <FieldRow>
          <Input label="Ração (marca)" placeholder="Ex: Royal Canin"
            value={form.foodBrand} onChange={e => setForm(f => ({ ...f, foodBrand: e.target.value }))} />
          <Input label="Quantidade / frequência" placeholder="Ex: 300g 2x ao dia"
            value={form.foodAmount} onChange={e => setForm(f => ({ ...f, foodAmount: e.target.value }))} />
        </FieldRow>
        <Input label="Restrições de saúde" placeholder="Alergias, medicamentos, cirurgias..."
          value={form.medicalRestrictions} onChange={e => setForm(f => ({ ...f, medicalRestrictions: e.target.value }))} />
        <Input label="Restrições comportamentais" placeholder="Reatividade, medos, gatilhos..."
          value={form.behavioralRestrictions} onChange={e => setForm(f => ({ ...f, behavioralRestrictions: e.target.value }))} />
      </div>
    </Modal>
  );
}

// ─── Modal: Novo Plano ────────────────────────────────────────────────────────

function ModalNovoPlano({ onClose }: { onClose: () => void }) {
  const dogs = useDB(() => DogDB.list());
  const [form, setForm] = useState({
    dogId: "", tutorId: "", templateName: "Plano Creche Essencial",
    category: "creche", totalUses: "12", price: "490",
    validFrom: new Date().toISOString().split("T")[0], recurrent: true, notes: "",
  });

  const dog = dogs.find(d => d.id === form.dogId);

  const templates = [
    { name: "Plano Creche Essencial", category: "creche", uses: 12, price: 490 },
    { name: "Plano Creche Gold",       category: "creche", uses: 20, price: 890 },
    { name: "Combo Creche + Banho",    category: "combo",  uses: 16, price: 650 },
    { name: "Banho Mensal",            category: "banho",  uses: 4,  price: 180 },
    { name: "Escola — 8 sessões",      category: "escola", uses: 8,  price: 720 },
    { name: "Personalizado",           category: "creche", uses: 0,  price: 0   },
  ];

  const applyTemplate = (name: string) => {
    const tpl = templates.find(t => t.name === name);
    if (tpl && tpl.uses > 0) setForm(f => ({ ...f, templateName: name, category: tpl.category, totalUses: String(tpl.uses), price: String(tpl.price) }));
    else setForm(f => ({ ...f, templateName: name }));
  };

  const submit = () => {
    if (!form.dogId) return store.toast("warning", "Selecione o cão para o plano.");
    PlanDB.create({
      dogId:     form.dogId,
      tutorId:   form.tutorId,
      name:      form.templateName,
      category:  form.category as Plan["category"],
      totalUses: Number(form.totalUses) || undefined,
      usedUses:  0,
      price:     Number(form.price),
      validFrom:        form.validFrom,
      validUntil:       new Date(new Date(form.validFrom).getTime() + 30 * 86_400_000).toISOString().split("T")[0],
      includedServices: [form.category] as Plan["includedServices"],
      status:    "ativo",
      recurrent: form.recurrent,
      notes:     form.notes || undefined,
    });
    store.toast("success", `${form.templateName} emitido para ${dog?.name}! Valor: ${formatCurrency(Number(form.price))}`);
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="lg" title="Emitir Plano / Assinatura"
      description="Configure e ative um novo plano"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} icon={<CreditCard className="w-4 h-4" />}>Emitir plano</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Template</p>
          <div className="grid grid-cols-3 gap-2">
            {templates.map(tpl => (
              <button key={tpl.name} onClick={() => applyTemplate(tpl.name)}
                className={cn("text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                  form.templateName === tpl.name
                    ? "border-forest-500 bg-forest-50 text-forest-800"
                    : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                )}>
                {tpl.name}
                {tpl.price > 0 && <p className="font-bold text-forest-600 mt-0.5">{formatCurrency(tpl.price)}/mês</p>}
              </button>
            ))}
          </div>
        </div>
        <FieldRow>
          <Select label="Cão *" value={form.dogId}
            options={[{ value: "", label: "Selecionar cão..." }, ...dogs.map(d => ({ value: d.id, label: d.name }))]}
            onChange={e => {
              const d = dogs.find(x => x.id === e.target.value);
              setForm(f => ({ ...f, dogId: e.target.value, tutorId: d?.tutorId ?? "" }));
            }} />
          <Select label="Categoria" value={form.category}
            options={["creche","banho","combo","hotel","escola","avulso"].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
        </FieldRow>
        <FieldRow cols={3}>
          <Input label="Total de usos" type="number" value={form.totalUses}
            onChange={e => setForm(f => ({ ...f, totalUses: e.target.value }))} />
          <Input label="Valor (R$)" type="number" value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          <Input label="Vigência a partir de" type="date" value={form.validFrom}
            onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
        </FieldRow>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-forest-600 rounded"
            checked={form.recurrent} onChange={e => setForm(f => ({ ...f, recurrent: e.target.checked }))} />
          <span className="text-sm text-gray-700">Renovação automática mensal</span>
        </label>
        <Input label="Observações" placeholder="Condições especiais, desconto acordado..."
          value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
    </Modal>
  );
}

// ─── Modal: Novo Lançamento Financeiro ───────────────────────────────────────

function ModalNovoLancamento({ onClose }: { onClose: () => void }) {
  const tutors = useDB(() => TutorDB.list());
  const [form, setForm] = useState({
    type: "receita", description: "", amount: "",
    category: "creche", method: "pix", dueDate: new Date().toISOString().split("T")[0],
    tutorId: "", notes: "",
  });

  const submit = () => {
    if (!form.description || !form.amount) return store.toast("warning", "Preencha descrição e valor.");
    TransactionDB.create({
      type: form.type as "receita"|"despesa",
      description: form.description,
      category: form.category as "creche"|"banho"|"hotel"|"escola"|"produto"|"outros",
      amount: Number(form.amount),
      status: "pendente" as const,
      method: form.method as "pix"|"cartao_credito"|"cartao_debito"|"dinheiro"|"plano",
      tutorId: form.tutorId || undefined,
      dueDate: form.dueDate,
    });
    onClose();
    const isReceita = form.type === "receita";
    store.toast("success", `${isReceita ? "Receita" : "Despesa"} lançada — ${formatCurrency(Number(form.amount))}`);
  };

  return (
    <Modal open onClose={onClose} size="md" title="Novo Lançamento"
      description="Registrar receita ou despesa"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} icon={<CheckCircle className="w-4 h-4" />}>Lançar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[["receita","Receita"], ["despesa","Despesa"]].map(([v, l]) => (
            <button key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
              className={cn("py-3 rounded-xl border-2 text-sm font-semibold transition-all",
                form.type === v
                  ? v === "receita" ? "border-green-500 bg-green-50 text-green-800" : "border-red-500 bg-red-50 text-red-800"
                  : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
              )}>
              {v === "receita" ? "↓" : "↑"} {l}
            </button>
          ))}
        </div>
        <Input label="Descrição *" placeholder="Ex: Plano Creche — Felipe M."
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <FieldRow>
          <Input label="Valor (R$) *" type="number" placeholder="0,00"
            value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <Select label="Categoria" value={form.category}
            options={["creche","banho","hotel","escola","produto","outros"].map(v => ({ value: v, label: v.replace(/^\w/, c => c.toUpperCase()) }))}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
        </FieldRow>
        <FieldRow>
          <Select label="Forma de pagamento" value={form.method}
            options={[
              { value: "pix", label: "PIX" },
              { value: "cartao_credito", label: "Cartão Crédito" },
              { value: "cartao_debito", label: "Cartão Débito" },
              { value: "dinheiro", label: "Dinheiro" },
            ]}
            onChange={e => setForm(f => ({ ...f, method: e.target.value }))} />
          <Input label="Vencimento" type="date" value={form.dueDate}
            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        </FieldRow>
        <Select label="Tutor (opcional)" value={form.tutorId}
          options={[{ value: "", label: "Nenhum / Despesa interna" }, ...tutors.map(t => ({ value: t.id, label: t.name }))]}
          onChange={e => setForm(f => ({ ...f, tutorId: e.target.value }))} />
      </div>
    </Modal>
  );
}

// ─── Modal: Novo Produto ──────────────────────────────────────────────────────

function ModalNovoProduto({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", category: "petisco", price: "", stock: "", unit: "un",
    description: "", sku: "",
  });

  const submit = () => {
    if (!form.name || !form.price) return store.toast("warning", "Preencha nome e preço.");
    ProductDB.create({
      name: form.name,
      category: form.category as "petisco"|"mordedor"|"enriquecimento"|"higiene"|"acessorio"|"suplemento"|"outro",
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      unit: form.unit,
      sku: form.sku || undefined,
      description: form.description || undefined,
      active: true,
    });
    onClose();
    store.toast("success", `${form.name} adicionado ao estoque!`);
  };

  return (
    <Modal open onClose={onClose} size="md" title="Novo Produto" description="Adicionar ao catálogo da loja"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} icon={<ShoppingBag className="w-4 h-4" />}>Salvar produto</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Nome do produto *" placeholder="Ex: Mordedor de Couro Cru"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <FieldRow>
          <Select label="Categoria" value={form.category}
            options={["petisco","mordedor","enriquecimento","higiene","acessorio","suplemento","outro"].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          <Input label="SKU / Código" placeholder="Ex: PROD-001"
            value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
        </FieldRow>
        <FieldRow cols={3}>
          <Input label="Preço (R$) *" type="number" placeholder="0,00"
            value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          <Input label="Estoque inicial" type="number" placeholder="0"
            value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
          <Select label="Unidade" value={form.unit}
            options={[{ value: "un", label: "Unidade" }, { value: "pct", label: "Pacote" }, { value: "kg", label: "Kg" }]}
            onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
        </FieldRow>
        <Input label="Descrição" placeholder="Breve descrição do produto"
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
    </Modal>
  );
}

// ─── Modal: Quick Add ─────────────────────────────────────────────────────────

function ModalQuickAdd({ onClose }: { onClose: () => void }) {
  const actions = [
    { icon: <CalendarDays className="w-5 h-5" />, label: "Novo agendamento",  sub: "Creche, banho, escola, hotel", modal: "novo_agendamento", color: "text-forest-600 bg-forest-50" },
    { icon: <Dog          className="w-5 h-5" />, label: "Cadastrar cão",      sub: "Novo perfil de animal",        modal: "novo_cao",          color: "text-amber-600  bg-amber-50" },
    { icon: <Users        className="w-5 h-5" />, label: "Novo tutor",         sub: "Cadastro de responsável",      modal: "novo_tutor",         color: "text-blue-600   bg-blue-50" },
    { icon: <CreditCard   className="w-5 h-5" />, label: "Emitir plano",       sub: "Assinatura ou pacote",         modal: "novo_plano",         color: "text-purple-600 bg-purple-50" },
    { icon: <Hotel        className="w-5 h-5" />, label: "Reservar hotel",     sub: "Nova hospedagem",              modal: "nova_reserva",       color: "text-rose-600   bg-rose-50" },
    { icon: <BarChart3    className="w-5 h-5" />, label: "Lançamento financeiro",sub: "Receita ou despesa",         modal: "novo_lancamento",    color: "text-teal-600   bg-teal-50" },
    { icon: <ShoppingBag  className="w-5 h-5" />, label: "Novo produto",       sub: "Adicionar ao estoque",         modal: "novo_produto",       color: "text-orange-600 bg-orange-50" },
    { icon: <MessageSquare className="w-5 h-5" />, label: "Enviar mensagem",   sub: "WhatsApp ou e-mail",           modal: "enviar_mensagem",    color: "text-indigo-600 bg-indigo-50" },
  ] as const;

  return (
    <Modal open onClose={onClose} size="md" title="Ação rápida" description="O que você quer fazer agora?">
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button key={a.modal} onClick={() => { onClose(); store.openModal(a.modal as any); }}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-left group">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", a.color)}>
              {a.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{a.label}</p>
              <p className="text-2xs text-gray-400 truncate">{a.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export function GlobalModals() {
  const s = useStore();
  const close = () => store.closeModal();

  if (!s.modal) return null;

  return (
    <>
      {s.modal === "quick_add"        && <ModalQuickAdd            onClose={close} />}
      {s.modal === "novo_agendamento" && <ModalNovoAgendamento     onClose={close} />}
      {s.modal === "novo_tutor"       && <ModalNovoTutor           onClose={close} />}
      {s.modal === "novo_cao"         && <ModalNovoCao             onClose={close} />}
      {s.modal === "novo_plano"       && <ModalNovoPlano           onClose={close} />}
      {s.modal === "nova_reserva"     && <ModalNovaReserva         onClose={close} />}
      {s.modal === "novo_lancamento"  && <ModalNovoLancamento      onClose={close} />}
      {s.modal === "novo_produto"     && <ModalNovoProduto         onClose={close} />}
      {s.modal === "enviar_mensagem"  && (
        <ModalEnviarMensagem
          onClose={close}
          prefillTutorId={s.modalData?.tutorId as string | undefined}
        />
      )}
    </>
  );
}
