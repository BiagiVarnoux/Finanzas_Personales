import Link from "next/link";
import { MonthSwitcher } from "@/components/month-switcher";
import { Card, Chip, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { bs, pct } from "@/lib/format";
import { currentPeriod, dayLabel, isValidPeriod, periodProgress } from "@/lib/period";
import { getExpenses, getMonthSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const period = isValidPeriod(mes) ? mes : currentPeriod();

  const [summary, recent] = await Promise.all([getMonthSummary(period), getExpenses(period)]);

  const remaining = summary.planned - summary.spent;
  const { daysInMonth, daysElapsed } = periodProgress(period);
  const projection = daysElapsed > 0 ? (summary.spent / daysElapsed) * daysInMonth : 0;
  const overPlan = summary.planned > 0 && summary.spent > summary.planned;

  return (
    <>
      <PageHeader title="Resumen">
        <MonthSwitcher period={period} />
      </PageHeader>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Card className="p-5">
          <p className="text-sm text-muted">Gastado este mes</p>
          <p className="tabular mt-1 text-4xl font-semibold tracking-tight">{bs(summary.spent)}</p>

          {summary.planned > 0 ? (
            <>
              <div className="mt-4">
                <ProgressBar
                  spent={summary.spent}
                  planned={summary.planned}
                  color="var(--accent)"
                />
              </div>
              <div className="mt-2 flex items-baseline justify-between text-sm">
                <span className="text-muted">
                  {pct(summary.spent, summary.planned)}% del plan ({bs(summary.planned)})
                </span>
                <span className={overPlan ? "font-medium text-danger" : "font-medium text-accent"}>
                  {overPlan
                    ? `${bs(Math.abs(remaining))} de más`
                    : `${bs(remaining)} disponibles`}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Todavía no armaste el plan de este mes.{" "}
              <Link href={`/plan?mes=${period}`} className="font-medium text-accent">
                Armarlo ahora →
              </Link>
            </p>
          )}
        </Card>

        {daysElapsed > 0 && daysElapsed < daysInMonth && summary.spent > 0 && (
          <Card className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">A este ritmo</p>
              <p className="text-xs text-muted">
                Día {daysElapsed} de {daysInMonth} · {bs(summary.spent / daysElapsed)} por día
              </p>
            </div>
            <div className="text-right">
              <p className="tabular text-lg font-semibold">{bs(projection)}</p>
              <p className="text-xs text-muted">a fin de mes</p>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Por categoría</h2>
            <Link href={`/plan?mes=${period}`} className="text-xs font-medium text-accent">
              Ver plan
            </Link>
          </div>

          {summary.byCategory.length === 0 ? (
            <EmptyState
              emoji="🧾"
              title="Sin movimientos este mes"
              description="Agregá tu primer gasto con el botón + de abajo."
            />
          ) : (
            <ul className="divide-y divide-border">
              {summary.byCategory.map((cat) => {
                const over = cat.planned > 0 && cat.spent > cat.planned;
                return (
                  <li key={cat.categoryId} className="px-4 py-3">
                    <Link
                      href={`/gastos?mes=${period}&categoria=${cat.categoryId}`}
                      className="block"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-lg leading-none">{cat.icon}</span>
                        <span className="flex-1 truncate text-sm font-medium">{cat.name}</span>
                        <span className="tabular text-sm font-semibold">{bs(cat.spent)}</span>
                      </div>
                      <ProgressBar spent={cat.spent} planned={cat.planned} color={cat.color} />
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                        {cat.planned > 0 ? (
                          <>
                            <span>plan {bs(cat.planned)}</span>
                            {over ? (
                              <Chip tone="bad">+{bs(cat.spent - cat.planned)}</Chip>
                            ) : (
                              <Chip tone="good">quedan {bs(cat.planned - cat.spent)}</Chip>
                            )}
                          </>
                        ) : (
                          <Chip tone="warn">fuera del plan</Chip>
                        )}
                      </div>
                    </Link>

                    {cat.bySubcategory.length > 0 && (
                      <ul className="mt-2.5 space-y-0.5 border-l border-border pl-3">
                        {cat.bySubcategory.map((sub) => {
                          const subOver = sub.planned > 0 && sub.spent > sub.planned;
                          return (
                            <li key={sub.subcategoryId ?? "sin"}>
                              <Link
                                href={`/gastos?mes=${period}&categoria=${cat.categoryId}&subcategoria=${
                                  sub.subcategoryId ?? "sin"
                                }`}
                                className="flex items-baseline gap-2 rounded-lg py-1 active:bg-surface-2"
                              >
                                <span className="min-w-0 flex-1 truncate text-xs text-muted">
                                  {sub.name}
                                </span>
                                {sub.planned > 0 && (
                                  <span className="tabular shrink-0 text-[11px] text-muted">
                                    de {bs(sub.planned)}
                                  </span>
                                )}
                                <span
                                  className={`tabular shrink-0 text-xs font-medium ${
                                    subOver ? "text-danger" : ""
                                  }`}
                                >
                                  {bs(sub.spent)}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {recent.length > 0 && (
          <Card>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Últimos gastos</h2>
              <Link href={`/gastos?mes=${period}`} className="text-xs font-medium text-accent">
                Ver todos
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {recent.slice(0, 5).map((exp) => (
                <li key={exp.id}>
                  <Link
                    href={`/gastos/${exp.id}`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-surface-2"
                  >
                    <span className="text-lg leading-none">{exp.categoryIcon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{exp.description}</p>
                      <p className="truncate text-xs text-muted">{dayLabel(exp.spentOn)}</p>
                    </div>
                    <span className="tabular text-sm font-semibold">{bs(exp.amount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </>
  );
}
