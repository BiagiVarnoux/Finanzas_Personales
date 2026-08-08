"use client";

import { useActionState, useState } from "react";
import { saveTransfer } from "@/app/actions/transfers";
import type { FormState } from "@/app/actions/expenses";
import { bs, toNumber } from "@/lib/format";
import type { AccountBalance } from "@/lib/queries";

export type TransferInitial = {
  id?: number;
  fromAccountId: number | null;
  toAccountId: number | null;
  amount: number;
  transferredOn: string;
  note: string;
};

export function TransferForm({
  accounts,
  initial,
}: {
  accounts: AccountBalance[];
  initial: TransferInitial;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveTransfer, {});
  const [fromId, setFromId] = useState<number | null>(initial.fromAccountId);
  const [toId, setToId] = useState<number | null>(initial.toAccountId);
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount) : "");

  const from = accounts.find((a) => a.id === fromId);
  const to = accounts.find((a) => a.id === toId);
  const monto = toNumber(amount.replace(",", "."));

  // Solo un aviso: puede que estés registrando algo de hace días y el saldo de
  // hoy ya no refleje el de entonces, así que no bloquea el guardado.
  const quedaCorto = from && monto > 0 && monto > from.balance;

  function elegirOrigen(id: number | null) {
    setFromId(id);
    if (id !== null && id === toId) setToId(null);
  }

  function elegirDestino(id: number | null) {
    setToId(id);
    if (id !== null && id === fromId) setFromId(null);
  }

  return (
    <form action={formAction} className="space-y-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <Selector
        label="¿De qué cuenta sale?"
        name="fromAccountId"
        accounts={accounts}
        value={fromId}
        excluir={toId}
        onChange={elegirOrigen}
      />

      <div className="flex justify-center">
        <span className="text-xl text-muted" aria-hidden="true">
          ↓
        </span>
      </div>

      <Selector
        label="¿A qué cuenta entra?"
        name="toAccountId"
        accounts={accounts}
        value={toId}
        excluir={fromId}
        onChange={elegirDestino}
      />

      <div>
        <span className="mb-1.5 block text-xs font-medium text-muted">Monto</span>
        <input
          name="amount"
          aria-label="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          className="tabular w-full rounded-xl border-2 border-accent bg-surface px-3 py-3 text-lg font-semibold outline-none"
        />
        {quedaCorto && (
          <p className="mt-1.5 text-xs text-warn">
            {from!.name} tiene {bs(from!.balance)}. Se puede guardar igual y el saldo queda en
            negativo.
          </p>
        )}
      </div>

      {from && to && monto > 0 && (
        <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="min-w-0 truncate text-muted">
              {from.icon} {from.name}
            </span>
            <span className="tabular shrink-0 font-medium">
              {bs(from.balance)} → {bs(from.balance - monto)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="min-w-0 truncate text-muted">
              {to.icon} {to.name}
            </span>
            <span className="tabular shrink-0 font-medium text-accent">
              {bs(to.balance)} → {bs(to.balance + monto)}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Fecha</span>
          <input
            type="date"
            name="transferredOn"
            aria-label="Fecha de la transferencia"
            defaultValue={initial.transferredOn}
            className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Nota (opcional)</span>
          <input
            name="note"
            aria-label="Nota"
            defaultValue={initial.note}
            placeholder="Retiro del cajero…"
            className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </div>
      </div>

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
        {pending ? "Guardando…" : `Transferir ${bs(monto)}`}
      </button>
    </form>
  );
}

function Selector({
  label,
  name,
  accounts,
  value,
  excluir,
  onChange,
}: {
  label: string;
  name: string;
  accounts: AccountBalance[];
  value: number | null;
  excluir: number | null;
  onChange: (id: number | null) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <select
        name={name}
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
      >
        <option value="">Elegir…</option>
        {accounts
          .filter((a) => a.id !== excluir)
          .map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon} {a.name} · {bs(a.balance)}
            </option>
          ))}
      </select>
    </div>
  );
}
