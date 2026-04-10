"use client";

import React, { useState } from "react";
import { CheckCircle } from "lucide-react";
import { store } from "@/lib/store";
import { TutorDB } from "@/lib/db";
import { Modal, Button, Input, Select } from "@/components/ui/index";
import { FieldRow } from "./shared";
import type { ContactPreference } from "@/types/domain/tutor";

const CONTACT_CHANNELS: { value: ContactPreference; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email",    label: "E-mail"   },
  { value: "phone",    label: "Telefone" },
];

const ACQUISITION_SOURCES = ["Instagram", "Indicação", "Google", "Loja", "Site", "Outro"];

export function ModalNovoTutor({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", whatsapp: "",
    source: "Instagram",
    preferredContact: "whatsapp" as ContactPreference,
    notes: "",
  });

  const submit = () => {
    if (!form.name || !form.phone) {
      store.toast("warning", "Preencha nome e telefone.");
      return;
    }
    TutorDB.create({
      name:             form.name,
      email:            form.email,
      phone:            form.phone,
      whatsapp:         form.whatsapp || form.phone,
      source:           form.source,
      preferredContact: form.preferredContact,
      notes:            form.notes,
      dogs:             [],
      activePlans:      [],
      totalSpent:       0,
      ltv:              0,
      status:           "ativo",
    });
    store.toast("success", `Tutor ${form.name} cadastrado com sucesso!`);
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="lg" title="Novo Tutor"
      description="Cadastro do responsável pelo cão"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} icon={<CheckCircle className="w-4 h-4"/>}>Salvar tutor</Button>
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
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value, whatsapp: e.target.value }))} />
        </FieldRow>
        <FieldRow>
          <Select label="Origem / Canal" value={form.source}
            options={ACQUISITION_SOURCES.map(v => ({ value: v, label: v }))}
            onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
          <Select label="Contato preferencial" value={form.preferredContact}
            options={CONTACT_CHANNELS}
            onChange={e => setForm(f => ({ ...f, preferredContact: e.target.value as ContactPreference }))} />
        </FieldRow>
        <Input label="Observações" placeholder="Preferências, contexto familiar..."
          value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
    </Modal>
  );
}
