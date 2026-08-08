"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/app/login/actions";

export function AuthForm({
  action,
  mode,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  mode: "login" | "registro";
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const isLogin = mode === "login";

  return (
    <main className="safe-top flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
            💸
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Finanzas</h1>
          <p className="mt-1 text-sm text-muted">
            {isLogin ? "Entrá con tu cuenta." : "Creá tu cuenta con el código que te pasaron."}
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          {!isLogin && (
            <input
              name="code"
              placeholder="Código de invitación"
              aria-label="Código de invitación"
              autoCapitalize="none"
              autoComplete="off"
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 outline-none focus:border-accent"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Correo"
            aria-label="Correo"
            autoComplete={isLogin ? "username" : "email"}
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="email"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 outline-none focus:border-accent"
          />

          {!isLogin && (
            <input
              name="name"
              placeholder="Tu nombre (opcional)"
              aria-label="Tu nombre"
              autoComplete="name"
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 outline-none focus:border-accent"
            />
          )}

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            aria-label="Contraseña"
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 outline-none focus:border-accent"
          />

          {!isLogin && (
            <>
              <input
                type="password"
                name="passwordConfirm"
                placeholder="Repetí la contraseña"
                aria-label="Repetí la contraseña"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 outline-none focus:border-accent"
              />
              <p className="px-1 text-xs text-muted">
                Mínimo 8 caracteres, con al menos una letra y un número.
              </p>
            </>
          )}

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
            {pending ? "Un momento…" : isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isLogin ? (
            <>
              ¿No tenés cuenta?{" "}
              <Link href="/registro" className="font-medium text-accent">
                Registrate
              </Link>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="font-medium text-accent">
                Entrá
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
