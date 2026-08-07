"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
            💸
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Finanzas</h1>
          <p className="mt-1 text-sm text-muted">Gastos del mes, plan y precios.</p>
        </div>

        <form action={formAction} className="space-y-3">
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            inputMode="text"
            autoFocus
            placeholder="Contraseña"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-4 text-center outline-none focus:border-accent"
          />

          {state.error && (
            <p className="text-center text-sm text-danger" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-accent px-4 py-4 font-semibold text-white active:opacity-80 disabled:opacity-50"
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
