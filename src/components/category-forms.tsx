"use client";

import { useActionState } from "react";
import { saveCategory, saveSubcategory } from "@/app/actions/catalog";
import type { FormState } from "@/app/actions/expenses";
import { saveIncomeCategory } from "@/app/actions/incomes";
import { PlusIcon } from "./icons";

export function NewIncomeCategoryForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveIncomeCategory, {});

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-2">
        <input
          name="icon"
          defaultValue="💰"
          aria-label="Emoji de la categoría"
          maxLength={4}
          className="w-16 rounded-xl border border-border bg-surface px-3 py-3 text-center outline-none focus:border-accent"
        />
        <input
          name="name"
          placeholder="Sueldo, Negocio, Ventas…"
          aria-label="Nombre de la categoría de ingreso"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
        />
        <input
          type="color"
          name="color"
          defaultValue="#10794f"
          aria-label="Color de la categoría"
          className="h-12 w-12 shrink-0 rounded-xl border border-border bg-surface p-1"
        />
      </div>

      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white active:opacity-80 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Agregar categoría de ingreso"}
      </button>
    </form>
  );
}

export function NewCategoryForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveCategory, {});

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-2">
        <input
          name="icon"
          defaultValue="📦"
          aria-label="Emoji de la categoría"
          maxLength={4}
          className="w-16 rounded-xl border border-border bg-surface px-3 py-3 text-center outline-none focus:border-accent"
        />
        <input
          name="name"
          placeholder="Nombre de la categoría"
          aria-label="Nombre de la categoría"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
        />
        <input
          type="color"
          name="color"
          defaultValue="#64748b"
          aria-label="Color de la categoría"
          className="h-12 w-12 shrink-0 rounded-xl border border-border bg-surface p-1"
        />
      </div>

      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white active:opacity-80 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Agregar categoría"}
      </button>
    </form>
  );
}

export function NewSubcategoryForm({ categoryId }: { categoryId: number }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveSubcategory, {});

  return (
    <form action={formAction} className="mt-2 flex gap-2">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input
        name="name"
        placeholder="Nueva subcategoría"
        aria-label="Nueva subcategoría"
        className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={pending}
        aria-label="Agregar subcategoría"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted active:scale-95 disabled:opacity-50"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
      {state.error && <span className="sr-only">{state.error}</span>}
    </form>
  );
}
