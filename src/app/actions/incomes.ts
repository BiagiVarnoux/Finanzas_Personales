"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { incomeCategories, incomes } from "@/db/schema";
import { money, parseDecimal, parseId, parseText } from "@/lib/parse";
import { isValidPeriod, periodOf, todayISO } from "@/lib/period";
import type { FormState } from "./expenses";

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Devuelve el id de la categoría a usar. Si el formulario trae un nombre nuevo,
 * la crea en el momento (o reusa la que ya exista con ese nombre).
 */
async function resolveCategory(formData: FormData): Promise<number | null> {
  const newName = parseText(formData.get("newCategoryName"));
  if (newName) {
    const [row] = await db
      .insert(incomeCategories)
      .values({
        name: newName,
        icon: parseText(formData.get("newCategoryIcon")) || "💰",
        sortOrder: 50,
      })
      .onConflictDoUpdate({ target: incomeCategories.name, set: { name: newName } })
      .returning({ id: incomeCategories.id });
    return row?.id ?? null;
  }
  return parseId(formData.get("categoryId"));
}

export async function saveIncome(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = parseId(formData.get("id"));
  const receivedOn = parseText(formData.get("receivedOn")) || todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedOn)) return { error: "La fecha no es válida." };

  const description = parseText(formData.get("description"));
  if (!description) return { error: "Escribí de qué es el ingreso." };

  const amount = parseDecimal(formData.get("amount"));
  if (amount <= 0) return { error: "El monto tiene que ser mayor a 0." };

  const categoryId = await resolveCategory(formData);
  if (!categoryId) return { error: "Elegí una categoría o creá una nueva." };

  const values = {
    receivedOn,
    period: periodOf(receivedOn),
    description,
    categoryId,
    amount: money(amount),
    note: parseText(formData.get("note")) || null,
  };

  if (id) {
    await db.update(incomes).set(values).where(eq(incomes.id, id));
  } else {
    await db.insert(incomes).values(values);
  }

  refresh();
  redirect(`/ingresos?mes=${values.period}`);
}

export async function deleteIncome(formData: FormData) {
  const id = parseId(formData.get("id"));
  const period = parseText(formData.get("period"));
  if (id) {
    await db.delete(incomes).where(eq(incomes.id, id));
    refresh();
  }
  redirect(isValidPeriod(period) ? `/ingresos?mes=${period}` : "/ingresos");
}

export async function saveIncomeCategory(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
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
      await db.update(incomeCategories).set(values).where(eq(incomeCategories.id, id));
    } else {
      await db.insert(incomeCategories).values({ ...values, sortOrder: 50 });
    }
  } catch {
    return { error: `Ya existe una categoría de ingreso llamada "${name}".` };
  }

  refresh();
  redirect("/ajustes/categorias-ingreso");
}

export async function deleteIncomeCategory(formData: FormData) {
  const id = parseId(formData.get("id"));
  if (id) {
    try {
      await db.delete(incomeCategories).where(eq(incomeCategories.id, id));
    } catch {
      // Tiene ingresos asociados: la foreign key la protege.
    }
    refresh();
  }
  redirect("/ajustes/categorias-ingreso");
}
