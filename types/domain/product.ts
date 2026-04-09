// ─── Product Domain Types ─────────────────────────────────────────────────────

export type ProductCategory =
  | "petisco"
  | "mordedor"
  | "enriquecimento"
  | "higiene"
  | "acessorio"
  | "suplemento"
  | "outro";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  unit: string;
  sku?: string;
  photo?: string;
  description?: string;
  active: boolean;
}
