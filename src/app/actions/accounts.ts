"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { accounts } from "@/db/schema";
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
  const newName = parseText(formData.get("newAccountName"));
  if (newName) {
    const [row] = await db
      .insert(accounts)
      .values({
        name: newName,
        icon: parseText(formData.get("newAccountIcon")) || "💵",
        sortOrder: 50,
      })
      .onConflictDoUpdate({ target: accounts.name, set: { name: newName } })
      .returning({ id: accounts.id });
    return row?.id ?? null;
  }
  return parseId(formData.get("accountId"));
}

export async function saveAccount(_prev: FormState, formData: FormData): Promise<FormState> {
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
      await db.update(accounts).set(values).where(eq(accounts.id, id));
    } else {
      await db.insert(accounts).values({ ...values, sortOrder: 50 });
    }
  } catch {
    return { error: `Ya existe una cuenta llamada "${name}".` };
  }

  refresh();
  redirect("/ajustes/cuentas");
}

/** No se borra: los movimientos viejos la siguen referenciando. */
export async function archiveAccount(formData: FormData) {
  const id = parseId(formData.get("id"));
  if (id) {
    await db.update(accounts).set({ isActive: false }).where(eq(accounts.id, id));
    refresh();
  }
  redirect("/ajustes/cuentas");
}

export async function restoreAccount(formData: FormData) {
  const id = parseId(formData.get("id"));
  if (id) {
    await db.update(accounts).set({ isActive: true }).where(eq(accounts.id, id));
    refresh();
  }
  redirect("/ajustes/cuentas");
}

/** Solo para cuentas que nunca se usaron. */
export async function deleteAccount(formData: FormData) {
  const id = parseId(formData.get("id"));
  if (id) {
    try {
      await db.delete(accounts).where(eq(accounts.id, id));
    } catch {
      // Tiene movimientos: se queda.
    }
    refresh();
  }
  redirect("/ajustes/cuentas");
}
