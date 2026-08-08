import "server-only";
import { and, asc, desc, eq, gte, ilike, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  expenses,
  incomeCategories,
  incomes,
  planItems,
  products,
  subcategories,
} from "@/db/schema";
import { toNumber } from "./format";
import { periodRange } from "./period";

export type CategoryWithSubs = {
  id: number;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  subcategories: { id: number; name: string }[];
};

export async function getCategories(): Promise<CategoryWithSubs[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      sortOrder: categories.sortOrder,
      subId: subcategories.id,
      subName: subcategories.name,
      subSort: subcategories.sortOrder,
    })
    .from(categories)
    .leftJoin(subcategories, eq(subcategories.categoryId, categories.id))
    .orderBy(asc(categories.sortOrder), asc(categories.name), asc(subcategories.sortOrder), asc(subcategories.name));

  const byId = new Map<number, CategoryWithSubs>();
  for (const row of rows) {
    let cat = byId.get(row.id);
    if (!cat) {
      cat = {
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        sortOrder: row.sortOrder,
        subcategories: [],
      };
      byId.set(row.id, cat);
    }
    if (row.subId !== null) cat.subcategories.push({ id: row.subId, name: row.subName! });
  }
  return [...byId.values()];
}

export type ProductRow = {
  id: number;
  name: string;
  unit: string;
  lastPrice: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  subcategoryId: number | null;
  subcategoryName: string | null;
  isActive: boolean;
};

export async function getProducts(search?: string): Promise<ProductRow[]> {
  const term = search?.trim();
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      unit: products.unit,
      lastPrice: products.lastPrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      subcategoryId: products.subcategoryId,
      subcategoryName: subcategories.name,
      isActive: products.isActive,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(subcategories, eq(subcategories.id, products.subcategoryId))
    .where(term ? or(ilike(products.name, `%${term}%`), ilike(categories.name, `%${term}%`)) : undefined)
    .orderBy(asc(categories.sortOrder), asc(products.name));

  return rows.map((r) => ({ ...r, lastPrice: toNumber(r.lastPrice) }));
}

export async function getProduct(id: number) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

