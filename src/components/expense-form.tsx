"use client";

import { useActionState, useMemo, useState } from "react";
import { saveExpense, type FormState } from "@/app/actions/expenses";
import { bs, toNumber } from "@/lib/format";
import type { CategoryWithSubs, ProductRow } from "@/lib/queries";
import { CategoryPicker } from "./category-picker";
import { SearchIcon } from "./icons";

const UNITS = ["unidad", "kg", "litro", "gramo", "paquete", "docena", "arroba", "libra", "mes", "viaje"];

export type ExpenseInitial = {
  id?: number;
  productId: number | null;
  description: string;
  categoryId: number | null;
  subcategoryId: number | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  spentOn: string;
  note: string;
};

export function ExpenseForm({
  products,
  categories,
  frequent,
  initial,
}: {
  products: ProductRow[];
  categories: CategoryWithSubs[];
  frequent: ProductRow[];
  initial: ExpenseInitial;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveExpense, {});

  const [productId, setProductId] = useState<number | null>(initial.productId);
  const [description, setDescription] = useState(initial.description);
  const [showResults, setShowResults] = useState(false);
  const [unit, setUnit] = useState(initial.unit);
  const [categoryId, setCategoryId] = useState<number | null>(initial.categoryId);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(initial.subcategoryId);
  const [qty, setQty] = useState(String(initial.quantity || 1));
  const [price, setPrice] = useState(initial.unitPrice ? String(initial.unitPrice) : "");
  const [total, setTotal] = useState(initial.amount ? String(initial.amount) : "");

  const matches = useMemo(() => {
    const term = description.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => p.isActive && p.name.toLowerCase().includes(term))
      .slice(0, 6);
  }, [description, products]);

  const exactMatch = products.some(
    (p) => p.name.toLowerCase() === description.trim().toLowerCase() && p.unit === unit,
  );

  const subcategories = categories.find((c) => c.id === categoryId)?.subcategories ?? [];

  function pickProduct(product: ProductRow) {
    setProductId(product.id);
    setDescription(product.name);
    setUnit(product.unit);
    setCategoryId(product.categoryId);
    setSubcategoryId(product.subcategoryId);
    if (product.lastPrice > 0) {
      setPrice(String(product.lastPrice));
      setTotal(String(round(toNumber(qty) * product.lastPrice)));
    }
    setShowResults(false);
  }

  function onQty(value: string) {
    setQty(value);
    setTotal(String(round(toNumber(normalize(value)) * toNumber(normalize(price)))));
  }

  function onPrice(value: string) {
    setPrice(value);
    setTotal(String(round(toNumber(normalize(qty)) * toNumber(normalize(value)))));
  }

  function onTotal(value: string) {
    setTotal(value);
    const q = toNumber(normalize(qty));
    if (q > 0) setPrice(String(round(toNumber(normalize(value)) / q)));
  }

  return (
    <form action={formAction} className="space-y-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="productId" value={productId ?? ""} />

      {frequent.length > 0 && !initial.id && (
        <div className="-mx-4 px-4">
          <p className="mb-2 text-xs font-medium text-muted">Lo que más comprás</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {frequent.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickProduct(p)}
                className="shrink-0 rounded-full border border-border bg-surface px-3 py-2 text-sm active:bg-surface-2"
              >
                <span className="mr-1">{p.categoryIcon}</span>
                {p.name}
                {p.lastPrice > 0 && (
                  <span className="ml-1.5 text-xs text-muted">{bs(p.lastPrice)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <Field label="¿Qué compraste?">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="description"
            aria-label="Qué compraste"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setProductId(null);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Aceite, carne molida, luz…"
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

        {description.trim() && !productId && !exactMatch && (
          <label className="mt-2 flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="saveToCatalog"
              defaultChecked
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Guardar &ldquo;{description.trim()}&rdquo; en el catálogo
          </label>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cantidad">
          <input
            name="quantity"
            aria-label="Cantidad"
            value={qty}
            onChange={(e) => onQty(e.target.value)}
            type="text"
            inputMode="decimal"
            className="tabular w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </Field>

        <Field label="Unidad">
          <input
            name="unit"
            aria-label="Unidad de medida"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            list="unidades"
            className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
          <datalist id="unidades">
            {UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Precio unitario">
          <input
            name="unitPrice"
            aria-label="Precio unitario"
            value={price}
            onChange={(e) => onPrice(e.target.value)}
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className="tabular w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </Field>

        <Field label="Total pagado">
          <input
            name="amount"
            aria-label="Total pagado"
            value={total}
            onChange={(e) => onTotal(e.target.value)}
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className="tabular w-full rounded-xl border-2 border-accent bg-surface px-3 py-3 font-semibold outline-none"
          />
        </Field>
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
        <Field label="Subcategoría">
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
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <input
            type="date"
            name="spentOn"
            aria-label="Fecha del gasto"
            defaultValue={initial.spentOn}
            className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </Field>
        <Field label="Nota (opcional)">
          <input
            name="note"
            aria-label="Nota"
            defaultValue={initial.note}
            placeholder="Mercado, feria…"
            className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </Field>
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
          {pending ? "Guardando…" : `Guardar ${bs(toNumber(normalize(total)))}`}
        </button>
      </div>
    </form>
  );
}

/**
 * Un div y no un <label>, a propósito: el buscador de productos dibuja su lista
 * de resultados adentro, y un <label> reenviaría cada tap al input de texto.
 * Los inputs llevan su propio aria-label.
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </div>
  );
}

function normalize(value: string): string {
  return value.replace(",", ".");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
