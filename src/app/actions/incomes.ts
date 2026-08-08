"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { incomeCategories, incomes } from "@/db/schema";
import { requireUserId } from "@/lib/current-user";
import { isDuplicate } from "@/lib/db-errors";
import { money, parseDecimal, parseId, parseText } from "@/lib/parse";
import { isValidPeriod, periodOf, todayISO } from "@/lib/period";
import type { FormState } from "./expenses";
import { resolveAccount } from "./accounts";

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Devuelve el id de la categoría a usar. Si el formulario trae un nombre nuevo,
 * la crea en el momento (o reusa la que ya exista con ese nombre).
 */
async function resolveCategory(userId: number, formData: FormData): Promise<number | null> {
  const newName = parseText(formData.get("newCategoryName"));
  if (newName) {
    const [row] = await db
      .insert(incomeCategories)
      .values({
        userId,
        name: newName,
        icon: parseText(formData.get("newCategoryIcon")) || "💰",
        sortOrder: 50,
      })
      .onConflictDoUpdate({
        target: [incomeCategories.userId, incomeCategories.name],
        set: { name: newName },
      })
      .returning({ id: incomeCategories.id });
    return row?.id ?? null;
  }

  // Solo se acepta una categoría que sea de este usuario.
  const categoryId = parseId(formData.get("categoryId"));
  if (!categoryId) return null;
  const [own] = await db
    .select({ id: incomeCategories.id })
    .from(incomeCategories)
    .where(and(eq(incomeCategories.id, categoryId), eq(incomeCategories.userId, userId)))
    .limit(1);
  return own?.id ?? null;
}

export async function saveIncome(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  const receivedOn = parseText(formData.get("receivedOn")) || todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedOn)) return { error: "La fecha no es válida." };

  const description = parseText(formData.get("description"));
  if (!description) return { error: "Escribí de qué es el ingreso." };

  const amount = parseDecimal(formData.get("amount"));
  if (amount <= 0) return { error: "El monto tiene que ser mayor a 0." };

  const categoryId = await resolveCategory(userId, formData);
  if (!categoryId) return { error: "Elegí una categoría o creá una nueva." };

  const values = {
    userId,
    receivedOn,
    period: periodOf(receivedOn),
    description,
    categoryId,
    amount: money(amount),
    accountId: await resolveAccount(formData),
    note: parseText(formData.get("note")) || null,
  };

  if (id) {
    await db
      .update(incomes)
      .set(values)
      .where(and(eq(incomes.id, id), eq(incomes.userId, userId)));
  } else {
    await db.insert(incomes).values(values);
  }

  refresh();
  redirect(`/ingresos?mes=${values.period}`);
}

export async function deleteIncome(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  const period = parseText(formData.get("period"));
  if (id) {
    await db.delete(incomes).where(and(eq(incomes.id, id), eq(incomes.userId, userId)));
    refresh();
  }
  redirect(isValidPeriod(period) ? `/ingresos?mes=${period}` : "/ingresos");
}

export async function saveIncomeCategory(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  const name = parseText(formData.get("name"));
  if (!name) return { error: "La categoría necesita un nombre." };

  const values = {
    name,
    icon: parseText(formData.get("icon")) || "💰",
    color: parseText(formData.get("color")) || "#10794f",
  };

  try {
    if (id) {
      await db
        .update(incomeCategories)
        .set(values)
        .where(and(eq(incomeCategories.id, id), eq(incomeCategories.userId, userId)));
    } else {
      await db.insert(incomeCategories).values({ ...values, userId, sortOrder: 50 });
    }
  } catch (err) {
    return isDuplicate(err, "saveIncomeCategory")
      ? { error: `Ya existe una categoría de ingreso llamada "${name}".` }
      : { error: "No se pudo guardar la categoría. Probá de nuevo." };
  }

  refresh();
  redirect("/ajustes/categorias-ingreso");
}

export async function deleteIncomeCategory(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  if (id) {
    try {
      await db
        .delete(incomeCategories)
        .where(and(eq(incomeCategories.id, id), eq(incomeCategories.userId, userId)));
    } catch {
      // Tiene ingresos asociados: la foreign key la protege.
    }
    refresh();
  }
  redirect("/ajustes/categorias-ingreso");
}