/** Los productos que más usás, para los accesos rápidos del formulario de gasto. */
export async function getFrequentProducts(limit = 8): Promise<ProductRow[]> {
  const usage = db
    .select({
      productId: expenses.productId,
      uses: sql<number>`count(*)`.as("uses"),
      lastUsed: sql<string>`max(${expenses.spentOn})`.as("last_used"),
    })
    .from(expenses)
    .where(sql`${expenses.productId} is not null`)
    .groupBy(expenses.productId)
    .as("usage");

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      unit: products.unit,
      lastPrice: products.lastPrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      subcategoryId: products.subcategoryId,
      subcategoryName: subcategories.name,
      isActive: products.isActive,
    })
    .from(usage)
    .innerJoin(products, eq(products.id, usage.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(subcategories, eq(subcategories.id, products.subcategoryId))
    .where(eq(products.isActive, true))
    .orderBy(desc(usage.uses), desc(usage.lastUsed))
    .limit(limit);

  return rows.map((r) => ({ ...r, lastPrice: toNumber(r.lastPrice) }));
}

export type SubcategoryTotals = {
  /** null = gastos de esa categoría que quedaron sin subcategoría */
  subcategoryId: number | null;
  name: string;
  planned: number;
  spent: number;
};

export type CategoryTotals = {
  categoryId: number;
  name: string;
  icon: string;
  color: string;
  planned: number;
  spent: number;
  bySubcategory: SubcategoryTotals[];
};

export type MonthSummary = {
  period: string;
  planned: number;
  spent: number;
  byCategory: CategoryTotals[];
};

/** Clave del mapa de totales: 0 representa "sin subcategoría". */
function subKey(categoryId: number, subcategoryId: number | null): string {
  return `${categoryId}:${subcategoryId ?? 0}`;
}

export async function getMonthSummary(period: string): Promise<MonthSummary> {
  const [cats, spentRows, plannedRows] = await Promise.all([
    getCategories(),
    db
      .select({
        categoryId: expenses.categoryId,
        subcategoryId: expenses.subcategoryId,
        total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.period, period))
      .groupBy(expenses.categoryId, expenses.subcategoryId),
    db
      .select({
        categoryId: planItems.categoryId,
        subcategoryId: planItems.subcategoryId,
        total: sql<string>`coalesce(sum(${planItems.amount}), 0)`,
      })
      .from(planItems)
      .where(eq(planItems.period, period))
      .groupBy(planItems.categoryId, planItems.subcategoryId),
  ]);

  const spentBySub = new Map(
    spentRows.map((r) => [subKey(r.categoryId, r.subcategoryId), toNumber(r.total)]),
  );
  const plannedBySub = new Map(
    plannedRows.map((r) => [subKey(r.categoryId, r.subcategoryId), toNumber(r.total)]),
  );

  const byCategory = cats
    .map((category) => {
      // Las subcategorías definidas, más una fila extra para lo que quedó suelto.
      const buckets: SubcategoryTotals[] = category.subcategories.map((sub) => ({
        subcategoryId: sub.id,
        name: sub.name,
        planned: plannedBySub.get(subKey(category.id, sub.id)) ?? 0,
        spent: spentBySub.get(subKey(category.id, sub.id)) ?? 0,
      }));

      buckets.push({
        subcategoryId: null,
        name: "Sin subcategoría",
        planned: plannedBySub.get(subKey(category.id, null)) ?? 0,
        spent: spentBySub.get(subKey(category.id, null)) ?? 0,
      });

      const bySubcategory = buckets
        .filter((b) => b.planned > 0 || b.spent > 0)
        .sort((a, b) => b.spent - a.spent || b.planned - a.planned);

      return {
        categoryId: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        planned: bySubcategory.reduce((sum, b) => sum + b.planned, 0),
        spent: bySubcategory.reduce((sum, b) => sum + b.spent, 0),
        bySubcategory,
      };
    })
    .filter((c) => c.planned > 0 || c.spent > 0);

  return {
    period,
    planned: byCategory.reduce((sum, c) => sum + c.planned, 0),
    spent: byCategory.reduce((sum, c) => sum + c.spent, 0),
    byCategory,
  };
}

export type ExpenseRow = {
  id: number;
  spentOn: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  note: string | null;
  productId: number | null;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  subcategoryId: number | null;
  subcategoryName: string | null;
};

export async function getExpenses(
  period: string,
  opts: { categoryId?: number; subcategoryId?: number | "none" } = {},
): Promise<ExpenseRow[]> {
  const rows = await db
    .select({
      id: expenses.id,
      spentOn: expenses.spentOn,
      description: expenses.description,
      quantity: expenses.quantity,
      unit: expenses.unit,
      unitPrice: expenses.unitPrice,
      amount: expenses.amount,
      note: expenses.note,
      productId: expenses.productId,
      categoryId: expenses.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      subcategoryId: expenses.subcategoryId,
      subcategoryName: subcategories.name,
    })
    .from(expenses)
    .innerJoin(categories, eq(categories.id, expenses.categoryId))
    .leftJoin(subcategories, eq(subcategories.id, expenses.subcategoryId))
    .where(
      and(
        eq(expenses.period, period),
        opts.categoryId ? eq(expenses.categoryId, opts.categoryId) : undefined,
        opts.subcategoryId === "none"
          ? isNull(expenses.subcategoryId)
          : opts.subcategoryId
            ? eq(expenses.subcategoryId, opts.subcategoryId)
            : undefined,
      ),
    )
    .orderBy(desc(expenses.spentOn), desc(expenses.id));

  return rows.map((r) => ({
    ...r,
    quantity: toNumber(r.quantity),
    unitPrice: toNumber(r.unitPrice),
    amount: toNumber(r.amount),
  }));
}

export async function getExpense(id: number) {
  const [row] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return row ?? null;
}

export type PlanItemRow = {
  id: number;
  productId: number | null;
  label: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  note: string | null;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  subcategoryId: number | null;
  subcategoryName: string | null;
};

export async function getPlanItems(period: string): Promise<PlanItemRow[]> {
  const rows = await db
    .select({
      id: planItems.id,
      productId: planItems.productId,
      label: planItems.label,
      productName: products.name,
      unit: products.unit,
      quantity: planItems.quantity,
      unitPrice: planItems.unitPrice,
      amount: planItems.amount,
      note: planItems.note,
      categoryId: planItems.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      subcategoryId: planItems.subcategoryId,
      subcategoryName: subcategories.name,
      categorySort: categories.sortOrder,
    })
    .from(planItems)
    .innerJoin(categories, eq(categories.id, planItems.categoryId))
    .leftJoin(products, eq(products.id, planItems.productId))
    .leftJoin(subcategories, eq(subcategories.id, planItems.subcategoryId))
    .where(eq(planItems.period, period))
    .orderBy(asc(categories.sortOrder), asc(planItems.id));

  return rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    label: r.productName ?? r.label ?? "Sin nombre",
    unit: r.unit ?? "unidad",
    quantity: toNumber(r.quantity),
    unitPrice: toNumber(r.unitPrice),
    amount: toNumber(r.amount),
    note: r.note,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    categoryIcon: r.categoryIcon,
    categoryColor: r.categoryColor,
    subcategoryId: r.subcategoryId,
    subcategoryName: r.subcategoryName,
  }));
}

