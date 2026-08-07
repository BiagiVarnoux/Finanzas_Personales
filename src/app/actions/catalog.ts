"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, products, subcategories } from "@/db/schema";
import { money, parseDecimal, parseId, parseText } from "@/lib/parse";
import type { FormState } from "./expenses";

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = parseId(formData.get("id"));
  const name = parseText(formData.get("name"));
  if (!name) return { error: "El producto necesita un nombre." };

  const categoryId = parseId(formData.get("categoryId"));
  if (!categoryId) return { error: "Elegí una categoría." };

  const values = {
    name,
    unit: parseText(formData.get("unit")) || "unidad",
    lastPrice: money(parseDecimal(formData.get("lastPrice"))),
    categoryId,
    subcategoryId: parseId(formData.get("subcategoryId")),
  };

  try {
    if (id) {
      await db.update(products).set(values).where(eq(products.id, id));
    } else {
      await db.insert(products).values(values);
    }
  } catch {
    return { error: `Ya existe "${name}" con la unidad "${values.unit}".` };
  }

  refresh();
  redirect("/catalogo");
}

export async function deleteProduct(formData: FormData) {
  const id = parseId(formData.get("id"));
  if (id) {
    // No lo borramos de verdad: los gastos viejos lo siguen referenciando.
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
    refresh();
  }
  redirect("/catalogo");
}

export async function restoreProduct(formData: FormData) {
  const id = parseId(formData.get("id"));
  if (id) {
    await db.update(products).set({ isActive: true }).where(eq(products.id, id));
    refresh();
  }
  redirect("/catalogo");
}

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
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
      await db.update(categories).set(values).where(eq(categories.id, id));
    } else {
      await db.insert(categories).values({ ...values, sortOrder: 99 });
    }
  } catch {
    return { error: `Ya existe una categoría llamada "${name}".` };
  }

  refresh();
  redirect("/catalogo/categorias");
}

export async function deleteCategory(formData: FormData) {
  const id = parseId(formData.get("id"));
  if (!id) redirect("/catalogo/categorias");
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch {
    // Tiene gastos o productos colgando: la dejamos como está.
  }
  refresh();
  redirect("/catalogo/categorias");
}

export async function saveSubcategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const categoryId = parseId(formData.get("categoryId"));
  const name = parseText(formData.get("name"));
  if (!categoryId || !name) return { error: "Falta el nombre de la subcategoría." };

  try {
    await db.insert(subcategories).values({ categoryId, name }).onConflictDoNothing();
  } catch {
    return { error: "No se pudo guardar la subcategoría." };
  }

  refresh();
  redirect("/catalogo/categorias");
}

export async function deleteSubcategory(formData: FormData) {
  const id = parseId(formData.get("id"));
  if (id) {
    await db.delete(subcategories).where(eq(subcategories.id, id));
    refresh();
  }
  redirect("/catalogo/categorias");
}
