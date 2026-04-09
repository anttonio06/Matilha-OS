"use client";

import React, { useState } from "react";
import {
  ShoppingBag, Plus, Search, Package, Zap, ShoppingCart,
  TrendingUp, X
} from "lucide-react";
import { store } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { products, tutors, alerts } from "@/lib/mock-data";
import { Badge, Button, Card, Input, StatCard, Tabs } from "@/components/ui";
import type { Product } from "@/types";

interface CartItem { product: Product; qty: number; }

const categoryLabels: Record<string, string> = {
  petisco: "Petiscos", mordedor: "Mordedores", enriquecimento: "Enriquecimento",
  higiene: "Higiene", acessorio: "Acessórios", suplemento: "Suplementos", outro: "Outros",
};
const categoryColors: Record<string, string> = {
  petisco: "bg-amber-100 text-amber-700", mordedor: "bg-orange-100 text-orange-700",
  enriquecimento: "bg-forest-100 text-forest-700", higiene: "bg-blue-100 text-blue-700",
  acessorio: "bg-purple-100 text-purple-700", suplemento: "bg-teal-100 text-teal-700",
  outro: "bg-gray-100 text-gray-600",
};

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <Card hover className="flex flex-col gap-3 cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-gray-400" />
        </div>
        <span className={cn("badge text-2xs", categoryColors[product.category] ?? "bg-gray-100 text-gray-600")}>
          {categoryLabels[product.category] ?? product.category}
        </span>
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("text-xs", product.stock <= 5 ? "text-amber-600 font-semibold" : "text-gray-500")}>
            {product.stock} em estoque
          </span>
          {product.stock <= 5 && <span className="text-2xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">Baixo</span>}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-gray-900 num-display">{formatCurrency(product.price)}</p>
        <Button size="xs" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => onAdd(product)}>
          Adicionar
        </Button>
      </div>
    </Card>
  );
}

