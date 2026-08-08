import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, subcategories } from "@/db/schema";

/**
 * Los ids de categoría, subcategoría y producto llegan del formulario, así que
 * son datos que manda el navegador y se pueden falsear. Antes de guardarlos hay
 * que confirmar que le pertenecen a quien está guardando: si no, alguien podría
 * apuntar su gasto a la categoría de otra persona y terminar viendo su nombre.
 *
 * Devuelven el id si es del usuario, o null si no lo es.
 */

export async function ownedCategoryId(
  userId: number,
  categoryId: number | null,
): Promise<number | null> {
  if (!categoryId) return null;
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  return row?.id ?? null;
}

/** Además de ser del usuario, la subcategoría tiene que colgar de esa categoría. */
export async function ownedSubcategoryId(
  userId: number,
  subcategoryId: number | null,
  categoryId: number | null,
): Promise<number | null> {
  if (!subcategoryId || !categoryId) return null;
  const [row] = await db
    .select({ id: subcategories.id })
    .from(subcategories)
    .where(
      and(
        eq(subcategories.id, subcategoryId),
        eq(subcategories.userId, userId),
        eq(subcategories.categoryId, categoryId),
      ),
    )
    .limit(1);
  return row?.id ?? null;
}

export async function ownedProductId(
  userId: number,
  productId: number | null,
): Promise<number | null> {
  if (!productId) return null;
  const [row] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.userId, userId)))
    .limit(1);
  return row?.id ?? null;
}