export async function getPlanItem(id: number) {
  const [row] = await db
    .select({
      item: planItems,
      productName: products.name,
    })
    .from(planItems)
    .leftJoin(products, eq(products.id, planItems.productId))
    .where(eq(planItems.id, id))
    .limit(1);
  return row ?? null;
}

export type ComparisonRow = {
  key: string;
  label: string;
  categoryName: string;
  categoryIcon: string;
  plannedQty: number;
  plannedAmount: number;
  spentQty: number;
  spentAmount: number;
  unit: string;
};

/**
 * Cruza el plan del mes con los gastos reales, producto por producto.
 * Lo que se compró sin estar planificado aparece igual, con plan en 0.
 */
export async function getComparison(period: string): Promise<ComparisonRow[]> {
  const [plan, spent] = await Promise.all([
    getPlanItems(period),
    getExpenses(period),
  ]);

  const rows = new Map<string, ComparisonRow>();
  const keyFor = (productId: number | null, label: string) =>
    productId !== null ? `p${productId}` : `t${label.trim().toLowerCase()}`;

  for (const item of plan) {
    const key = keyFor(item.productId, item.label);
    rows.set(key, {
      key,
      label: item.label,
      categoryName: item.categoryName,
      categoryIcon: item.categoryIcon,
      plannedQty: item.quantity,
      plannedAmount: item.amount,
      spentQty: 0,
      spentAmount: 0,
      unit: item.unit,
    });
  }

  for (const exp of spent) {
    const key = keyFor(exp.productId, exp.description);
    const existing = rows.get(key);
    if (existing) {
      existing.spentQty += exp.quantity;
      existing.spentAmount += exp.amount;
    } else {
      rows.set(key, {
        key,
        label: exp.description,
        categoryName: exp.categoryName,
        categoryIcon: exp.categoryIcon,
        plannedQty: 0,
        plannedAmount: 0,
        spentQty: exp.quantity,
        spentAmount: exp.amount,
        unit: exp.unit,
      });
    }
  }

  return [...rows.values()].sort((a, b) => {
    const diffA = a.spentAmount - a.plannedAmount;
    const diffB = b.spentAmount - b.plannedAmount;
    return diffB - diffA;
  });
}