export default function LojaPage() {
  const [tab,        setTab]    = useState<"pdv" | "estoque" | "upsell">("pdv");
  const [search,     setSearch] = useState("");
  const [catFilter,  setCat]    = useState("todos");
  const [cart,       setCart]   = useState<CartItem[]>([]);
  const [selectedTutor, setTutor] = useState<string>("");

  const categories = ["todos", ...Object.keys(categoryLabels)];

  const filteredProducts = products.filter(p =>
    (catFilter === "todos" || p.category === catFilter) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    p.active
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.product.id !== productId));
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  const upsellOpportunities = alerts.filter(a => a.type === "opportunity");

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loja / PDV</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.filter(p => p.active).length} produtos ativos · Ponto de venda integrado</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Package className="w-4 h-4" />} size="sm">Estoque</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => store.openModal("novo_produto")}>Novo produto</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Produtos ativos" value={products.filter(p=>p.active).length} icon={<Package className="w-4 h-4" />} color="blue" />
        <StatCard label="Vendas hoje" value={formatCurrency(480)} icon={<ShoppingBag className="w-4 h-4" />} color="green" trend={{ value: 15 }} />
        <StatCard label="Oportunidades" value={upsellOpportunities.length} icon={<Zap className="w-4 h-4" />} color="amber" sub="upsell sugerido" />
        <StatCard label="Estoque baixo" value={products.filter(p=>p.stock<=5).length} icon={<TrendingUp className="w-4 h-4" />} color="red" />
      </div>

      <Tabs
        tabs={[
          { id: "pdv",     label: "PDV",        count: cart.length || undefined },
          { id: "estoque", label: "Estoque",     count: products.length },
          { id: "upsell",  label: "Oportunidades", count: upsellOpportunities.length },
        ]}
        active={tab} onChange={(v) => setTab(v as typeof tab)}
      />

      {tab === "pdv" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Products */}
          <div className="xl:col-span-2 space-y-4">
            {/* Tutor selector */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex-1">
                <select
                  value={selectedTutor}
                  onChange={(e) => setTutor(e.target.value)}
                  className="w-full h-9 rounded-md border border-gray-200 bg-transparent px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                >
                  <option value="">Selecionar tutor (opcional)</option>
                  {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {selectedTutor && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-forest-50 border border-forest-100 rounded-lg">
                  <Zap className="w-3.5 h-3.5 text-forest-500" />
                  <span className="text-xs font-semibold text-forest-700">Sugestões personalizadas ativas</span>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((c) => (
                <button key={c} onClick={() => setCat(c)}
                  className={cn("pill-tab", catFilter === c && "active")}>
                  {c === "todos" ? "Todos" : categoryLabels[c] ?? c}
                </button>
              ))}
            </div>

            <Input icon={<Search className="w-3.5 h-3.5" />}
              placeholder="Buscar produto..." value={search}
              onChange={(e) => setSearch(e.target.value)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
            </div>
          </div>

          {/* Cart */}
          <div className="xl:sticky xl:top-[72px] h-fit">
            <Card padding="none">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-forest-600" />
                  <h3 className="font-semibold text-gray-900">Carrinho</h3>
                </div>
                <Badge variant={cart.length > 0 ? "green" : "gray"} size="sm">{cart.length} item{cart.length !== 1 ? "s" : ""}</Badge>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-gray-400 px-5">
                  <ShoppingCart className="w-10 h-10 opacity-20" />
                  <p className="text-sm font-medium text-center">Nenhum item adicionado</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.qty}x · {formatCurrency(item.product.price)}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 num-display flex-shrink-0">
                        {formatCurrency(item.product.price * item.qty)}
                      </p>
                      <button onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="px-5 py-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total</span>
                    <span className="text-xl font-bold text-gray-900 num-display">{formatCurrency(cartTotal)}</span>
                  </div>
                  <Button className="w-full" icon={<ShoppingBag className="w-4 h-4" />}>
                    Finalizar venda
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    {["PIX", "Cartão", "Dinheiro"].map((m) => (
                      <button key={m} className="text-xs text-gray-600 border border-gray-200 rounded-md py-2 hover:bg-gray-50 transition-colors">
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "estoque" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["Produto","Categoria","Preço","Estoque","Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("badge text-2xs", categoryColors[p.category] ?? "bg-gray-100 text-gray-600")}>
                      {categoryLabels[p.category] ?? p.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 num-display">{formatCurrency(p.price)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-bold num-display", p.stock <= 5 ? "text-amber-600" : "text-gray-900")}>
                        {p.stock} {p.unit}
                      </span>
                      {p.stock <= 5 && <Badge variant="amber" size="sm">Baixo</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={p.active ? "green" : "gray"} size="sm" dot>{p.active ? "Ativo" : "Inativo"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "upsell" && (
        <div className="space-y-4">
          <div className="p-4 bg-forest-50 border border-forest-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-forest-500" />
              <p className="text-sm font-semibold text-forest-800">Motor de oportunidades ativo</p>
            </div>
            <p className="text-xs text-forest-600 leading-relaxed">
              O sistema analisa o perfil de cada cão e tutor para sugerir os produtos mais relevantes no momento certo. Aproveite estas oportunidades de hoje.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { dog: "Thor",    tutor: "Felipe M.", opp: "Nunca comprou mordedor natural. Está na creche hoje com alta energia.", product: "Mordedor de Couro Cru", price: 22 },
              { dog: "Max",     tutor: "Roberto L.", opp: "Frequenta hotel mas nunca comprou produto. Excelente oportunidade de apresentação.", product: "Kong Classic M", price: 89 },
              { dog: "Rex",     tutor: "Juliana C.", opp: "Hospedado há 2 dias — oferecer petisco e item de conforto extra.", product: "Petisco Natural de Frango", price: 28 },
              { dog: "Pipoca",  tutor: "Patrícia S.", opp: "Aniversário esta semana. Sugerir kit comemorativo.", product: "Kit Aniversário (2 produtos)", price: 65 },
            ].map((opp, i) => (
              <Card key={i} className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-forest-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opp.dog} <span className="font-normal text-gray-500">— {opp.tutor}</span></p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{opp.opp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{opp.product}</p>
                    <p className="text-xs text-forest-700 font-bold">{formatCurrency(opp.price)}</p>
                  </div>
                  <Button size="xs">Oferecer</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
