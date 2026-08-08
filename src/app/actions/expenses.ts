"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, expenses, products } from "@/db/schema";
import { money, parseDecimal, parseId, parseText, quantity } from "@/lib/parse";
import { isValidPeriod, periodOf, todayISO } from "@/lib/period";
import { resolveAccount } from "./accounts";

export type FormState = { error?: string; ok?: boolean };

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
      .insert(categories)
      .values({
        name: newName,
        icon: parseText(formData.get("newCategoryIcon")) || "📦",
        sortOrder: 50,
      })
      .onConflictDoUpdate({ target: categories.name, set: { name: newName } })
      .returning({ id: categories.id });
    return row?.id ?? null;
  }
  return parseId(formData.get("categoryId"));
}

export async function saveExpense(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = parseId(formData.get("id"));
  const spentOn = parseText(formData.get("spentOn")) || todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spentOn)) return { error: "La fecha no es válida." };

  const categoryId = await resolveCategory(formData);
  if (!categoryId) return { error: "Elegí una categoría o creá una nueva." };

  const productId = parseId(formData.get("productId"));
  const description = parseText(formData.get("description"));
  if (!productId && !description) return { error: "Escribí qué compraste." };

  const qty = parseDecimal(formData.get("quantity")) || 1;
  const unitPrice = parseDecimal(formData.get("unitPrice"));
  const explicitAmount = parseDecimal(formData.get("amount"));
  const amount = explicitAmount > 0 ? explicitAmount : qty * unitPrice;
  if (amount <= 0) return { error: "El monto tiene que ser mayor a 0." };

  const unit = parseText(formData.get("unit")) || "unidad";
  const subcategoryId = parseId(formData.get("subcategoryId"));
  const note = parseText(formData.get("note")) || null;

  // Producto nuevo: si escribió un nombre que no está en el catálogo y dejó
  // marcado "guardar en catálogo", lo damos de alta acá mismo.
  let finalProductId = productId;
  if (!finalProductId && formData.get("saveToCatalog") === "on") {
    const [created] = await db
      .insert(products)
      .values({
        name: description,
        unit,
        lastPrice: money(qty > 0 ? amount / qty : amount),
        categoryId,
        subcategoryId,
      })
      .onConflictDoUpdate({
        target: [products.name, products.unit],
        set: { lastPrice: money(qty > 0 ? amount / qty : amount), categoryId, subcategoryId },
      })
      .returning({ id: products.id });
    finalProductId = created?.id ?? null;
  }

  const values = {
    spentOn,
    period: periodOf(spentOn),
    productId: finalProductId,
    description: description || (await productName(finalProductId)) || "Gasto",
    categoryId,
    subcategoryId,
    quantity: quantity(qty),
    unit,
    unitPrice: money(qty > 0 ? amount / qty : amount),
    amount: money(amount),
    accountId: await resolveAccount(formData),
    note,
  };

  if (id) {
    await db.update(expenses).set(values).where(eq(expenses.id, id));
  } else {
    await db.insert(expenses).values(values);
  }

  // El catálogo aprende el último precio pagado.
  if (finalProductId) {
    await db
      .update(products)
      .set({ lastPrice: values.unitPrice })
      .where(eq(products.id, finalProductId));
  }

  refresh();
  redirect(`/gastos?mes=${values.period}`);
}

async function productName(productId: number | null): Promise<string | null> {
  if (!productId) return null;
  const [row] = await db
    .select({ name: products.name })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  return row?.name ?? null;
}

export async function deleteExpense(formData: FormData) {
  const id = parseId(formData.get("id"));
  if (!id) return;
  await db.delete(expenses).where(eq(expenses.id, id));
  refresh();

  const period = parseText(formData.get("period"));
  redirect(isValidPeriod(period) ? `/gastos?mes=${period}` : "/gastos");
}
