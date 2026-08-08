"use client";

import { useState } from "react";

const NEW = "__new__";

export type PickableCategory = { id: number; name: string; icon: string };

/**
 * Selector de categoría con una opción para crear una nueva sin salir del
 * formulario. Al elegir "Crear nueva", el <select> deja de mandar categoryId y
 * en su lugar viajan newCategoryName y newCategoryIcon, que la Server Action
 * usa para dar de alta la categoría antes de guardar.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  label = "Categoría",
  defaultIcon = "📦",
  createLabel = "Crear categoría nueva…",
}: {
  categories: PickableCategory[];
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  defaultIcon?: string;
  createLabel?: string;
}) {
  // Si todavía no hay ninguna categoría, arrancamos directo en modo creación.
  const [creating, setCreating] = useState(categories.length === 0);

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>

      <select
        aria-label={label}
        value={creating ? NEW : (value ?? "")}
        onChange={(e) => {
          if (e.target.value === NEW) {
            setCreating(true);
            onChange(null);
          } else {
            setCreating(false);
            onChange(e.target.value ? Number(e.target.value) : null);
          }
        }}
        className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
      >
        <option value="">Elegir…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
        <option value={NEW}>➕ {createLabel}</option>
      </select>

      {/* Solo se manda cuando no estamos creando, para no pisar el nombre nuevo. */}
      {!creating && <input type="hidden" name="categoryId" value={value ?? ""} />}

      {creating && (
        <div className="mt-2 flex gap-2">
          <input
            name="newCategoryIcon"
            defaultValue={defaultIcon}
            aria-label="Emoji de la categoría nueva"
            maxLength={4}
            className="w-14 rounded-xl border border-border bg-surface px-2 py-3 text-center outline-none focus:border-accent"
          />
          <input
            name="newCategoryName"
            placeholder="Nombre de la categoría nueva"
            aria-label="Nombre de la categoría nueva"
            autoFocus={categories.length > 0}
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </div>
      )}
    </div>
  );
}
