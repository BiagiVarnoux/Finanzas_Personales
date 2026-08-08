"use client";

import { useActionState } from "react";
import { saveAccount } from "@/app/actions/accounts";
import type { FormState } from "@/app/actions/expenses";

/** Atajos para las cuentas típicas, así no hay que pensar el emoji. */
const SUGGESTIONS = [
  { icon: "💵", name: "Efectivo" },
  { icon: "🏦", name: "Banco" },
  { icon: "📱", name: "QR" },
  { icon: "💳", name: "Tarjeta" },
];

export type AccountInitial = {
  id?: number;
  name: string;
  icon: string;
  color: string;
  openingBalance: number;
};

export function AccountForm({
  initial,
  showSuggestions = false,
}: {
  initial: AccountInitial;
  showSuggestions?: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveAccount, {});

  function fill(icon: string, name: string) {
    const form = document.getElementById("account-form") as HTMLFormElement | null;
    if (!form) return;
    (form.elements.namedItem("icon") as HTMLInputElement).value = icon;
    (form.elements.namedItem("name") as HTMLInputElement).value = name;
  }

  return (
    <form id="account-form" action={formAction} className="space-y-3">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      {showSuggestions && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => fill(s.icon, s.name)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm active:bg-surface-2"
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          name="icon"
          defaultValue={initial.icon}
          aria-label="Emoji de la cuenta"
          maxLength={4}
          className="w-16 rounded-xl border border-border bg-surface px-3 py-3 text-center outline-none focus:border-accent"
        />
        <input
          name="name"
          defaultValue={initial.name}
          placeholder="Efectivo, Banco, QR…"
          aria-label="Nombre de la cuenta"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
        />
        <input
          type="color"
          name="color"
          defaultValue={initial.color}
          aria-label="Color de la cuenta"
          className="h-12 w-12 shrink-0 rounded-xl border border-border bg-surface p-1"
        />
      </div>

      <div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Saldo inicial: cuánto hay hoy en esta cuenta
          </span>
          <input
            name="openingBalance"
            defaultValue={initial.openingBalance ? String(initial.openingBalance) : ""}
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className="tabular w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </label>
        <p className="mt-1.5 text-xs text-muted">
          Es el punto de partida. A partir de ahí, la app le suma los ingresos y le resta los
          gastos que marques con esta cuenta.
        </p>
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
        {pending ? "Guardando…" : initial.id ? "Guardar cambios" : "Agregar cuenta"}
      </button>
    </form>
  );
}
