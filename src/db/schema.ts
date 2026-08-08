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

/**
 * Cada persona con su propia cuenta. Todo lo demás cuelga de acá: no hay una
 * sola tabla de datos que no tenga user_id, y ninguna consulta corre sin
 * filtrar por el usuario de la sesión.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** Siempre en minúsculas, para que no existan dos cuentas con el mismo correo */
  email: text("email").notNull().unique(),
  /** scrypt: nunca se guarda la contraseña en claro */
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Categorías de gasto: Alimentación, Servicios básicos, Higiene, Pasajes... */
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Emoji que se muestra en la lista y el dashboard */
    icon: text("icon").notNull().default("📦"),
    /** Color en hex, para las barras de progreso */
    color: text("color").notNull().default("#64748b"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // El nombre es único por usuario, no en toda la base.
    unique("categories_user_name_unique").on(t.userId, t.name),
    index("categories_user_idx").on(t.userId),
  ],
);

/** Subcategorías: Carne, Verduras, Abarrotes, Luz, Agua... */
export const subcategories = pgTable(
  "subcategories",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("subcategories_category_name_unique").on(t.categoryId, t.name),
    index("subcategories_user_idx").on(t.userId),
  ],
);

/**
 * Catálogo de productos: "Aceite · 1 litro · 19.50 Bs".
 * lastPrice se actualiza solo cada vez que registrás una compra de ese producto.
 */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    unique("products_user_name_unit_unique").on(t.userId, t.name, t.unit),
    index("products_category_idx").on(t.categoryId),
    index("products_user_idx").on(t.userId),
  ],
);

/**
 * Dónde está la plata: Efectivo, Banco, QR, billetera…
 * openingBalance es lo que había en la cuenta antes de empezar a usar la app;
 * el saldo actual se calcula sumándole los ingresos y restándole los gastos.
 */
export const accounts = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("💵"),
    color: text("color").notNull().default("#10794f"),
    openingBalance: numeric("opening_balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("accounts_user_name_unique").on(t.userId, t.name),
    index("accounts_user_idx").on(t.userId),
  ],
);

/**
 * Los ingresos tienen su propia lista de categorías (Sueldo, Negocio, Ventas…),
 * separada de las de gasto para que los desplegables no se mezclen.
 */
export const incomeCategories = pgTable(
  "income_categories",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("💰"),
    color: text("color").notNull().default("#10794f"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("income_categories_user_name_unique").on(t.userId, t.name),
    index("income_categories_user_idx").on(t.userId),
  ],
);

export const incomes = pgTable(
  "incomes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receivedOn: date("received_on").notNull(),
    /** 'YYYY-MM' derivado de receivedOn */
    period: varchar("period", { length: 7 }).notNull(),
    description: text("description").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => incomeCategories.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    /** A qué cuenta entró la plata. */
    accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("incomes_user_period_idx").on(t.userId, t.period),
    index("incomes_received_on_idx").on(t.receivedOn),
    index("incomes_account_idx").on(t.accountId),
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
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
  (t) => [index("plan_items_user_period_idx").on(t.userId, t.period)],
);

/** Gastos reales */
export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    /** De qué cuenta salió la plata. */
    accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("expenses_user_period_idx").on(t.userId, t.period),
    index("expenses_spent_on_idx").on(t.spentOn),
    index("expenses_category_idx").on(t.categoryId),
    index("expenses_account_idx").on(t.accountId),
  ],
);

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type PlanItem = typeof planItems.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type IncomeCategory = typeof incomeCategories.$inferSelect;
export type Income = typeof incomes.$inferSelect;
export type Account = typeof accounts.$inferSelect;
