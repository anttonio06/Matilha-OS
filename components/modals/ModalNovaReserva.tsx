"use client";

import React, { useState } from "react";
import { Hotel } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { store } from "@/lib/store";
import { AppointmentDB, DogDB, HotelDB, useDB } from "@/lib/db";
import { Modal, Button, Input, Select } from "@/components/ui/index";
import { FieldRow } from "./shared";
import { KEYS } from "@/lib/db";

function loadHotelConfig() {
  try { return JSON.parse(localStorage.getItem("matilha:hotel:config") ?? "{}"); }
  catch { return {}; }
}

const INPUT_CLS = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 bg-white";

export function ModalNovaReserva({ onClose }: { onClose: () => void }) {
  const dogs    = useDB(() => DogDB.list(), KEYS.dogs);
  const today   = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().split("T")[0];
  const cfg     = loadHotelConfig();

  const SCHOOL_RATE     = cfg.schoolStudentRate ?? 95;
  const NON_SCHOOL_RATE = cfg.nonStudentRate    ?? 130;

  const [form, setForm] = useState({
    dogId:          "",
    isSchoolStudent: false,
    checkIn:        today,
    checkOut:       nextWeek,
    food:           "",
    medications:    "",
    allergyAlert:   "",
    belongingsList: [""] as string[],
    exitBath:       false,
    notes:          "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const dog    = dogs.find(d => d.id === form.dogId);
  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86_400_000))
    : 0;
  const pricePerNight = form.isSchoolStudent ? SCHOOL_RATE : NON_SCHOOL_RATE;
  const total = nights * pricePerNight;

  const addBelonging    = () => setForm(f => ({ ...f, belongingsList: [...f.belongingsList, ""] }));
  const updateBelonging = (i: number, val: string) =>
    setForm(f => ({ ...f, belongingsList: f.belongingsList.map((b, idx) => idx === i ? val : b) }));
  const removeBelonging = (i: number) =>
    setForm(f => ({ ...f, belongingsList: f.belongingsList.filter((_, idx) => idx !== i) }));

  const submit = () => {
    if (!form.dogId || !form.checkIn || !form.checkOut) {
      store.toast("warning", "Preencha cão, check-in e check-out.");
      return;
    }

    const tutorId = dog?.tutorId ?? "";

    HotelDB.create({
      dogId:           form.dogId,
      tutorId,
      roomType:        "standard",
      checkIn:         form.checkIn,
      checkOut:        form.checkOut,
      status:          "reservado",
      food:            form.food,
      medications:     form.medications || undefined,
      allergyAlert:    form.allergyAlert || undefined,
      belongingsList:  form.belongingsList.filter(b => b.trim()),
      isSchoolStudent: form.isSchoolStudent,
      exitBath:        form.exitBath,
      notes:           form.notes,
      price:           total,
    });

    AppointmentDB.create({
      dogId: form.dogId, tutorId, serviceType: "hotel",
      date: form.checkIn, startTime: "08:00", endTime: "09:00", status: "agendado",
      price: total,
      notes: `Check-in hotel · ${nights} noite${nights !== 1 ? "s" : ""}${form.notes ? ` · ${form.notes}` : ""}`,
    });

    AppointmentDB.create({
      dogId: form.dogId, tutorId, serviceType: "hotel",
      date: form.checkOut, startTime: "12:00", endTime: "13:00", status: "agendado",
      notes: `Check-out hotel · ${dog?.name}`,
    });

    if (form.exitBath) {
      AppointmentDB.create({
        dogId: form.dogId, tutorId, serviceType: "banho",
        date: form.checkOut, startTime: "09:00", endTime: "10:30", status: "agendado",
        notes: `Banho de saída — hotel · ${dog?.name}`,
      });
    }

    store.toast("success",
      `Reserva confirmada — ${dog?.name}, ${nights} noite${nights !== 1 ? "s" : ""} · ${formatCurrency(total)}`
    );
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="lg" title="Nova Reserva — Hotel"
      description="Configure a hospedagem completa"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} icon={<Hotel className="w-4 h-4"/>}>Confirmar reserva</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldRow>
          <Select label="Cão *" value={form.dogId}
            options={[{ value: "", label: "Selecionar cão..." }, ...dogs.map(d => ({ value: d.id, label: d.name }))]}
            onChange={e => set("dogId", e.target.value)} />
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Aluno da Escola</label>
            <div className="flex gap-2">
              {[
                { v: true,  label: `Sim — R$${SCHOOL_RATE}/noite`     },
                { v: false, label: `Não — R$${NON_SCHOOL_RATE}/noite` },
              ].map(({ v, label }) => (
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

        <FieldRow>
          <Input label="Check-in *" type="date" value={form.checkIn}
            onChange={e => set("checkIn", e.target.value)} />
          <Input label="Check-out *" type="date" value={form.checkOut}
            onChange={e => set("checkOut", e.target.value)} />
        </FieldRow>

        {nights > 0 && (
          <div className="flex items-center gap-3 p-3 bg-forest-50 border border-forest-100 rounded-lg">
            <span className="text-sm text-forest-700 flex-1">
              <strong>{nights} noite{nights !== 1 ? "s" : ""}</strong>
              {" · "}{form.isSchoolStudent ? "Aluno da Escola" : "Não aluno"}
            </span>
            <span className="text-lg font-bold text-forest-700">{formatCurrency(total)}</span>
          </div>
        )}

        <Input label="Alimentação" placeholder="Ex: Biofresh 350g 2x ao dia (7h e 18h)"
          value={form.food} onChange={e => set("food", e.target.value)} />

        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Alertas críticos</p>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Medicação (nome, dose, horário)</label>
            <input className={INPUT_CLS} placeholder="Ex: Apoquel 16mg, 1 comprimido às 8h e 20h"
              value={form.medications} onChange={e => set("medications", e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Alergias</label>
            <input className={INPUT_CLS} placeholder="Ex: Alergia a frango, perfumes com álcool..."
              value={form.allergyAlert} onChange={e => set("allergyAlert", e.target.value)}/>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
            Pertences (lista para conferência no check-out)
          </label>
          <div className="space-y-2">
            {form.belongingsList.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input className={INPUT_CLS} placeholder={`Item ${i + 1}: cama, brinquedo...`}
                  value={item} onChange={e => updateBelonging(i, e.target.value)}/>
                {form.belongingsList.length > 1 && (
                  <button onClick={() => removeBelonging(i)}
                    className="text-red-400 hover:text-red-600 px-2 transition-colors flex-shrink-0">✕</button>
                )}
              </div>
            ))}
            <button onClick={addBelonging}
              className="text-xs text-forest-600 hover:text-forest-700 font-semibold">
              + Adicionar item
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-forest-600 rounded"
            checked={form.exitBath} onChange={e => set("exitBath", e.target.checked)}/>
          <span className="text-sm text-gray-700">Agendar banho de saída</span>
        </label>

        <Input label="Observações gerais" placeholder="Informações adicionais..."
          value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
    </Modal>
  );
}
