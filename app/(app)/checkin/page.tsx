"use client";

import React, { useState, useCallback } from "react";
import {
  Search, LogIn, LogOut, Clock, AlertTriangle, CheckCircle,
  Dog, ChevronRight, Phone, Syringe, Package, Bell,
  Square, SquareCheck, ShieldAlert, CreditCard,
} from "lucide-react";
import { store } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import {
  useDB, KEYS,
  AppointmentDB, DogDB, TutorDB, PlanDB, AlertDB, HotelDB,
} from "@/lib/db";
import { Badge, Button, Card, Input, Modal, AlertStrip } from "@/components/ui";
import type { Appointment } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ─── Belongings Checklist Modal ───────────────────────────────────────────────

function BelongingsModal({ dogName, items, onClose }: {
  dogName: string;
  items: string[];
  onClose: () => void;
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const toggle = (i: number) => setChecked(c => ({ ...c, [i]: !c[i] }));
  const allChecked = items.every((_, i) => checked[i]);

  return (
    <Modal open onClose={onClose} size="sm"
      title={`Pertences — ${dogName}`}
      description="Confira todos os itens antes de devolver ao tutor"
      footer={
        <Button onClick={onClose}
          icon={allChecked ? <CheckCircle className="w-4 h-4"/> : undefined}>
          {allChecked ? "Tudo conferido! Concluir" : "Fechar lista"}
        </Button>
      }
    >
      <div className="space-y-3">
        {!allChecked && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Package className="w-4 h-4 text-amber-500 flex-shrink-0"/>
            <p className="text-xs text-amber-800 font-medium">
              Marque cada item ao localizá-lo antes de entregar ao tutor.
            </p>
          </div>
        )}
        {allChecked && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0"/>
            <p className="text-xs text-green-800 font-medium">
              Todos os pertences conferidos! Pode realizar o check-out.
            </p>
          </div>
        )}
        <div className="space-y-2">
          {items.map((item, i) => (
            <button key={i} onClick={() => toggle(i)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                checked[i]
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
              )}>
              {checked[i]
                ? <SquareCheck className="w-5 h-5 text-green-500 flex-shrink-0"/>
                : <Square className="w-5 h-5 text-gray-300 flex-shrink-0"/>
              }
              <span className={cn("text-sm font-medium", checked[i] ? "text-green-800 line-through" : "text-gray-800")}>
                {item}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">Progresso</span>
          <span className={cn("text-xs font-bold", allChecked ? "text-green-600" : "text-amber-600")}>
            {Object.values(checked).filter(Boolean).length}/{items.length} itens
          </span>
        </div>
      </div>
    </Modal>
  );
}

// ─── Check-in / Check-out Modal ───────────────────────────────────────────────

function CheckInModal({ apt, onClose }: { apt: Appointment; onClose: () => void }) {
  const dog   = DogDB.get(apt.dogId);
  const tutor = TutorDB.get(apt.tutorId);
  const plan  = apt.planId ? PlanDB.get(apt.planId) : null;

  const [step, setStep]          = useState<"review" | "details" | "done">("review");
  const [emotionalState, setEmo] = useState("calmo");
  const [observations, setObs]   = useState("");
  const [loading, setLoading]    = useState(false);

  const isCheckout = apt.status === "em_andamento";

  // Hotel reservation
  const hotelReservations = useDB(() => HotelDB.list(), KEYS.hotel);
  const hotelRes = apt.serviceType === "hotel"
    ? hotelReservations.find(r => r.dogId === apt.dogId && r.status !== "cancelado" && r.status !== "checkout")
    : null;
  const belongingsList = hotelRes?.belongingsList ?? (hotelRes?.belongings ? [hotelRes.belongings] : []);

  // Alerts for this dog/tutor
  const dogAlerts = AlertDB.active().filter(a => a.entityId === apt.dogId || a.entityId === apt.tutorId);

  // Plan validation
  const planExhausted = plan && plan.totalUses != null && (plan.usedUses ?? 0) >= plan.totalUses;
  const planExpired   = plan && plan.validUntil && plan.validUntil < todayStr();
  const planOk        = plan && !planExhausted && !planExpired;
  const usesLeft      = plan?.totalUses != null ? (plan.totalUses - (plan.usedUses ?? 0)) : null;

  const confirmAction = useCallback(() => {
    setLoading(true);
    try {
      if (isCheckout) {
        // Check-out: mark concluido + record time + deduct plan use
        AppointmentDB.update(apt.id, {
          status: "concluido",
          checkoutTime: nowTime(),
          checkoutObs: observations || undefined,
          checkoutEmotionalState: emotionalState as Appointment["checkoutEmotionalState"],
        });
        if (plan && !planExhausted) {
          PlanDB.update(plan.id, { usedUses: (plan.usedUses ?? 0) + 1 });
        }
        // Update hotel reservation to checkout status
        if (hotelRes) {
          HotelDB.update(hotelRes.id, { status: "checkout" });
        }
        store.toast("success", `Check-out confirmado — ${dog?.name}`);
      } else {
        // Check-in: mark em_andamento + record time
        AppointmentDB.update(apt.id, {
          status: "em_andamento",
          checkinTime: nowTime(),
          checkinObs: observations || undefined,
          checkinEmotionalState: emotionalState as Appointment["checkinEmotionalState"],
        });
        // Update hotel reservation to hospedado
        if (hotelRes && hotelRes.status === "reservado") {
          HotelDB.update(hotelRes.id, { status: "hospedado" });
        }
        store.toast("success", `Check-in confirmado — ${dog?.name}`);
      }
      setStep("done");
    } finally {
      setLoading(false);
    }
  }, [apt.id, isCheckout, plan, planExhausted, hotelRes, dog?.name, observations, emotionalState]);

  return (
    <Modal open onClose={onClose} size="lg"
      title={isCheckout ? `Check-out — ${dog?.name}` : `Check-in — ${dog?.name}`}
      description={`${dog?.breed ?? ""} · ${tutor?.name ?? ""}`}
      footer={
        step === "review" ? (
          <>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => setStep("details")} icon={<LogIn className="w-4 h-4"/>}>
              {isCheckout ? "Prosseguir Check-out" : "Prosseguir Check-in"}
            </Button>
          </>
        ) : step === "details" ? (
          <>
            <Button variant="outline" onClick={() => setStep("review")}>Voltar</Button>
            <Button onClick={confirmAction} loading={loading} icon={<CheckCircle className="w-4 h-4"/>}>
              {isCheckout ? "Confirmar Check-out" : "Confirmar Check-in"}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Concluir</Button>
        )
      }
    >
      {step === "review" && (
        <div className="space-y-4">
          {/* Dog card */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-forest-700">{dog?.name[0]}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900">{dog?.name}</h3>
                <Badge variant="gray" size="sm">{dog?.breed}</Badge>
                <Badge variant={dog?.neutered ? "green" : "gray"} size="sm">
                  {dog?.neutered ? "Castrado" : "Inteiro"}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                {dog?.size} · {dog?.weight}kg · <strong>{tutor?.name}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">📞 {tutor?.whatsapp}</p>
            </div>
          </div>

          {/* Plan status */}
          {plan ? (
            <div className={cn(
              "p-3 rounded-xl border flex items-start gap-3",
              planExhausted || planExpired
                ? "bg-red-50 border-red-200"
                : usesLeft !== null && usesLeft <= 2
                  ? "bg-amber-50 border-amber-200"
                  : "bg-green-50 border-green-200"
            )}>
              <CreditCard className={cn("w-4 h-4 flex-shrink-0 mt-0.5",
                planExhausted || planExpired ? "text-red-500" : usesLeft !== null && usesLeft <= 2 ? "text-amber-500" : "text-green-500"
              )}/>
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-bold",
                  planExhausted || planExpired ? "text-red-800" : usesLeft !== null && usesLeft <= 2 ? "text-amber-800" : "text-green-800"
                )}>{plan.name}</p>
                {planExpired && <p className="text-xs text-red-700 mt-0.5">Plano expirado em {plan.validUntil}</p>}
                {planExhausted && <p className="text-xs text-red-700 mt-0.5">Plano esgotado — 0 usos restantes</p>}
                {planOk && usesLeft !== null && (
                  <p className="text-xs text-green-700 mt-0.5">
                    {usesLeft} uso(s) restante(s)
                    {isCheckout && " · será deduzido no check-out"}
                  </p>
                )}
                {planOk && usesLeft === null && (
                  <p className="text-xs text-green-700 mt-0.5">Plano ativo · ilimitado</p>
                )}
              </div>
              {(planExhausted || planExpired) && (
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0"/>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0"/>
              <p className="text-xs text-amber-800 font-medium">
                Sem plano associado — cobrança avulsa ou manual.
              </p>
            </div>
          )}

          {/* System alerts */}
          {dogAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5"/> Alertas do sistema
              </p>
              {dogAlerts.map(a => (
                <AlertStrip key={a.id}
                  type={a.type === "critical" ? "error" : a.type === "warning" ? "warning" : a.type === "opportunity" ? "opportunity" : "info"}
                  title={a.title} description={a.description}/>
              ))}
            </div>
          )}

          {/* Medical / behavioral */}
          {dog?.medicalRestrictions && (
            <div className="p-3 rounded-xl border border-red-200 bg-red-50">
              <p className="text-xs font-bold text-red-800 flex items-center gap-1.5 mb-1">
                <Syringe className="w-3.5 h-3.5"/> Saúde / Medicação
              </p>
              <p className="text-sm text-red-900">{dog.medicalRestrictions}</p>
            </div>
          )}
          {dog?.behavioralRestrictions && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5"/> Restrições comportamentais
              </p>
              <p className="text-sm text-amber-900">{dog.behavioralRestrictions}</p>
            </div>
          )}

          {/* Hotel: belongings on checkout */}
          {hotelRes && belongingsList.length > 0 && (
            <div className="p-3 rounded-xl border-2 border-amber-300 bg-amber-50">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                <Package className="w-3.5 h-3.5"/> Pertences para devolver no check-out
              </p>
              <ul className="space-y-1">
                {belongingsList.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-amber-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"/>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Service + schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
              <p className="text-2xs font-bold uppercase tracking-wide text-gray-400 mb-1">Serviço</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{apt.serviceType.replace("_", " ")}</p>
            </div>
            <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
              <p className="text-2xs font-bold uppercase tracking-wide text-gray-400 mb-1">Horário previsto</p>
              <p className="text-sm font-semibold text-gray-900">
                {apt.startTime}{apt.endTime ? ` – ${apt.endTime}` : ""}
              </p>
            </div>
          </div>

          {/* Food */}
          {dog?.foodBrand && (
            <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/50">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
                <Package className="w-3.5 h-3.5"/> Alimentação
              </p>
              <p className="text-sm text-amber-900">{dog.foodBrand} · {dog.foodAmount}</p>
            </div>
          )}
        </div>
      )}

      {step === "details" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">
              Estado emocional na {isCheckout ? "saída" : "chegada"}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { v: "calmo",     label: "Calmo",   emoji: "😌" },
                { v: "ansioso",   label: "Ansioso", emoji: "😰" },
                { v: "excitado",  label: "Animado", emoji: "🤩" },
                { v: "agitado",   label: "Agitado", emoji: "😤" },
                { v: "agressivo", label: "Reativo", emoji: "😠" },
              ].map(({ v, label, emoji }) => (
                <button key={v} onClick={() => setEmo(v)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-medium",
                    emotionalState === v
                      ? "border-forest-500 bg-forest-50 text-forest-700"
                      : "border-gray-100 text-gray-600 hover:border-gray-200"
                  )}>
                  <span className="text-2xl">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Observações do monitor</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400"
              rows={3}
              placeholder="O que a equipe precisa saber?"
              value={observations}
              onChange={e => setObs(e.target.value)}
            />
          </div>

          {/* Checkout: plan deduction warning */}
          {isCheckout && plan && !planExhausted && usesLeft !== null && (
            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-blue-500 flex-shrink-0"/>
              <p className="text-xs text-blue-800 font-medium">
                Ao confirmar, 1 uso será debitado do plano <strong>{plan.name}</strong>.
                {usesLeft === 1 && " Este é o último uso — considere renovação."}
              </p>
            </div>
          )}

          {/* Hotel belongings reminder */}
          {hotelRes && belongingsList.length > 0 && (
            <div className="p-3 rounded-xl border-2 border-amber-300 bg-amber-50 flex items-center gap-3">
              <Package className="w-5 h-5 text-amber-600 flex-shrink-0"/>
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-800">Pertences ({belongingsList.length} itens)</p>
                <p className="text-xs text-amber-700">Confira a lista antes de liberar o check-out</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
            <Syringe className="w-4 h-4 text-gray-400 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-700">Documentação sanitária</p>
              <p className="text-xs text-gray-500">Vacinas verificadas no cadastro</p>
            </div>
            <CheckCircle className="w-4 h-4 text-green-500"/>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-16 h-16 rounded-full bg-forest-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-forest-600"/>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">
              {isCheckout ? "Check-out confirmado!" : "Check-in confirmado!"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {dog?.name} às {nowTime()}
            </p>
          </div>

          {/* Plan deduction confirmation */}
          {isCheckout && plan && !planExhausted && usesLeft !== null && (
            <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-blue-500 flex-shrink-0"/>
              <p className="text-xs text-blue-800 font-medium">
                1 uso debitado do plano {plan.name} · {Math.max(0, usesLeft - 1)} restante(s)
              </p>
            </div>
          )}

          {/* Hotel checkout: final belongings reminder */}
          {isCheckout && belongingsList.length > 0 && (
            <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-2 mb-2">
                <Package className="w-3.5 h-3.5"/> Não esqueça de devolver
              </p>
              <ul className="space-y-1">
                {belongingsList.map((item, i) => (
                  <li key={i} className="text-xs text-amber-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"/>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Near-limit plan alert */}
          {plan && usesLeft !== null && usesLeft <= 2 && (
            <AlertStrip type="opportunity"
              title={usesLeft <= 1 ? "Plano esgotado após este uso" : "Plano quase no limite"}
              description={`Restam ${Math.max(0, usesLeft - (isCheckout ? 1 : 0))} uso(s). Considere renovação.`}
            />
          )}

          <div className="flex gap-2">
            <Button variant="outline" icon={<Phone className="w-4 h-4"/>}
              onClick={() => store.openModal("enviar_mensagem", { tutorId: apt.tutorId })}>
              Notificar tutor
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AptCard({ apt, type }: { apt: Appointment; type: "checkin" | "checkout" }) {
  const dog   = DogDB.get(apt.dogId);
  const tutor = TutorDB.get(apt.tutorId);
  const plan  = apt.planId ? PlanDB.get(apt.planId) : null;
  const [modalOpen, setModalOpen] = useState(false);
  const [showBelongings, setShowBelongings] = useState(false);

  const hotelReservations = useDB(() => HotelDB.list(), KEYS.hotel);
  const hotelRes = apt.serviceType === "hotel"
    ? hotelReservations.find(r => r.dogId === apt.dogId && r.status !== "cancelado")
    : null;
  const belongingsList = hotelRes?.belongingsList ?? (hotelRes?.belongings ? [hotelRes.belongings] : []);
  const hasBelongings = type === "checkout" && belongingsList.length > 0;

  const usesLeft = plan?.totalUses != null ? (plan.totalUses - (plan.usedUses ?? 0)) : null;
  const planAlert = plan && (
    (plan.validUntil && plan.validUntil < todayStr()) ||
    (usesLeft !== null && usesLeft <= 0)
  );

  const svcColors: Record<string, string> = {
    creche: "bg-forest-100 text-forest-700", banho: "bg-blue-100 text-blue-700",
    banho_tosa: "bg-purple-100 text-purple-700", hotel: "bg-amber-100 text-amber-700",
    escola: "bg-rose-100 text-rose-700",
  };

  return (
    <>
      <Card hover className="flex flex-col gap-3">
        <div className="flex items-start gap-3 cursor-pointer" onClick={() => setModalOpen(true)}>
          <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-bold text-forest-700">{dog?.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{dog?.name}</p>
              <span className={cn("badge text-2xs", svcColors[apt.serviceType] ?? "bg-gray-100 text-gray-600")}>
                {apt.serviceType.replace("_", " ")}
              </span>
              {plan && !planAlert && <Badge variant="green" size="sm">Plano</Badge>}
              {planAlert && <Badge variant="red" size="sm">Plano inválido</Badge>}
              {!plan && <Badge variant="amber" size="sm">Avulso</Badge>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{tutor?.name} · {tutor?.phone}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3"/>
                {type === "checkin" ? "Previsto" : "Saída"}: {apt.startTime}
              </span>
              {dog?.behavioralRestrictions && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="w-3 h-3"/> Atenção
                </span>
              )}
              {dog?.medicalRestrictions && (
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <Syringe className="w-3 h-3"/> Medicação
                </span>
              )}
              {plan && usesLeft !== null && usesLeft <= 2 && usesLeft > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <CreditCard className="w-3 h-3"/> {usesLeft} uso(s) restante(s)
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0"/>
        </div>

        {hasBelongings && (
          <button onClick={() => setShowBelongings(true)}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors text-left">
            <Package className="w-4 h-4 text-amber-500 flex-shrink-0"/>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-800">
                {belongingsList.length} item(s) para devolver
              </p>
              <p className="text-2xs text-amber-600 truncate">
                {belongingsList.slice(0, 2).join(", ")}{belongingsList.length > 2 ? "..." : ""}
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 whitespace-nowrap">Conferir →</span>
          </button>
        )}
      </Card>

      {modalOpen && <CheckInModal apt={apt} onClose={() => setModalOpen(false)}/>}
      {showBelongings && (
        <BelongingsModal
          dogName={dog?.name ?? "Cão"}
          items={belongingsList}
          onClose={() => setShowBelongings(false)}
        />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckInPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab]       = useState<"chegadas" | "presentes" | "saidas">("chegadas");

  const todayApts = useDB(() => AppointmentDB.today(), KEYS.appointments);

  const pendingCheckIns = todayApts.filter(a => a.status === "agendado" || a.status === "confirmado");
  const active          = todayApts.filter(a => a.status === "em_andamento");
  const done            = todayApts.filter(a => a.status === "concluido");

  const filtered = (list: Appointment[]) =>
    search ? list.filter(a => {
      const dog   = DogDB.get(a.dogId);
      const tutor = TutorDB.get(a.tutorId);
      const q     = search.toLowerCase();
      return dog?.name.toLowerCase().includes(q) || tutor?.name.toLowerCase().includes(q);
    }) : list;

  const current = tab === "chegadas" ? pendingCheckIns : tab === "presentes" ? active : done;
  const filteredCurrent = filtered(current);

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-in / Check-out</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Recepção operacional · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-forest-50 border border-forest-100">
            <div className="status-dot active"/>
            <span className="text-xs font-semibold text-forest-700">{active.length} presentes agora</span>
          </div>
          <Input icon={<Search className="w-3.5 h-3.5"/>}
            placeholder="Buscar cão ou tutor..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-52"/>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: "chegadas",  icon: <LogIn className="w-4 h-4 text-forest-600"/>,  label: "Check-ins pendentes", value: pendingCheckIns.length },
          { key: "presentes", icon: <Dog className="w-4 h-4 text-blue-600"/>,      label: "Presentes agora",     value: active.length          },
          { key: "saidas",    icon: <LogOut className="w-4 h-4 text-amber-600"/>,  label: "Saídas (concluídos)", value: done.length             },
        ].map(({ key, icon, label, value }) => (
          <div key={key}
            className={cn(
              "p-4 rounded-xl border-2 cursor-pointer transition-all",
              tab === key
                ? "border-forest-500 bg-forest-50 shadow-sm"
                : "border-transparent bg-white border border-gray-200 hover:border-gray-300"
            )}
            onClick={() => setTab(key as typeof tab)}>
            <div className="flex items-center gap-2 mb-1">{icon}<p className="text-xs font-semibold text-gray-600">{label}</p></div>
            <p className="text-3xl font-bold text-gray-900 num-display">{value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-4">
          {tab === "chegadas"  && `Aguardando check-in (${filteredCurrent.length})`}
          {tab === "presentes" && `Presentes agora (${filteredCurrent.length})`}
          {tab === "saidas"    && `Saídas do dia (${filteredCurrent.length})`}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredCurrent.map(apt => (
            <AptCard key={apt.id} apt={apt} type={tab === "saidas" ? "checkout" : "checkin"}/>
          ))}

          {filteredCurrent.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-3 py-16 text-gray-400">
              <Dog className="w-12 h-12 opacity-20"/>
              <p className="text-sm font-medium">Nenhum registro nesta categoria</p>
              {tab === "chegadas" && (
                <button onClick={() => store.openModal("novo_agendamento")}
                  className="text-xs text-forest-600 font-semibold hover:underline">
                  + Criar agendamento
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
