"use client";

import { useActionState } from "react";
import { renameSubcategory, saveCategory } from "@/app/actions/catalog";
import type { FormState } from "@/app/actions/expenses";

export function CategoryEditForm({
  initial,
}: {
  initial: { id: number; name: string; icon: string; color: string };
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveCategory, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={initial.id} />

      <div className="flex gap-2">
        <input
          name="icon"
          defaultValue={initial.icon}
          aria-label="Emoji de la categoría"
          maxLength={4}
          className="w-16 rounded-xl border border-border bg-surface px-3 py-3 text-center outline-none focus:border-accent"
        />
        <input
          name="name"
          defaultValue={initial.name}
          aria-label="Nombre de la categoría"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
        />
        <input
          type="color"
          name="color"
          defaultValue={initial.color}
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
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

/** Renombrar una subcategoría sin salir de la lista. */
export function SubcategoryRenameForm({
  id,
  categoryId,
  name,
}: {
  id: number;
  categoryId: number;
  name: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(renameSubcategory, {});

  return (
    <form action={formAction} className="flex min-w-0 flex-1 items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <input
        name="name"
        defaultValue={name}
        aria-label={`Nombre de ${name}`}
        className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none focus:border-border focus:bg-surface-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-accent disabled:opacity-50"
      >
        {pending ? "…" : "Guardar"}
      </button>
      {state.error && <span className="sr-only">{state.error}</span>}
    </form>
  );
}
