import Link from "next/link";
import { MonthSwitcher } from "@/components/month-switcher";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { bs, qty as fmtQty } from "@/lib/format";
import { currentPeriod, dayLabel, isValidPeriod } from "@/lib/period";
import { getCategories, getExpenses } from "@/lib/queries";
import type { ExpenseRow } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; categoria?: string }>;
}) {
  const { mes, categoria } = await searchParams;
  const period = isValidPeriod(mes) ? mes : currentPeriod();
  const categoryId = categoria && Number(categoria) > 0 ? Number(categoria) : undefined;

  const [expenses, categories] = await Promise.all([
    getExpenses(period, { categoryId }),
    getCategories(),
  ]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Agrupados por día, del más reciente al más viejo.
  const byDay = new Map<string, ExpenseRow[]>();
  for (const expense of expenses) {
    const list = byDay.get(expense.spentOn) ?? [];
    list.push(expense);
    byDay.set(expense.spentOn, list);
  }

  const base = `/gastos?mes=${period}`;

  return (
    <>
      <PageHeader title="Gastos">
        <MonthSwitcher period={period} />

        <div className="no-scrollbar mt-3 -mb-1 flex gap-2 overflow-x-auto pb-1">
          <FilterChip href={base} active={!categoryId} label="Todo" />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              href={`${base}&categoria=${c.id}`}
              active={categoryId === c.id}
              label={`${c.icon} ${c.name}`}
            />
          ))}
        </div>
      </PageHeader>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Card className="flex items-baseline justify-between px-4 py-3">
          <span className="text-sm text-muted">
            {expenses.length} {expenses.length === 1 ? "gasto" : "gastos"}
          </span>
          <span className="tabular text-xl font-semibold">{bs(total)}</span>
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
          [...byDay.entries()].map(([day, items]) => (
            <div key={day}>
              <div className="mb-1.5 flex items-baseline justify-between px-1">
                <h2 className="text-xs font-medium text-muted">{dayLabel(day)}</h2>
                <span className="tabular text-xs text-muted">
                  {bs(items.reduce((sum, e) => sum + e.amount, 0))}
                </span>
              </div>
              <Card>
                <ul className="divide-y divide-border">
                  {items.map((expense) => (
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
                            {expense.subcategoryName ?? expense.categoryName}
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

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href as never}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
        active ? "bg-accent text-white" : "border border-border bg-surface text-muted"
      }`}
    >
      {label}
    </Link>
  );
}
