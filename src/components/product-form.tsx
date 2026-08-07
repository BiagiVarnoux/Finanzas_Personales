"use client";

import { useActionState, useState } from "react";
import { saveProduct } from "@/app/actions/catalog";
import type { FormState } from "@/app/actions/expenses";
import type { CategoryWithSubs } from "@/lib/queries";

const UNITS = ["unidad", "kg", "litro", "gramo", "paquete", "docena", "arroba", "libra", "mes", "viaje"];

export type ProductInitial = {
  id?: number;
  name: string;
  unit: string;
  lastPrice: number;
  categoryId: number | null;
  subcategoryId: number | null;
};

export function ProductForm({
  categories,
  initial,
}: {
  categories: CategoryWithSubs[];
  initial: ProductInitial;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const [categoryId, setCategoryId] = useState<number | null>(initial.categoryId);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(initial.subcategoryId);

  const subcategories = categories.find((c) => c.id === categoryId)?.subcategories ?? [];

  return (
    <form action={formAction} className="space-y-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Nombre</span>
        <input
          name="name"
          defaultValue={initial.name}
          placeholder="Aceite"
          autoFocus={!initial.id}
          className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Unidad de medida</span>
          <input
            name="unit"
            defaultValue={initial.unit}
            list="unidades-catalogo"
            className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
          <datalist id="unidades-catalogo">
            {UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Precio de referencia</span>
          <input
            name="lastPrice"
            defaultValue={initial.lastPrice ? String(initial.lastPrice) : ""}
            type="text"
            inputMode="decimal"
            placeholder="19,50"
            className="tabular w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Categoría</span>
        <select
          name="categoryId"
          value={categoryId ?? ""}
          onChange={(e) => {
            setCategoryId(e.target.value ? Number(e.target.value) : null);
            setSubcategoryId(null);
          }}
          className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
        >
          <option value="">Elegir…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </label>

      {subcategories.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Subcategoría</span>
          <select
            name="subcategoryId"
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
        </label>
      )}

      {state.error && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-accent px-4 py-4 font-semibold text-white active:opacity-80 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar producto"}
      </button>
    </form>
  );
}
