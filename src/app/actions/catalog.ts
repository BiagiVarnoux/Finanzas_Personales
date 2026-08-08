"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, products, subcategories } from "@/db/schema";
import { requireUserId } from "@/lib/current-user";
import { isDuplicate } from "@/lib/db-errors";
import { ownedCategoryId, ownedSubcategoryId } from "@/lib/owned";
import { money, parseDecimal, parseId, parseText } from "@/lib/parse";
import type { FormState } from "./expenses";

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  const name = parseText(formData.get("name"));
  if (!name) return { error: "El producto necesita un nombre." };

  const categoryId = await ownedCategoryId(userId, parseId(formData.get("categoryId")));
  if (!categoryId) return { error: "Elegí una categoría." };

  const values = {
    name,
    unit: parseText(formData.get("unit")) || "unidad",
    lastPrice: money(parseDecimal(formData.get("lastPrice"))),
    categoryId,
    subcategoryId: await ownedSubcategoryId(
      userId,
      parseId(formData.get("subcategoryId")),
      categoryId,
    ),
  };

  try {
    if (id) {
      await db
        .update(products)
        .set(values)
        .where(and(eq(products.id, id), eq(products.userId, userId)));
    } else {
      await db.insert(products).values({ ...values, userId });
    }
  } catch (err) {
    return isDuplicate(err, "saveProduct")
      ? { error: `Ya existe "${name}" con la unidad "${values.unit}".` }
      : { error: "No se pudo guardar el producto. Probá de nuevo." };
  }

  refresh();
  redirect("/catalogo");
}

export async function deleteProduct(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  if (id) {
    // No lo borramos de verdad: los gastos viejos lo siguen referenciando.
    await db
      .update(products)
      .set({ isActive: false })
      .where(and(eq(products.id, id), eq(products.userId, userId)));
    refresh();
  }
  redirect("/catalogo");
}

export async function restoreProduct(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  if (id) {
    await db
      .update(products)
      .set({ isActive: true })
      .where(and(eq(products.id, id), eq(products.userId, userId)));
    refresh();
  }
  redirect("/catalogo");
}

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  const name = parseText(formData.get("name"));
  if (!name) return { error: "La categoría necesita un nombre." };

  const values = {
    name,
    icon: parseText(formData.get("icon")) || "📦",
    color: parseText(formData.get("color")) || "#64748b",
  };

  try {
    if (id) {
      await db
        .update(categories)
        .set(values)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    } else {
      await db.insert(categories).values({ ...values, userId, sortOrder: 99 });
    }
  } catch (err) {
    return isDuplicate(err, "saveCategory")
      ? { error: `Ya existe una categoría llamada "${name}".` }
      : { error: "No se pudo guardar la categoría. Probá de nuevo." };
  }

  refresh();
  redirect(id ? `/catalogo/categorias/${id}` : "/catalogo/categorias");
}

/**
 * La foreign key es restrict: si quedan productos, gastos o items de plan
 * apuntando a la categoría, Postgres rechaza el borrado. Antes eso se tragaba
 * en silencio y la pantalla volvía igual, sin explicar nada; ahora el motivo
 * viaja en la URL y la pantalla lo muestra.
 */
export async function deleteCategory(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  if (!id) redirect("/catalogo/categorias");

  try {
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  } catch {
    redirect(`/catalogo/categorias/${id}?error=en-uso`);
  }

  refresh();
  redirect("/catalogo/categorias?borrada=1");
}

export async function renameSubcategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  const name = parseText(formData.get("name"));
  if (!id || !name) return { error: "Falta el nombre." };

  try {
    await db
      .update(subcategories)
      .set({ name })
      .where(and(eq(subcategories.id, id), eq(subcategories.userId, userId)));
  } catch (err) {
    return isDuplicate(err, "renameSubcategory")
      ? { error: `Ya existe una subcategoría llamada "${name}" en esta categoría.` }
      : { error: "No se pudo renombrar. Probá de nuevo." };
  }

  refresh();
  redirect(`/catalogo/categorias/${parseId(formData.get("categoryId")) ?? ""}`);
}

export async function saveSubcategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const categoryId = parseId(formData.get("categoryId"));
  const name = parseText(formData.get("name"));
  if (!categoryId || !name) return { error: "Falta el nombre de la subcategoría." };

  // La categoría padre tiene que ser de este usuario.
  const [parent] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!parent) return { error: "Esa categoría no existe." };

  try {
    await db.insert(subcategories).values({ userId, categoryId, name }).onConflictDoNothing();
  } catch (err) {
    return isDuplicate(err, "saveSubcategory")
      ? { error: `Ya existe una subcategoría llamada "${name}" acá.` }
      : { error: "No se pudo guardar la subcategoría. Probá de nuevo." };
  }

  refresh();
  redirect(`/catalogo/categorias/${categoryId}`);
}

export async function deleteSubcategory(formData: FormData) {
  const userId = await requireUserId();
  const id = parseId(formData.get("id"));
  if (id) {
    // La foreign key es "set null": los movimientos que la usaban no se borran,
    // quedan sin subcategoría.
    await db
      .delete(subcategories)
      .where(and(eq(subcategories.id, id), eq(subcategories.userId, userId)));
    refresh();
  }
  const categoryId = parseId(formData.get("categoryId"));
  redirect(categoryId ? `/catalogo/categorias/${categoryId}` : "/catalogo/categorias");
}
