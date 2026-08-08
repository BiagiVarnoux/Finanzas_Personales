"use client";

import { useActionState, useMemo, useState } from "react";
import { savePlanItem } from "@/app/actions/plan";
import type { FormState } from "@/app/actions/expenses";
import { bs, toNumber } from "@/lib/format";
import type { CategoryWithSubs, ProductRow } from "@/lib/queries";
import { CategoryPicker } from "./category-picker";
import { SearchIcon } from "./icons";

export type PlanInitial = {
  id?: number;
  productId: number | null;
  label: string;
  categoryId: number | null;
  subcategoryId: number | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  note: string;
};

export function PlanItemForm({
  period,
  products,
  categories,
  initial,
}: {
  period: string;
  products: ProductRow[];
  categories: CategoryWithSubs[];
  initial: PlanInitial;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(savePlanItem, {});

  const [productId, setProductId] = useState<number | null>(initial.productId);
  const [label, setLabel] = useState(initial.label);
  const [showResults, setShowResults] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(initial.categoryId);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(initial.subcategoryId);
  const [qty, setQty] = useState(String(initial.quantity || 1));
  const [price, setPrice] = useState(initial.unitPrice ? String(initial.unitPrice) : "");

  const total = round(toNumber(normalize(qty)) * toNumber(normalize(price)));

  const matches = useMemo(() => {
    const term = label.trim().toLowerCase();
    if (!term) return [];
    return products.filter((p) => p.isActive && p.name.toLowerCase().includes(term)).slice(0, 6);
  }, [label, products]);

  function pickProduct(product: ProductRow) {
    setProductId(product.id);
    setLabel(product.name);
    setCategoryId(product.categoryId);
    setSubcategoryId(product.subcategoryId);
    if (product.lastPrice > 0) setPrice(String(product.lastPrice));
    setShowResults(false);
  }

  const subcategories = categories.find((c) => c.id === categoryId)?.subcategories ?? [];
  const selected = products.find((p) => p.id === productId);

  return (
    <form action={formAction} className="space-y-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="period" value={period} />
      <input type="hidden" name="productId" value={productId ?? ""} />
      <input type="hidden" name="amount" value={total} />

      <div>
        <span className="mb-1.5 block text-xs font-medium text-muted">¿Qué pensás comprar?</span>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="label"
            aria-label="Qué pensás comprar"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setProductId(null);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Buscá en el catálogo o escribilo"
            autoComplete="off"
            className="w-full rounded-xl border border-border bg-surface py-3 pr-3 pl-9 outline-none focus:border-accent"
          />
          {showResults && matches.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pickProduct(p)}
                    className="flex w-full items-center gap-2 px-3 py-3 text-left active:bg-surface-2"
                  >
                    <span>{p.categoryIcon}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {p.name}
                      <span className="text-muted"> · {p.unit}</span>
                    </span>
                    {p.lastPrice > 0 && (
                      <span className="tabular text-sm text-muted">{bs(p.lastPrice)}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Cantidad{selected ? ` (${selected.unit})` : ""}
          </span>
          <input
            name="quantity"
            aria-label="Cantidad"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            type="text"
            inputMode="decimal"
            className="tabular w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Precio unitario</span>
          <input
            name="unitPrice"
            aria-label="Precio unitario"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className="tabular w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="flex items-baseline justify-between rounded-xl bg-surface-2 px-4 py-3">
        <span className="text-sm text-muted">Presupuesto del mes</span>
        <span className="tabular text-lg font-semibold">{bs(total)}</span>
      </div>

      <CategoryPicker
        categories={categories}
        value={categoryId}
        onChange={(id) => {
          setCategoryId(id);
          setSubcategoryId(null);
        }}
      />

      {subcategories.length > 0 && (
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Subcategoría</span>
          <select
            name="subcategoryId"
            aria-label="Subcategoría"
            value={subcategoryId ?? ""}
            onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : null)}
            className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          >
            <option value="">Sin subcategoría</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <span className="mb-1.5 block text-xs font-medium text-muted">Nota (opcional)</span>
        <input
          name="note"
          aria-label="Nota"
          defaultValue={initial.note}
          className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
        />
      </div>

      {state.error && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <div className="safe-bottom sticky bottom-0 -mx-4 border-t border-border bg-bg/95 px-4 pt-3 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-accent px-4 py-4 font-semibold text-white active:opacity-80 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar en el plan"}
        </button>
      </div>
    </form>
  );
}

function normalize(value: string): string {
  return value.replace(",", ".");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
