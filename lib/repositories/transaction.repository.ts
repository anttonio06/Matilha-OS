"use client";

import { read, write, generateId } from "@/lib/db/storage";
import { STORAGE_KEYS } from "@/lib/db/keys";
import type { Transaction } from "@/types/domain/transaction";

const KEY = STORAGE_KEYS.transactions;

export const TransactionRepository = {
  list: (): Transaction[] =>
    read<Transaction>(KEY),

  findById: (id: string): Transaction | undefined =>
    read<Transaction>(KEY).find(t => t.id === id),

  listRevenue: (): Transaction[] =>
    read<Transaction>(KEY).filter(t => t.type === "receita"),

  listExpenses: (): Transaction[] =>
    read<Transaction>(KEY).filter(t => t.type === "despesa"),

  listOverdue: (): Transaction[] =>
    read<Transaction>(KEY).filter(t => t.status === "atrasado"),

  listByMonth: (yearMonth: string): Transaction[] =>
    read<Transaction>(KEY).filter(t => t.paidAt?.startsWith(yearMonth)),

  listByTutor: (tutorId: string): Transaction[] =>
    read<Transaction>(KEY).filter(t => t.tutorId === tutorId),

  create: (data: Omit<Transaction, "id" | "createdAt">): Transaction => {
    const transaction: Transaction = {
      ...data,
      id: generateId("txn"),
      createdAt: new Date().toISOString(),
    };
    write(KEY, [...read<Transaction>(KEY), transaction], true);
    return transaction;
  },

  update: (id: string, patch: Partial<Transaction>): void => {
    write(KEY, read<Transaction>(KEY).map(t => t.id === id ? { ...t, ...patch } : t), true);
  },

  delete: (id: string): void => {
    write(KEY, read<Transaction>(KEY).filter(t => t.id !== id), true);
  },
};