/** Meses que tienen algún movimiento, del más reciente al más viejo. */
export async function getActivePeriods(): Promise<string[]> {
  const rows = await db.execute<{ period: string }>(sql`
    select period from expenses
    union
    select period from plan_items
    order by period desc
  `);
  return rows.rows.map((r) => r.period);
}

/** Gasto por día del mes, para el mini gráfico del dashboard. */
export async function getDailySpend(period: string): Promise<{ day: number; amount: number }[]> {
  const { start, end } = periodRange(period);
  const rows = await db
    .select({
      spentOn: expenses.spentOn,
      total: sql<string>`sum(${expenses.amount})`,
    })
    .from(expenses)
    .where(and(gte(expenses.spentOn, start), lte(expenses.spentOn, end)))
    .groupBy(expenses.spentOn)
    .orderBy(asc(expenses.spentOn));

  return rows.map((r) => ({ day: Number(r.spentOn.slice(8, 10)), amount: toNumber(r.total) }));
}

/* ── Ingresos ────────────────────────────────────────────────────────────── */

export type IncomeCategoryRow = {
  id: number;
  name: string;
  icon: string;
  color: string;
};

export async function getIncomeCategories(): Promise<IncomeCategoryRow[]> {
  return db
    .select({
      id: incomeCategories.id,
      name: incomeCategories.name,
      icon: incomeCategories.icon,
      color: incomeCategories.color,
    })
    .from(incomeCategories)
    .orderBy(asc(incomeCategories.sortOrder), asc(incomeCategories.name));
}

export type IncomeRow = {
  id: number;
  receivedOn: string;
  description: string;
  amount: number;
  note: string | null;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
};

export async function getIncomes(period: string): Promise<IncomeRow[]> {
  const rows = await db
    .select({
      id: incomes.id,
      receivedOn: incomes.receivedOn,
      description: incomes.description,
      amount: incomes.amount,
      note: incomes.note,
      categoryId: incomes.categoryId,
      categoryName: incomeCategories.name,
      categoryIcon: incomeCategories.icon,
      categoryColor: incomeCategories.color,
    })
    .from(incomes)
    .innerJoin(incomeCategories, eq(incomeCategories.id, incomes.categoryId))
    .where(eq(incomes.period, period))
    .orderBy(desc(incomes.receivedOn), desc(incomes.id));

  return rows.map((r) => ({ ...r, amount: toNumber(r.amount) }));
}

export async function getIncome(id: number) {
  const [row] = await db.select().from(incomes).where(eq(incomes.id, id)).limit(1);
  return row ?? null;
}

export type IncomeSummary = {
  total: number;
  byCategory: { categoryId: number; name: string; icon: string; color: string; total: number }[];
};

export async function getIncomeSummary(period: string): Promise<IncomeSummary> {
  const rows = await db
    .select({
      categoryId: incomes.categoryId,
      name: incomeCategories.name,
      icon: incomeCategories.icon,
      color: incomeCategories.color,
      total: sql<string>`coalesce(sum(${incomes.amount}), 0)`,
    })
    .from(incomes)
    .innerJoin(incomeCategories, eq(incomeCategories.id, incomes.categoryId))
    .where(eq(incomes.period, period))
    .groupBy(incomes.categoryId, incomeCategories.name, incomeCategories.icon, incomeCategories.color)
    .orderBy(desc(sql`sum(${incomes.amount})`));

  const byCategory = rows.map((r) => ({ ...r, total: toNumber(r.total) }));
  return { total: byCategory.reduce((sum, c) => sum + c.total, 0), byCategory };
}

/** Cuántos ingresos tiene cada categoría, para saber si se puede borrar. */
export async function getIncomeCategoryUsage(): Promise<Map<number, number>> {
  const rows = await db
    .select({ categoryId: incomes.categoryId, uses: sql<number>`count(*)::int` })
    .from(incomes)
    .groupBy(incomes.categoryId);
  return new Map(rows.map((r) => [r.categoryId, r.uses]));
}
