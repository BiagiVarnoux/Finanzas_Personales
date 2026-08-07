import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

/** Categorías de gasto: Alimentación, Servicios básicos, Higiene, Pasajes... */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  /** Emoji que se muestra en la lista y el dashboard */
  icon: text("icon").notNull().default("📦"),
  /** Color en hex, para las barras de progreso */
  color: text("color").notNull().default("#64748b"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Subcategorías: Carne, Verduras, Abarrotes, Luz, Agua... */
export const subcategories = pgTable(
  "subcategories",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("subcategories_category_name_unique").on(t.categoryId, t.name)],
);

/**
 * Catálogo de productos: "Aceite · 1 litro · 19.50 Bs".
 * lastPrice se actualiza solo cada vez que registrás una compra de ese producto.
 */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    /** Unidad de medida: litro, kg, unidad, paquete, mes... */
    unit: text("unit").notNull().default("unidad"),
    lastPrice: numeric("last_price", { precision: 12, scale: 2 }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    subcategoryId: integer("subcategory_id").references(() => subcategories.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("products_name_unit_unique").on(t.name, t.unit),
    index("products_category_idx").on(t.categoryId),
  ],
);

/**
 * Plan mensual: lo que pensás gastar en el mes.
 * period es 'YYYY-MM' (ej. '2026-08').
 */
export const planItems = pgTable(
  "plan_items",
  {
    id: serial("id").primaryKey(),
    period: varchar("period", { length: 7 }).notNull(),
    productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
    /** Nombre libre, para planificar algo que no está en el catálogo */
    label: text("label"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    subcategoryId: integer("subcategory_id").references(() => subcategories.id, {
      onDelete: "set null",
    }),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
    /** quantity * unitPrice, guardado para no recalcular en cada consulta */
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("plan_items_period_idx").on(t.period)],
);

/** Gastos reales */
export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    spentOn: date("spent_on").notNull(),
    /** 'YYYY-MM' derivado de spentOn, para agrupar rápido por mes */
    period: varchar("period", { length: 7 }).notNull(),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Descripción: el nombre del producto o un texto libre */
    description: text("description").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    subcategoryId: integer("subcategory_id").references(() => subcategories.id, {
      onDelete: "set null",
    }),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull().default("1"),
    unit: text("unit").notNull().default("unidad"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("expenses_period_idx").on(t.period),
    index("expenses_spent_on_idx").on(t.spentOn),
    index("expenses_category_idx").on(t.categoryId),
  ],
);

export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type PlanItem = typeof planItems.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
