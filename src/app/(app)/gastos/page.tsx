import Link from "next/link";
import { MonthSwitcher } from "@/components/month-switcher";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { bs, qty as fmtQty } from "@/lib/format";
import { currentPeriod, dayLabel, isValidPeriod } from "@/lib/period";
import { getCategories, getExpenses } from "@/lib/queries";
import type { ExpenseRow } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Grouping = "dia" | "categoria";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; categoria?: string; subcategoria?: string; agrupar?: string }>;
}) {
  const { mes, categoria, subcategoria, agrupar } = await searchParams;
  const period = isValidPeriod(mes) ? mes : currentPeriod();
  const categoryId = categoria && Number(categoria) > 0 ? Number(categoria) : undefined;
  const grouping: Grouping = agrupar === "categoria" ? "categoria" : "dia";

  // 'sin' filtra los gastos que quedaron sin subcategoría asignada.
  const subcategoryId =
    subcategoria === "sin"
      ? ("none" as const)
      : subcategoria && Number(subcategoria) > 0
        ? Number(subcategoria)
        : undefined;

  const [expenses, categories] = await Promise.all([
    getExpenses(period, { categoryId, subcategoryId }),
    getCategories(),
  ]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const activeCategory = categories.find((c) => c.id === categoryId);

  const groups =
    grouping === "dia" ? groupByDay(expenses) : groupBySubcategory(expenses);

  const base = `/gastos?mes=${period}`;
  const withGrouping = (url: string) =>
    grouping === "categoria" ? `${url}&agrupar=categoria` : url;
  const categoryBase = categoryId ? `${base}&categoria=${categoryId}` : base;

  return (
    <>
      <PageHeader title="Gastos">
        <MonthSwitcher period={period} />

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          <FilterChip href={withGrouping(base)} active={!categoryId} label="Todo" />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              href={withGrouping(`${base}&categoria=${c.id}`)}
              active={categoryId === c.id}
              label={`${c.icon} ${c.name}`}
            />
          ))}
        </div>

        {/* Las subcategorías solo tienen sentido dentro de una categoría. */}
        {activeCategory && activeCategory.subcategories.length > 0 && (
          <div className="no-scrollbar -mb-1 flex gap-2 overflow-x-auto pb-1">
            <FilterChip
              href={withGrouping(categoryBase)}
              active={!subcategoryId}
              label="Todas"
              small
            />
            {activeCategory.subcategories.map((s) => (
              <FilterChip
                key={s.id}
                href={withGrouping(`${categoryBase}&subcategoria=${s.id}`)}
                active={subcategoryId === s.id}
                label={s.name}
                small
              />
            ))}
            <FilterChip
              href={withGrouping(`${categoryBase}&subcategoria=sin`)}
              active={subcategoryId === "none"}
              label="Sin subcategoría"
              small
            />
          </div>
        )}
      </PageHeader>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Card className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="tabular text-xl font-semibold">{bs(total)}</p>
            <p className="text-xs text-muted">
              {expenses.length} {expenses.length === 1 ? "gasto" : "gastos"}
            </p>
          </div>

          <div className="flex overflow-hidden rounded-full bg-surface-2 p-0.5 text-xs">
            <GroupToggle
              href={buildUrl(period, categoria, subcategoria, "dia")}
              active={grouping === "dia"}
              label="Por día"
            />
            <GroupToggle
              href={buildUrl(period, categoria, subcategoria, "categoria")}
              active={grouping === "categoria"}
              label="Por categoría"
            />
          </div>
        </Card>

        {expenses.length === 0 ? (
          <Card>
            <EmptyState
              emoji="🧾"
              title="Nada por acá"
              description="No hay gastos registrados con este filtro."
              actionLabel="Agregar gasto"
              actionHref="/gastos/nuevo"
            />
          </Card>
        ) : (
          groups.map((group) => (
            <div key={group.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 px-1">
                <h2 className="min-w-0 truncate text-xs font-medium text-muted">{group.label}</h2>
                <span className="tabular shrink-0 text-xs text-muted">{bs(group.total)}</span>
              </div>
              <Card>
                <ul className="divide-y divide-border">
                  {group.items.map((expense) => (
                    <li key={expense.id}>
                      <Link
                        href={`/gastos/${expense.id}`}
                        className="flex items-center gap-3 px-4 py-3 active:bg-surface-2"
                      >
                        <span className="text-lg leading-none">{expense.categoryIcon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{expense.description}</p>
                          <p className="truncate text-xs text-muted">
                            {expense.quantity !== 1 && (
                              <>
                                {fmtQty(expense.quantity)} {expense.unit} ·{" "}
                              </>
                            )}
                            {grouping === "dia"
                              ? (expense.subcategoryName ?? expense.categoryName)
                              : dayLabel(expense.spentOn)}
                            {expense.accountName && ` · ${expense.accountIcon} ${expense.accountName}`}
                            {expense.note && ` · ${expense.note}`}
                          </p>
                        </div>
                        <span className="tabular text-sm font-semibold">{bs(expense.amount)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))
        )}
      </main>
    </>
  );
}

type Group = { key: string; label: string; total: number; items: ExpenseRow[] };

function groupByDay(expenses: ExpenseRow[]): Group[] {
  const byDay = new Map<string, ExpenseRow[]>();
  for (const expense of expenses) {
    const list = byDay.get(expense.spentOn) ?? [];
    list.push(expense);
    byDay.set(expense.spentOn, list);
  }
  // getExpenses ya viene ordenado por fecha descendente.
  return [...byDay.entries()].map(([day, items]) => ({
    key: day,
    label: dayLabel(day),
    total: items.reduce((sum, e) => sum + e.amount, 0),
    items,
  }));
}

/** Categoría › subcategoría, de mayor a menor gasto. */
function groupBySubcategory(expenses: ExpenseRow[]): Group[] {
  const groups = new Map<string, Group>();

  for (const expense of expenses) {
    const key = `${expense.categoryId}:${expense.subcategoryId ?? 0}`;
    const group = groups.get(key) ?? {
      key,
      label: `${expense.categoryIcon} ${expense.categoryName} › ${
        expense.subcategoryName ?? "Sin subcategoría"
      }`,
      total: 0,
      items: [],
    };
    group.total += expense.amount;
    group.items.push(expense);
    groups.set(key, group);
  }

  return [...groups.values()].sort((a, b) => b.total - a.total);
}

function buildUrl(
  period: string,
  categoria: string | undefined,
  subcategoria: string | undefined,
  grouping: Grouping,
): string {
  const params = new URLSearchParams({ mes: period });
  if (categoria) params.set("categoria", categoria);
  if (subcategoria) params.set("subcategoria", subcategoria);
  if (grouping === "categoria") params.set("agrupar", "categoria");
  return `/gastos?${params.toString()}`;
}

function FilterChip({
  href,
  active,
  label,
  small = false,
}: {
  href: string;
  active: boolean;
  label: string;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full whitespace-nowrap ${
        small ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } ${active ? "bg-accent text-white" : "border border-border bg-surface text-muted"}`}
    >
      {label}
    </Link>
  );
}

function GroupToggle({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-2.5 py-1 whitespace-nowrap ${
        active ? "bg-surface font-medium text-ink" : "text-muted"
      }`}
    >
      {label}
    </Link>
  );
}
