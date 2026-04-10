"use client";

import React, { useState } from "react";
import { Send, Phone, Mail, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { store } from "@/lib/store";
import { DogDB, TutorDB, useDB, KEYS } from "@/lib/db";
import { Modal, Button, Select } from "@/components/ui/index";
import { FieldRow } from "./shared";

const MESSAGE_TEMPLATES: Record<string, string> = {
  renovacao:   "Olá, {tutor}! 🐾 O plano de {cão} está próximo do limite. Gostaria de renovar? Podemos ajudar!",
  checkin:     "Olá, {tutor}! {cão} chegou bem e já está curtindo o dia com a turma! 😄",
  checkout:    "Olá, {tutor}! {cão} foi um amor hoje. Estamos aguardando vocês na próxima vez! 🐕",
  vacina:      "Olá, {tutor}! 💉 Lembrete: a vacina de {cão} vence em breve. Pode agendar?",
  aniversario: "Feliz aniversário para {cão}! 🎂🎉 Hoje tem petisco especial por conta da Matilha!",
  upsell:      "Olá, {tutor}! Temos uma novidade especial para {cão} esta semana. Posso te contar? 🌟",
  cobranca:    "Olá, {tutor}! Identificamos um pagamento em aberto. Pode nos acionar? 🙏",
  custom:      "",
};

function loadWhatsAppConfig() {
  try { return JSON.parse(localStorage.getItem("matilha:wa:config") ?? "{}"); }
  catch { return {}; }
}

function interpolateTemplate(template: string, tutorName: string, dogName: string): string {
  return template
    .replace("{tutor}", tutorName.split(" ")[0])
    .replace("{cão}", dogName);
}

export function ModalEnviarMensagem({
  onClose,
  prefillTutorId,
}: {
  onClose: () => void;
  prefillTutorId?: string;
}) {
  const tutors = useDB(() => TutorDB.list(), KEYS.tutors);
  const dogs   = useDB(() => DogDB.list(),   KEYS.dogs);

  const [form, setForm] = useState({
    tutorId:  prefillTutorId ?? "",
    template: "renovacao",
    custom:   "",
    channel:  "whatsapp",
  });
  const [sending, setSending] = useState(false);

  const tutor     = tutors.find(t => t.id === form.tutorId);
  const tutorDogs = dogs.filter(d => d.tutorId === form.tutorId);
  const dog       = tutorDogs[0];

  const messageText = form.template === "custom"
    ? form.custom
    : interpolateTemplate(
        MESSAGE_TEMPLATES[form.template] ?? "",
        tutor?.name ?? "Tutor",
        dog?.name ?? "seu pet"
      );

  const waPhone = (tutor?.whatsapp || tutor?.phone || "").replace(/\D/g, "");

  const sendViaWhatsAppApi = async (): Promise<boolean> => {
    const cfg = loadWhatsAppConfig();
    if (!cfg.token || !cfg.phoneId) return false;
    setSending(true);
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${cfg.phoneId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to:   `55${waPhone}`,
          type: "text",
          text: { body: messageText },
        }),
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
    if (!tutor) { store.toast("warning", "Selecione um tutor."); return; }
    if (!messageText.trim()) { store.toast("warning", "A mensagem está vazia."); return; }

    if (form.channel === "whatsapp") {
      const cfg = loadWhatsAppConfig();
      if (cfg.token && cfg.phoneId && waPhone) {
        const ok = await sendViaWhatsAppApi();
        if (ok) {
          store.toast("success", `Mensagem enviada via API para ${tutor.name}!`);
          onClose();
          return;
        }
        store.toast("warning", "Falha na API — abrindo WhatsApp Web.");
      }
      if (waPhone) {
        window.open(`https://wa.me/55${waPhone}?text=${encodeURIComponent(messageText)}`, "_blank");
        store.toast("success", `WhatsApp aberto para ${tutor.name}`);
        onClose();
      } else {
        store.toast("error", "Número de WhatsApp não cadastrado para este tutor.");
      }
    } else {
      if (tutor.email) {
        window.open(`mailto:${tutor.email}?subject=Matilha - Mensagem&body=${encodeURIComponent(messageText)}`);
        store.toast("success", `E-mail aberto para ${tutor.name}`);
        onClose();
      } else {
        store.toast("error", "E-mail não cadastrado para este tutor.");
      }
    }
  };

  const waCfg = loadWhatsAppConfig();
  const apiConfigured = !!(waCfg.token && waCfg.phoneId);

  return (
    <Modal open onClose={onClose} size="lg" title="Enviar Mensagem"
      description="Comunicação direta com tutores"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} loading={sending}
            icon={<Send className="w-4 h-4"/>}>
            {form.channel === "whatsapp" ? "Enviar WhatsApp" : "Abrir e-mail"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldRow>
          <Select label="Tutor *" value={form.tutorId}
            options={[{ value: "", label: "Selecionar tutor..." }, ...tutors.map(t => ({ value: t.id, label: t.name }))]}
            onChange={e => setForm(f => ({ ...f, tutorId: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Canal</label>
            <div className="flex gap-2 h-9 items-center">
              {([
                ["whatsapp", "WhatsApp", <Phone key="p" className="w-3.5 h-3.5"/>],
                ["email",    "E-mail",   <Mail  key="m" className="w-3.5 h-3.5"/>],
              ] as const).map(([v, l, icon]) => (
                <button key={v} onClick={() => setForm(f => ({ ...f, channel: v }))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    form.channel === v
                      ? "border-forest-500 bg-forest-50 text-forest-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}>
                  {icon} {l}
                </button>
              ))}
            </div>
          </div>
        </FieldRow>

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
                  <span key={d.id} className="text-2xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full font-semibold">
                    {d.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Modelo de mensagem</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "renovacao",   label: "Renovação"     },
              { id: "checkin",     label: "Check-in"      },
              { id: "checkout",    label: "Check-out"     },
              { id: "vacina",      label: "Vacina"        },
              { id: "aniversario", label: "Aniversário"   },
              { id: "upsell",      label: "Oferta"        },
              { id: "cobranca",    label: "Cobrança"      },
              { id: "custom",      label: "Personalizada" },
            ].map(tpl => (
              <button key={tpl.id} onClick={() => setForm(f => ({ ...f, template: tpl.id }))}
                className={cn(
                  "px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all",
                  form.template === tpl.id
                    ? "border-forest-500 bg-forest-50 text-forest-700"
                    : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                )}>
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Mensagem</label>
          <textarea
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 resize-none"
            rows={4}
            value={form.template === "custom" ? form.custom : messageText}
            onChange={e => { if (form.template === "custom") setForm(f => ({ ...f, custom: e.target.value })); }}
            readOnly={form.template !== "custom"}
          />
          <p className="text-2xs text-gray-400 mt-1">{messageText.length} caracteres</p>
        </div>

        {form.channel === "whatsapp" && (
          apiConfigured ? (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0"/>
              <p className="text-xs text-green-700 font-medium">API do WhatsApp configurada — envio direto ativo.</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"/>
              <p className="text-xs text-amber-700">
                API do WhatsApp não configurada. A mensagem será aberta no WhatsApp Web.
                Configure em <strong>Integrações</strong> para envio direto.
              </p>
            </div>
          )
        )}
      </div>
    </Modal>
  );
}
