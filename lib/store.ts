"use client";

// ─── Lightweight global store (no external dep needed) ────────────────────────
// Uses React context + useState via a module-level subscribers pattern.

type Modal =
  | "novo_agendamento"
  | "novo_tutor"
  | "novo_cao"
  | "novo_plano"
  | "nova_reserva"
  | "novo_produto"
  | "novo_lancamento"
  | "nova_sessao"
  | "nova_ocorrencia"
  | "renovar_plano"
  | "encaixe_banho"
  | "enviar_mensagem"
  | "quick_add"
  | null;

export type Toast = {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
};

type Listener = () => void;

class AppStore {
  modal: Modal = null;
  modalData: Record<string, unknown> = {};
  toasts: Toast[] = [];
  private listeners: Set<Listener> = new Set();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  openModal(modal: Modal, data: Record<string, unknown> = {}) {
    this.modal = modal;
    this.modalData = data;
    this.notify();
  }

  closeModal() {
    this.modal = null;
    this.modalData = {};
    this.notify();
  }

  toast(type: Toast["type"], message: string) {
    const id = Math.random().toString(36).slice(2);
    this.toasts = [...this.toasts, { id, type, message }];
    this.notify();
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.notify();
    }, 3800);
  }

  dismissToast(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }
}

export const store = new AppStore();

// React hook
import { useEffect, useState } from "react";

export function useStore() {
  const [, rerender] = useState(0);
  useEffect(() => {
    return store.subscribe(() => rerender((n) => n + 1));
  }, []);
  return store;
}
