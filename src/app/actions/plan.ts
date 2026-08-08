"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, planItems, products } from "@/db/schema";
import { requireUserId } from "@/lib/current-user";
import { ownedCategoryId, ownedProductId, ownedSubcategoryId } from "@/lib/owned";
import { money, parseDecimal, parseId, parseText, quantity } from "@/lib/parse";
import { currentPeriod, isValidPeriod, shiftPeriod } from "@/lib/period";
import type { FormState } from "./expenses";

function refresh() {
  revalidatePath("/", "layout");
}

export async function savePlanItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  const period = parseText(formData.get("period"));
  if (!isValidPeriod(period)) return { error: "Mes inválido." };

  // Igual que en los gastos: se puede crear la categoría sin salir del formulario.
  const newCategoryName = parseText(formData.get("newCategoryName"));
  let categoryId = await ownedCategoryId(userId, parseId(formData.get("categoryId")));
  if (newCategoryName) {
    const [row] = await db
      .insert(categories)
      .values({
        userId,
        name: newCategoryName,
        icon: parseText(formData.get("newCategoryIcon")) || "📦",
        sortOrder: 50,
      })
      .onConflictDoUpdate({
        target: [categories.userId, categories.name],
        set: { name: newCategoryName },
      })
      .returning({ id: categories.id });
    categoryId = row?.id ?? null;
  }
  if (!categoryId) return { error: "Elegí una categoría o creá una nueva." };

  const productId = await ownedProductId(userId, parseId(formData.get("productId")));
  const label = parseText(formData.get("label"));
  if (!productId && !label) return { error: "Escribí qué pensás comprar." };

  const qty = parseDecimal(formData.get("quantity")) || 1;
  const unitPrice = parseDecimal(formData.get("unitPrice"));
  const explicitAmount = parseDecimal(formData.get("amount"));
  const amount = explicitAmount > 0 ? explicitAmount : qty * unitPrice;
  if (amount <= 0) return { error: "El monto tiene que ser mayor a 0." };

  const values = {
    userId,
    period,
    productId,
    label: productId ? null : label,
    categoryId,
    subcategoryId: await ownedSubcategoryId(
      userId,
      parseId(formData.get("subcategoryId")),
      categoryId,
    ),
    quantity: quantity(qty),
    unitPrice: money(qty > 0 ? amount / qty : amount),
    amount: money(amount),
    note: parseText(formData.get("note")) || null,
  };

  if (id) {
    await db
      .update(planItems)
      .set(values)
      .where(and(eq(planItems.id, id), eq(planItems.userId, userId)));
  } else {
    await db.insert(planItems).values(values);
  }

  refresh();
  redirect(`/plan?mes=${period}`);
}

export async function deletePlanItem(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  const period = parseText(formData.get("period"));
  if (id) {
    await db.delete(planItems).where(and(eq(planItems.id, id), eq(planItems.userId, userId)));
    refresh();
  }
  redirect(isValidPeriod(period) ? `/plan?mes=${period}` : "/plan");
}

/** Copia el plan del mes anterior. No duplica lo que ya está cargado. */
export async function copyPreviousPlan(formData: FormData) {
  const userId = await requireUserId();
  const period = parseText(formData.get("period"));
  if (!isValidPeriod(period)) redirect("/plan");

  const previous = shiftPeriod(period, -1);
  const [source, existing] = await Promise.all([
    db
      .select()
      .from(planItems)
      .where(and(eq(planItems.userId, userId), eq(planItems.period, previous))),
    db
      .select()
      .from(planItems)
      .where(and(eq(planItems.userId, userId), eq(planItems.period, period))),
  ]);

  const alreadyThere = new Set(
    existing.map((i) => (i.productId ? `p${i.productId}` : `t${i.label?.toLowerCase()}`)),
  );

  const toInsert = source
    .filter((i) => !alreadyThere.has(i.productId ? `p${i.productId}` : `t${i.label?.toLowerCase()}`))
    .map((i) => ({
      userId,
      period,
      productId: i.productId,
      label: i.label,
      categoryId: i.categoryId,
      subcategoryId: i.subcategoryId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: i.amount,
      note: i.note,
    }));

  if (toInsert.length) await db.insert(planItems).values(toInsert);
  refresh();
  redirect(`/plan?mes=${period}`);
}

/** Actualiza los precios del plan con el último precio del catálogo. */
export async function syncPlanPrices(formData: FormData) {
  const userId = await requireUserId();
  const period = parseText(formData.get("period"));
  if (!isValidPeriod(period)) redirect("/plan");

  const rows = await db
    .select({
      id: planItems.id,
      quantity: planItems.quantity,
      lastPrice: products.lastPrice,
    })
    .from(planItems)
    .innerJoin(products, eq(products.id, planItems.productId))
    .where(and(eq(planItems.userId, userId), eq(planItems.period, period)));

  for (const row of rows) {
    if (row.lastPrice === null) continue;
    const price = Number(row.lastPrice);
    const qty = Number(row.quantity);
    await db
      .update(planItems)
      .set({ unitPrice: money(price), amount: money(price * qty) })
      .where(and(eq(planItems.id, row.id), eq(planItems.userId, userId)));
  }

  refresh();
  redirect(`/plan?mes=${period}`);
}

export async function goToCurrentPlan() {
  redirect(`/plan?mes=${currentPeriod()}`);
}
