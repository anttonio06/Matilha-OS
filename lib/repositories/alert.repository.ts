"use client";

import { read, write, generateId } from "@/lib/db/storage";
import { STORAGE_KEYS } from "@/lib/db/keys";
import type { Alert } from "@/types/domain/alert";

const KEY = STORAGE_KEYS.alerts;

export const AlertRepository = {
  list: (): Alert[] =>
    read<Alert>(KEY),

  listActive: (): Alert[] =>
    read<Alert>(KEY).filter(a => !a.dismissed),

  listByEntity: (entityId: string): Alert[] =>
    read<Alert>(KEY).filter(a => a.entityId === entityId && !a.dismissed),

  create: (data: Omit<Alert, "id" | "createdAt">): Alert => {
    const alert: Alert = {
      ...data,
      id: generateId("alert"),
      createdAt: new Date().toISOString(),
    };
    write(STORAGE_KEYS.alerts, [...read<Alert>(KEY), alert]);
    return alert;
  },

  dismiss: (id: string): void => {
    write(KEY, read<Alert>(KEY).map(a => a.id === id ? { ...a, dismissed: true } : a));
  },

  markRead: (id: string): void => {
    write(KEY, read<Alert>(KEY).map(a =>
      a.id === id ? { ...a, readAt: new Date().toISOString() } : a
    ));
  },
};
