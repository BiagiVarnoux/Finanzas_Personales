"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { requireUserId } from "@/lib/current-user";
import { money, parseDecimal, parseId, parseText } from "@/lib/parse";
import type { FormState } from "./expenses";

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Devuelve el id de la cuenta a usar. Si el formulario trae un nombre nuevo,
 * la crea en el momento. Devuelve null si no se eligió ninguna, que es válido:
 * la cuenta es opcional.
 */
export async function resolveAccount(formData: FormData): Promise<number | null> {
  const userId = await requireUserId();
  const newName = parseText(formData.get("newAccountName"));
  if (newName) {
    const [row] = await db
      .insert(accounts)
      .values({
        userId,
        name: newName,
        icon: parseText(formData.get("newAccountIcon")) || "💵",
        sortOrder: 50,
      })
      .onConflictDoUpdate({ target: [accounts.userId, accounts.name], set: { name: newName } })
      .returning({ id: accounts.id });
    return row?.id ?? null;
  }

  // Un id que no sea de este usuario no vale: se descarta en vez de guardarse.
  const accountId = parseId(formData.get("accountId"));
  if (!accountId) return null;
  const [own] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);
  return own?.id ?? null;
}

export async function saveAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  const name = parseText(formData.get("name"));
  if (!name) return { error: "La cuenta necesita un nombre." };

  const values = {
    name,
    icon: parseText(formData.get("icon")) || "💵",
    color: parseText(formData.get("color")) || "#10794f",
    openingBalance: money(parseDecimal(formData.get("openingBalance"))),
  };

  try {
    if (id) {
      await db
        .update(accounts)
        .set(values)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    } else {
      await db.insert(accounts).values({ ...values, userId, sortOrder: 50 });
    }
  } catch {
    return { error: `Ya existe una cuenta llamada "${name}".` };
  }

  refresh();
  redirect("/ajustes/cuentas");
}

/** No se borra: los movimientos viejos la siguen referenciando. */
export async function archiveAccount(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  if (id) {
    await db
      .update(accounts)
      .set({ isActive: false })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    refresh();
  }
  redirect("/ajustes/cuentas");
}

export async function restoreAccount(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  if (id) {
    await db
      .update(accounts)
      .set({ isActive: true })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    refresh();
  }
  redirect("/ajustes/cuentas");
}

/** Solo para cuentas que nunca se usaron. */
export async function deleteAccount(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  if (id) {
    try {
      await db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    } catch {
      // Tiene movimientos: se queda.
    }
    refresh();
  }
  redirect("/ajustes/cuentas");
}
