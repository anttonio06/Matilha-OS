"use client";

import React, { useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { store } from "@/lib/store";
import { AppointmentDB, DogDB, TutorDB, useDB } from "@/lib/db";
import { Modal, Button, Input, Select } from "@/components/ui/index";
import { FieldRow } from "./shared";

const SERVICE_OPTIONS = [
  { value: "creche",     label: "Creche"                   },
  { value: "banho",      label: "Banho"                    },
  { value: "banho_tosa", label: "Banho & Tosa"             },
  { value: "hotel",      label: "Hotel"                    },
  { value: "escola",     label: "Escola / Sessão"          },
  { value: "tosa",       label: "Tosa"                     },
  { value: "avaliacao",  label: "Avaliação comportamental" },
];

export function ModalNovoAgendamento({ onClose }: { onClose: () => void }) {
  const dogs   = useDB(() => DogDB.list());
  const tutors = useDB(() => TutorDB.list());
  const team   = useDB(() => TutorDB.list());

  const [form, setForm] = useState({
    dogId: "", tutorId: "", service: "creche",
    date: new Date().toISOString().split("T")[0],
    time: "09:00", professional: "", notes: "", planId: "",
  });
  const [step, setStep] = useState<"form" | "confirm">("form");

  const dog   = dogs.find(d => d.id === form.dogId);
  const tutor = tutors.find(t => t.id === form.tutorId);

  const submit = () => {
    if (!form.dogId || !form.tutorId) {
      store.toast("warning", "Selecione o cão e o tutor.");
      return;
    }
    AppointmentDB.create({
      dogId:       form.dogId,
      tutorId:     form.tutorId,
      serviceType: form.service as import("@/types/domain/appointment").ServiceType,
      date:        form.date,
      startTime:   form.time,
      status:      "agendado",
      notes:       form.notes || undefined,
      planId:      form.planId || undefined,
    });
    store.toast("success", `Agendamento criado — ${dog?.name ?? "Cão"} · ${form.service} · ${form.date}`);
    onClose();
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
            <Button onClick={submit} icon={<CheckCircle className="w-4 h-4"/>}>
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
            <Select label="Serviço *" options={SERVICE_OPTIONS} value={form.service}
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
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-forest-50 border border-forest-100 rounded-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-forest-600">Confirmação</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Cão",     dog?.name   ?? "—"],
                ["Tutor",   tutor?.name ?? "—"],
                ["Serviço", form.service.replace("_", " ")],
                ["Data",    form.date],
                ["Horário", form.time],
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
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-amber-800">{dog.behavioralRestrictions}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
