"use client";

/**
 * Modals barrel — public surface
 *
 * Each modal lives in its own file, colocated with the feature it serves.
 * The GlobalModals orchestrator in components/ui/GlobalModals.tsx imports
 * from here so existing call sites (store.openModal("novo_tutor")) continue
 * to work without changes.
 */
export { ModalNovoAgendamento } from "./ModalNovoAgendamento";
export { ModalNovoTutor       } from "./ModalNovoTutor";
export { ModalNovaReserva     } from "./ModalNovaReserva";
export { ModalEnviarMensagem  } from "./ModalEnviarMensagem";
