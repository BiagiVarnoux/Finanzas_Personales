"use client";

import { useActionState, useState } from "react";
import { saveIncome } from "@/app/actions/incomes";
import type { FormState } from "@/app/actions/expenses";
import { bs, toNumber } from "@/lib/format";
import type { AccountRow, IncomeCategoryRow } from "@/lib/queries";
import { CategoryPicker } from "./category-picker";

export type IncomeInitial = {
  id?: number;
  description: string;
  categoryId: number | null;
  amount: number;
  receivedOn: string;
  note: string;
  accountId: number | null;
};

export function IncomeForm({
  categories,
  accounts,
  initial,
}: {
  categories: IncomeCategoryRow[];
  accounts: AccountRow[];
  initial: IncomeInitial;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveIncome, {});
  const [categoryId, setCategoryId] = useState<number | null>(initial.categoryId);
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount) : "");
  const [accountId, setAccountId] = useState<number | null>(initial.accountId);

  return (
    <form action={formAction} className="space-y-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div>
        <span className="mb-1.5 block text-xs font-medium text-muted">¿De qué es el ingreso?</span>
        <input
          name="description"
          aria-label="De qué es el ingreso"
          defaultValue={initial.description}
          placeholder="Sueldo de agosto, venta, alquiler…"
          autoFocus={!initial.id}
          className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
        />
      </div>

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
      </div>

      <CategoryPicker
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
        defaultIcon="💰"
        createLabel="Crear categoría de ingreso…"
      />

      <CategoryPicker
        categories={accounts}
        value={accountId}
        onChange={setAccountId}
        label="¿A dónde entró la plata?"
        emptyLabel="Sin especificar"
        defaultIcon="💵"
        createLabel="Crear cuenta nueva…"
        namePlaceholder="Efectivo, Banco, QR…"
        fieldName="accountId"
        newNameField="newAccountName"
        newIconField="newAccountIcon"
        optional
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Fecha</span>
          <input
            type="date"
            name="receivedOn"
            aria-label="Fecha del ingreso"
            defaultValue={initial.receivedOn}
            className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Nota (opcional)</span>
          <input
            name="note"
            aria-label="Nota"
            defaultValue={initial.note}
            className="w-full rounded-xl border border-border bg-surface px-3 py-3 outline-none focus:border-accent"
          />
        </div>
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
          {pending ? "Guardando…" : `Guardar ${bs(toNumber(amount.replace(",", ".")))}`}
        </button>
      </div>
    </form>
  );
}
