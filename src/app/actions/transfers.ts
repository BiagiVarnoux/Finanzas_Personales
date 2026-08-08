"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { accounts, transfers } from "@/db/schema";
import { requireUserId } from "@/lib/current-user";
import { money, parseDecimal, parseId, parseText } from "@/lib/parse";
import { periodOf, todayISO } from "@/lib/period";
import type { FormState } from "./expenses";

function refresh() {
  revalidatePath("/", "layout");
}

/** Confirma que la cuenta existe y es de este usuario. */
async function ownedAccountId(userId: number, accountId: number | null): Promise<number | null> {
  if (!accountId) return null;
  const [row] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);
  return row?.id ?? null;
}

export async function saveTransfer(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));

  const fromAccountId = await ownedAccountId(userId, parseId(formData.get("fromAccountId")));
  const toAccountId = await ownedAccountId(userId, parseId(formData.get("toAccountId")));
  if (!fromAccountId) return { error: "Elegí de qué cuenta sale la plata." };
  if (!toAccountId) return { error: "Elegí a qué cuenta entra la plata." };
  if (fromAccountId === toAccountId) {
    return { error: "El origen y el destino tienen que ser cuentas distintas." };
  }

  const amount = parseDecimal(formData.get("amount"));
  if (amount <= 0) return { error: "El monto tiene que ser mayor a 0." };

  const transferredOn = parseText(formData.get("transferredOn")) || todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transferredOn)) return { error: "La fecha no es válida." };

  const values = {
    userId,
    transferredOn,
    period: periodOf(transferredOn),
    fromAccountId,
    toAccountId,
    amount: money(amount),
    note: parseText(formData.get("note")) || null,
  };

  if (id) {
    await db
      .update(transfers)
      .set(values)
      .where(and(eq(transfers.id, id), eq(transfers.userId, userId)));
  } else {
    await db.insert(transfers).values(values);
  }

  refresh();
  redirect("/ajustes/cuentas");
}

export async function deleteTransfer(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  if (id) {
    await db.delete(transfers).where(and(eq(transfers.id, id), eq(transfers.userId, userId)));
    refresh();
  }
  redirect("/ajustes/cuentas");
}
