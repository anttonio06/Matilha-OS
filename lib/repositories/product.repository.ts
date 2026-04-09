"use client";

import { read, write, generateId } from "@/lib/db/storage";
import { STORAGE_KEYS } from "@/lib/db/keys";
import type { Product } from "@/types/domain/product";

const KEY = STORAGE_KEYS.products;

export const ProductRepository = {
  list: (): Product[] =>
    read<Product>(KEY),

  findById: (id: string): Product | undefined =>
    read<Product>(KEY).find(p => p.id === id),

  findBySku: (sku: string): Product | undefined =>
    read<Product>(KEY).find(p => p.sku === sku),

  listActive: (): Product[] =>
    read<Product>(KEY).filter(p => p.active),

  listLowStock: (threshold = 5): Product[] =>
    read<Product>(KEY).filter(p => p.active && p.stock <= threshold),

  create: (data: Omit<Product, "id">): Product => {
    const product: Product = { ...data, id: generateId("prod") };
    write(KEY, [...read<Product>(KEY), product], true);
    return product;
  },

  update: (id: string, patch: Partial<Product>): void => {
    write(KEY, read<Product>(KEY).map(p => p.id === id ? { ...p, ...patch } : p), true);
  },

  delete: (id: string): void => {
    write(KEY, read<Product>(KEY).filter(p => p.id !== id), true);
  },
};
