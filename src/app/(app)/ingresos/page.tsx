import Link from "next/link";
import { MonthSwitcher } from "@/components/month-switcher";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { bs } from "@/lib/format";
import { currentPeriod, dayLabel, isValidPeriod } from "@/lib/period";
import { getIncomeSummary, getIncomes, getMonthSummary } from "@/lib/queries";
import type { IncomeRow } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function IncomesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const period = isValidPeriod(mes) ? mes : currentPeriod();

  const [incomes, income, expenses] = await Promise.all([
    getIncomes(period),
    getIncomeSummary(period),
    getMonthSummary(period),
  ]);

  const balance = income.total - expenses.spent;

  // Agrupados por categoría, de mayor a menor.
  const byCategory = new Map<number, { name: string; icon: string; items: IncomeRow[] }>();
  for (const item of incomes) {
    const group = byCategory.get(item.categoryId) ?? {
      name: item.categoryName,
      icon: item.categoryIcon,
      items: [],
    };
    group.items.push(item);
    byCategory.set(item.categoryId, group);
  }
  const groups = [...byCategory.entries()].sort(
    ([, a], [, b]) =>
      b.items.reduce((s, i) => s + i.amount, 0) - a.items.reduce((s, i) => s + i.amount, 0),
  );

  return (
    <>
      <PageHeader
        title="Ingresos"
        action={
          <Link
            href={`/ingresos/nuevo?mes=${period}`}
            className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-white active:opacity-80"
          >
            Agregar
          </Link>
        }
      >
        <MonthSwitcher period={period} />
      </PageHeader>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Card className="p-5">
          <p className="text-sm text-muted">Ingresos del mes</p>
          <p className="tabular mt-1 text-3xl font-semibold tracking-tight">{bs(income.total)}</p>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Gastado</dt>
              <dd className="tabular font-semibold">{bs(expenses.spent)}</dd>
            </div>
            <div className="text-right">
              <dt className="text-xs text-muted">Queda</dt>
              <dd
                className={`tabular font-semibold ${balance < 0 ? "text-danger" : "text-accent"}`}
              >
                {bs(balance)}
              </dd>
            </div>
          </dl>
        </Card>

        {incomes.length === 0 ? (
          <Card>
            <EmptyState
              emoji="💰"
              title="Sin ingresos este mes"
              description="Cargá tu sueldo, ventas o cualquier otra entrada de plata. La categoría la podés crear en el mismo formulario."
              actionLabel="Agregar ingreso"
              actionHref={`/ingresos/nuevo?mes=${period}`}
            />
          </Card>
        ) : (
          groups.map(([categoryId, group]) => (
            <div key={categoryId}>
              <div className="mb-1.5 flex items-baseline justify-between px-1">
                <h2 className="text-xs font-medium text-muted">
                  {group.icon} {group.name}
                </h2>
                <span className="tabular text-xs text-muted">
                  {bs(group.items.reduce((sum, i) => sum + i.amount, 0))}
                </span>
              </div>
              <Card>
                <ul className="divide-y divide-border">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/ingresos/${item.id}`}
                        className="flex items-center gap-3 px-4 py-3 active:bg-surface-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.description}</p>
                          <p className="truncate text-xs text-muted">
                            {dayLabel(item.receivedOn)}
                            {item.accountName && ` · ${item.accountIcon} ${item.accountName}`}
                            {item.note && ` · ${item.note}`}
                          </p>
                        </div>
                        <span className="tabular text-sm font-semibold text-accent">
                          +{bs(item.amount)}
                        </span>
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
