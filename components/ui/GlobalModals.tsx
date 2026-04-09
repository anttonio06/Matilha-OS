"use client";

import React, { useState } from "react";
import {
  CalendarDays, Dog, Users, CreditCard, Hotel, ShoppingBag,
  BarChart3, AlertTriangle, MessageSquare,
  CheckCircle, Phone, Mail, Send
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useStore, store } from "@/lib/store";
import { Modal, Button, Input, Select } from "@/components/ui/index";
import { DogDB, TutorDB, useDB } from "@/lib/db";

// ─── Shared field row ─────────────────────────────────────────────────────────
function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <div className={cn("grid gap-3", cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-2" : "grid-cols-3")}>
      {children}
    </div>
  );
}

// ─── Modal: Novo Agendamento ─────────────────────────────────────────────────

function ModalNovoAgendamento({ onClose }: { onClose: () => void }) {
  const dogs   = useDB(() => DogDB.list());
  const tutors = useDB(() => TutorDB.list());
  const team   = useDB(() => TutorDB.list()); // reuse pattern
  const [form, setForm] = useState({
    dogId: "", tutorId: "", service: "creche", date: new Date().toISOString().split("T")[0],
    time: "09:00", professional: "", notes: "", plano: false,
  });
  const [step, setStep] = useState<"form" | "confirm">("form");

  const dog   = dogs.find(d => d.id === form.dogId);
  const tutor = tutors.find(t => t.id === form.tutorId);

  const serviceOptions = [
    { value: "creche",    label: "Creche" },
    { value: "banho",     label: "Banho" },
    { value: "banho_tosa",label: "Banho & Tosa" },
    { value: "hotel",     label: "Hotel" },
    { value: "escola",    label: "Escola / Sessão" },
    { value: "tosa",      label: "Tosa" },
    { value: "avaliacao", label: "Avaliação comportamental" },
  ];

  const submit = () => {
    onClose();
    store.toast("success", `Agendamento criado — ${dog?.name ?? "Cão"} · ${form.service} · ${form.date}`);
  };

  return (
    <Modal open onClose={onClose} size="lg" title="Novo Agendamento"
      description="Preencha os dados do atendimento"
      footer={
        step === "form" ? (
          <>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => setStep("confirm")} disabled={!form.dogId || !form.date}>
              Revisar →
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setStep("form")}>← Editar</Button>
            <Button onClick={submit} icon={<CheckCircle className="w-4 h-4" />}>
              Confirmar agendamento
            </Button>
          </>
        )
      }
    >
      {step === "form" ? (
        <div className="space-y-4">
          <FieldRow>
            <Select label="Cão *"
              options={[{ value: "", label: "Selecionar cão..." }, ...dogs.map(d => ({ value: d.id, label: d.name }))]}
              value={form.dogId}
              onChange={e => {
                const d = dogs.find(x => x.id === e.target.value);
                setForm(f => ({ ...f, dogId: e.target.value, tutorId: d?.tutorId ?? "" }));
              }}
            />
            <Select label="Tutor"
              options={[{ value: "", label: "Auto por cão" }, ...tutors.map(t => ({ value: t.id, label: t.name }))]}
              value={form.tutorId}
              onChange={e => setForm(f => ({ ...f, tutorId: e.target.value }))}
            />
          </FieldRow>
          <FieldRow>
            <Select label="Serviço *" options={serviceOptions} value={form.service}
              onChange={e => setForm(f => ({ ...f, service: e.target.value }))} />
            <Select label="Profissional"
              options={[{ value: "", label: "Qualquer disponível" }, ...team.map(t => ({ value: t.id, label: t.name }))]}
              value={form.professional}
              onChange={e => setForm(f => ({ ...f, professional: e.target.value }))}
            />
          </FieldRow>
          <FieldRow>
            <Input label="Data *" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Input label="Horário *" type="time" value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </FieldRow>
          <Input label="Observações" placeholder="Instrução especial, restrição, recado..."
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-forest-600 rounded"
              checked={form.plano} onChange={e => setForm(f => ({ ...f, plano: e.target.checked }))} />
            <span className="text-sm text-gray-700">Abater de plano ativo</span>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-forest-50 border border-forest-100 rounded-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">Confirmação</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Cão",      dog?.name ?? "—"],
                ["Tutor",    tutor?.name ?? "—"],
                ["Serviço",  form.service.replace("_", " ")],
                ["Data",     form.date],
                ["Horário",  form.time],
                ["Plano",    form.plano ? "Sim — abater" : "Não"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-forest-600">{k}</p>
                  <p className="font-semibold text-forest-900 capitalize">{v}</p>
                </div>
              ))}
            </div>
          </div>
          {dog?.behavioralRestrictions && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{dog.behavioralRestrictions}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Modal: Novo Tutor ────────────────────────────────────────────────────────

function ModalNovoTutor({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", whatsapp: "", source: "Instagram",
    preferredContact: "whatsapp" as "whatsapp" | "email" | "phone", notes: "",
  });

  const submit = () => {
    if (!form.name || !form.phone) return store.toast("warning", "Preencha nome e telefone.");
    TutorDB.create({
      name: form.name, email: form.email, phone: form.phone,
      whatsapp: form.whatsapp || form.phone, source: form.source,
      preferredContact: form.preferredContact, notes: form.notes,
      dogs: [], activePlans: [], totalSpent: 0, ltv: 0, status: "ativo",
    });
    onClose();
    store.toast("success", `Tutor ${form.name} cadastrado com sucesso!`);
  };

  return (
    <Modal open onClose={onClose} size="lg" title="Novo Tutor"
      description="Cadastro do responsável pelo cão"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} icon={<CheckCircle className="w-4 h-4" />}>Salvar tutor</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Nome completo *" placeholder="Ex: Felipe Marcondes"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <FieldRow>
          <Input label="E-mail" type="email" placeholder="email@exemplo.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Telefone / WhatsApp *" placeholder="(11) 99000-0000"
            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value, whatsapp: e.target.value }))} />
        </FieldRow>
        <FieldRow>
          <Select label="Origem / Canal" value={form.source}
            options={["Instagram","Indicação","Google","Loja","Site","Outro"].map(v => ({ value: v, label: v }))}
            onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
          <Select label="Contato preferencial" value={form.preferredContact}
            options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "email", label: "E-mail" }, { value: "phone", label: "Telefone" }]}
            onChange={e => setForm(f => ({ ...f, preferredContact: e.target.value as "whatsapp"|"email"|"phone" }))} />
        </FieldRow>
        <Input label="Observações" placeholder="Preferências, contexto familiar..."
          value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
    </Modal>
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
    onClose();
    store.toast("success", `${form.templateName} emitido para ${dog?.name}! Valor: ${formatCurrency(Number(form.price))}`);
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

