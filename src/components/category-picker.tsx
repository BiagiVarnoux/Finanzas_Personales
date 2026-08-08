"use client";

import { useState } from "react";

const NEW = "__new__";

export type PickableCategory = { id: number; name: string; icon: string };

/**
 * Selector con una opción para crear el elemento sin salir del formulario.
 * Al elegir "Crear nueva", el <select> deja de mandar el id y en su lugar viajan
 * los campos de nombre y emoji, que la Server Action usa para darlo de alta
 * antes de guardar.
 *
 * Sirve para categorías de gasto, de ingreso y para cuentas: solo cambian los
 * nombres de los campos del formulario.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  label = "Categoría",
  defaultIcon = "📦",
  createLabel = "Crear categoría nueva…",
  emptyLabel = "Elegir…",
  fieldName = "categoryId",
  newNameField = "newCategoryName",
  newIconField = "newCategoryIcon",
  namePlaceholder = "Nombre de la categoría nueva",
  optional = false,
}: {
  categories: PickableCategory[];
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  defaultIcon?: string;
  createLabel?: string;
  emptyLabel?: string;
  fieldName?: string;
  newNameField?: string;
  newIconField?: string;
  namePlaceholder?: string;
  /** Si es opcional, no arranca en modo creación aunque no haya nada cargado. */
  optional?: boolean;
}) {
  // Si todavía no hay ninguna opción, arrancamos directo en modo creación.
  const [creating, setCreating] = useState(!optional && categories.length === 0);

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
        <option value="">{emptyLabel}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
        <option value={NEW}>➕ {createLabel}</option>
      </select>

      {/* Solo se manda cuando no estamos creando, para no pisar el nombre nuevo. */}
      {!creating && <input type="hidden" name={fieldName} value={value ?? ""} />}

      {creating && (
        <div className="mt-2 flex gap-2">
          <input
            name={newIconField}
            defaultValue={defaultIcon}
            aria-label="Emoji"
            maxLength={4}
            className="w-14 rounded-xl border border-border bg-surface px-2 py-3 text-center outline-none focus:border-accent"
          />
          <input
            name={newNameField}
            placeholder={namePlaceholder}
            aria-label={namePlaceholder}
            autoFocus={categories.length > 0}
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </div>
      )}
    </div>
  );
}