// ─── Modal: Nova Reserva Hotel ────────────────────────────────────────────────

function ModalNovaReserva({ onClose }: { onClose: () => void }) {
  const dogs = useDB(() => DogDB.list());
  const today    = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // Load rates from hotel config
  const hotelCfg = (() => {
    try { return JSON.parse(localStorage.getItem("matilha:hotel:config") ?? "{}"); } catch { return {}; }
  })();
  const schoolRate    = hotelCfg.schoolStudentRate ?? 95;
  const nonStudentRate = hotelCfg.nonStudentRate   ?? 130;

  const [form, setForm] = useState({
    dogId:        "",
    isSchoolStudent: false,
    checkIn:      today,
    checkOut:     nextWeek,
    food:         "",
    medications:  "",
    allergyAlert: "",
    belongingsList: [""] as string[],
    exitBath:     false,
    notes:        "",
  });

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const dog = dogs.find(d => d.id === form.dogId);
  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000))
    : 0;
  const pricePerNight = form.isSchoolStudent ? schoolRate : nonStudentRate;
  const total = nights * pricePerNight;

  const addBelonging   = () => setForm(f => ({ ...f, belongingsList: [...f.belongingsList, ""] }));
  const updateBelonging = (i: number, val: string) => setForm(f => ({
    ...f, belongingsList: f.belongingsList.map((b, idx) => idx === i ? val : b),
  }));
  const removeBelonging = (i: number) => setForm(f => ({
    ...f, belongingsList: f.belongingsList.filter((_, idx) => idx !== i),
  }));

  const submit = () => {
    if (!form.dogId || !form.checkIn || !form.checkOut)
      return store.toast("warning", "Preencha cão, check-in e check-out.");
    const { HotelDB } = require("@/lib/db");
    HotelDB.create({
      dogId:          form.dogId,
      tutorId:        dog?.tutorId ?? "",
      roomType:       "standard",
      checkIn:        form.checkIn,
      checkOut:       form.checkOut,
      status:         "reservado",
      food:           form.food,
      medications:    form.medications || undefined,
      allergyAlert:   form.allergyAlert || undefined,
      belongingsList: form.belongingsList.filter(b => b.trim()),
      isSchoolStudent:form.isSchoolStudent,
      exitBath:       form.exitBath,
      notes:          form.notes,
      price:          total,
    });
    store.toast("success", `Reserva criada — ${dog?.name}, ${nights} noite${nights !== 1 ? "s" : ""} · ${formatCurrency(total)}`);
    onClose();
  };

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 bg-white";

  return (
    <Modal open onClose={onClose} size="lg" title="Nova Reserva — Hotel"
      description="Configure a hospedagem completa"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} icon={<Hotel className="w-4 h-4" />}>Confirmar reserva</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Cão */}
        <FieldRow>
          <Select label="Cão *" value={form.dogId}
            options={[{ value: "", label: "Selecionar cão..." }, ...dogs.map(d => ({ value: d.id, label: d.name }))]}
            onChange={e => set("dogId", e.target.value)} />
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Aluno da Escola</label>
            <div className="flex gap-2">
              {[{ v: true, label: `Sim — R$${schoolRate}/noite` }, { v: false, label: `Não — R$${nonStudentRate}/noite` }].map(({ v, label }) => (
                <button key={String(v)} type="button" onClick={() => set("isSchoolStudent", v)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all",
                    form.isSchoolStudent === v
                      ? v ? "border-forest-500 bg-forest-50 text-forest-700" : "border-gray-400 bg-gray-50 text-gray-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </FieldRow>

        {/* Datas */}
        <FieldRow>
          <Input label="Check-in *" type="date" value={form.checkIn}
            onChange={e => set("checkIn", e.target.value)} />
          <Input label="Check-out *" type="date" value={form.checkOut}
            onChange={e => set("checkOut", e.target.value)} />
        </FieldRow>

        {nights > 0 && (
          <div className="flex items-center gap-3 p-3 bg-forest-50 border border-forest-100 rounded-lg">
            <div className="flex-1">
              <span className="text-sm text-forest-700">
                <strong>{nights} noite{nights !== 1 ? "s" : ""}</strong>
                {" · "}{form.isSchoolStudent ? "Aluno da Escola" : "Não aluno"}
              </span>
            </div>
            <span className="text-lg font-bold text-forest-700">{formatCurrency(total)}</span>
          </div>
        )}

        {/* Alimentação */}
        <Input label="Alimentação" placeholder="Ex: Biofresh 350g 2x ao dia (7h e 18h)"
          value={form.food} onChange={e => set("food", e.target.value)} />

        {/* Alertas críticos */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center gap-1.5">
            🔴 Alertas críticos (visíveis para toda equipe)
          </p>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Medicação (nome, dose, horário)</label>
            <input className={inputCls} placeholder="Ex: Apoquel 16mg, 1 comprimido às 8h e 20h"
              value={form.medications} onChange={e => set("medications", e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Alergias (alimentar, ambiental, medicamentosa)</label>
            <input className={inputCls} placeholder="Ex: Alergia a frango, amendoim, perfumes com álcool..."
              value={form.allergyAlert} onChange={e => set("allergyAlert", e.target.value)}/>
          </div>
        </div>

        {/* Pertences */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block flex items-center gap-1.5">
            📦 Pertences (lista para conferência no check-out)
          </label>
          <div className="space-y-2">
            {form.belongingsList.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputCls} placeholder={`Item ${i+1}: cama, brinquedo, mantinha...`}
                  value={item} onChange={e => updateBelonging(i, e.target.value)}/>
                {form.belongingsList.length > 1 && (
                  <button onClick={() => removeBelonging(i)}
                    className="text-red-400 hover:text-red-600 px-2 transition-colors flex-shrink-0">✕</button>
                )}
              </div>
            ))}
            <button onClick={addBelonging}
              className="text-xs text-forest-600 hover:text-forest-700 font-semibold flex items-center gap-1">
              + Adicionar item
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-forest-600 rounded"
            checked={form.exitBath} onChange={e => set("exitBath", e.target.checked)} />
          <span className="text-sm text-gray-700">Agendar banho de saída</span>
        </label>

        <Input label="Observações gerais" placeholder="Informações adicionais..."
          value={form.notes} onChange={e => set("notes", e.target.value)} />
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
    const { TransactionDB } = require("@/lib/db");
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
    const { ProductDB } = require("@/lib/db");
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

// ─── Modal: Enviar Mensagem ───────────────────────────────────────────────────

function getWAConfig() {
  try { return JSON.parse(localStorage.getItem("matilha:wa:config") ?? "{}"); } catch { return {}; }
}

function ModalEnviarMensagem({ onClose, prefillTutorId }: { onClose: () => void; prefillTutorId?: string }) {
  const tutors = useDB(() => TutorDB.list());
  const dogs   = useDB(() => DogDB.list());
  const [form, setForm] = useState({
    tutorId:  prefillTutorId ?? "",
    template: "renovacao",
    custom:   "",
    channel:  "whatsapp",
  });
  const [sending, setSending] = useState(false);

  const TEMPLATES: Record<string, string> = {
    renovacao:   "Olá, {tutor}! 🐾 O plano de {cão} está próximo do limite. Gostaria de renovar? Podemos ajudar!",
    checkin:     "Olá, {tutor}! {cão} chegou bem e já está curtindo o dia com a turma! 😄",
    checkout:    "Olá, {tutor}! {cão} foi um amor hoje. Estamos aguardando vocês na próxima vez! 🐕",
    vacina:      "Olá, {tutor}! 💉 Lembrete: a vacina de {cão} vence em breve. Precisa de ajuda para agendar?",
    aniversario: "Feliz aniversário para {cão}! 🎂🎉 Hoje tem petisco especial por conta da Matilha! Aproveitem!",
    upsell:      "Olá, {tutor}! Temos uma novidade especial para {cão} esta semana. Posso te contar mais? 🌟",
    cobranca:    "Olá, {tutor}! Identificamos um pagamento em aberto. Pode nos acionar? Obrigado! 🙏",
    custom:      "",
  };

  const tutor     = tutors.find(t => t.id === form.tutorId);
  const tutorDogs = dogs.filter(d => d.tutorId === form.tutorId);
  const dog       = tutorDogs[0];

  const text = (() => {
    if (form.template === "custom") return form.custom;
    return (TEMPLATES[form.template] ?? "")
      .replace("{tutor}", tutor?.name.split(" ")[0] ?? "Tutor")
      .replace("{cão}", dog?.name ?? "seu pet");
  })();

  const waNum = (tutor?.whatsapp || tutor?.phone || "").replace(/\D/g, "");

  const sendViaAPI = async () => {
    const cfg = getWAConfig();
    if (!cfg.token || !cfg.phoneId) return false;
    setSending(true);
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${cfg.phoneId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: `55${waNum}`,
          type: "text",
          text: { body: text },
        }),
      });
      setSending(false);
      return res.ok;
    } catch {
      setSending(false);
      return false;
    }
  };

  const submit = async () => {
    if (!tutor) return store.toast("warning", "Selecione um tutor.");
    if (!text.trim()) return store.toast("warning", "A mensagem está vazia.");

    if (form.channel === "whatsapp") {
      const cfg = getWAConfig();
      if (cfg.token && cfg.phoneId && waNum) {
        const ok = await sendViaAPI();
        if (ok) { store.toast("success", `Mensagem enviada via API para ${tutor.name}!`); onClose(); return; }
        store.toast("warning", "Falha na API — abrindo WhatsApp Web.");
      }
      if (waNum) {
        window.open(`https://wa.me/55${waNum}?text=${encodeURIComponent(text)}`, "_blank");
        store.toast("success", `WhatsApp aberto para ${tutor.name} (${tutor.whatsapp || tutor.phone})`);
        onClose();
      } else {
        store.toast("error", "Número de WhatsApp não cadastrado para este tutor.");
      }
    } else {
      if (tutor.email) {
        window.open(`mailto:${tutor.email}?subject=Matilha - Mensagem&body=${encodeURIComponent(text)}`);
        store.toast("success", `E-mail aberto para ${tutor.name}`);
        onClose();
      } else {
        store.toast("error", "E-mail não cadastrado para este tutor.");
      }
    }
  };

  return (
    <Modal open onClose={onClose} size="lg" title="Enviar Mensagem"
      description="Comunicação direta com tutores"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={sending}
            icon={sending
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              : <Send className="w-4 h-4"/>}>
            {sending ? "Enviando..." : form.channel === "whatsapp" ? "Enviar WhatsApp" : "Abrir e-mail"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Tutor selector */}
        <FieldRow>
          <Select label="Tutor *" value={form.tutorId}
            options={[{ value:"", label:"Selecionar tutor..." }, ...tutors.map(t => ({ value: t.id, label: t.name }))]}
            onChange={e => setForm(f => ({ ...f, tutorId: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Canal</label>
            <div className="flex gap-2 h-9 items-center">
              {([["whatsapp","WhatsApp",<Phone key="p" className="w-3.5 h-3.5"/>],["email","E-mail",<Mail key="m" className="w-3.5 h-3.5"/>]] as const).map(([v,l,icon]) => (
                <button key={v} onClick={() => setForm(f => ({ ...f, channel: v }))}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    form.channel === v ? "border-forest-500 bg-forest-50 text-forest-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}>
                  {icon} {l}
                </button>
              ))}
            </div>
          </div>
        </FieldRow>

        {/* Tutor info strip */}
        {tutor && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-forest-700">{tutor.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{tutor.name}</p>
              <p className="text-xs text-gray-500">
                {tutor.whatsapp || tutor.phone || "Sem número"} · {tutor.email || "Sem e-mail"}
              </p>
            </div>
            {tutorDogs.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end">
                {tutorDogs.map(d => (
                  <span key={d.id} className="text-2xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full font-semibold">{d.name}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Templates */}
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Modelo de mensagem</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id:"renovacao",   label:"Renovação"    },
              { id:"checkin",     label:"Check-in"     },
              { id:"checkout",    label:"Check-out"    },
              { id:"vacina",      label:"Vacina"       },
              { id:"aniversario", label:"Aniversário"  },
              { id:"upsell",      label:"Oferta"       },
              { id:"cobranca",    label:"Cobrança"     },
              { id:"custom",      label:"Personalizada"},
            ].map(tpl => (
              <button key={tpl.id} onClick={() => setForm(f => ({ ...f, template: tpl.id }))}
                className={cn("px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all",
                  form.template === tpl.id
                    ? "border-forest-500 bg-forest-50 text-forest-700"
                    : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                )}>
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Mensagem</label>
          <textarea
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 resize-none"
            rows={4}
            value={form.template === "custom" ? form.custom : text}
            onChange={e => { if (form.template === "custom") setForm(f => ({ ...f, custom: e.target.value })); }}
            readOnly={form.template !== "custom"}
          />
          <p className="text-2xs text-gray-400 mt-1">{text.length} caracteres</p>
        </div>

        {/* WA config warning */}
        {form.channel === "whatsapp" && (() => {
          const cfg = getWAConfig();
          if (!cfg.token || !cfg.phoneId) return (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"/>
              <p className="text-xs text-amber-700">
                API do WhatsApp não configurada. A mensagem será aberta no WhatsApp Web.
                Configure em <strong>CRM → Integrações</strong> para envio direto.
              </p>
            </div>
          );
          return (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0"/>
              <p className="text-xs text-green-700 font-medium">API do WhatsApp configurada — envio direto ativo.</p>
            </div>
          );
        })()}
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
      {s.modal === "enviar_mensagem"  && <ModalEnviarMensagem      onClose={close} />}
    </>
  );
}
