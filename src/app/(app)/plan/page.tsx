import Link from "next/link";
import { copyPreviousPlan, syncPlanPrices } from "@/app/actions/plan";
import { MonthSwitcher } from "@/components/month-switcher";
import { Card, Chip, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { bs, qty as fmtQty, pct } from "@/lib/format";
import { currentPeriod, isValidPeriod, periodLabel, shiftPeriod } from "@/lib/period";
import { getComparison, getMonthSummary, getPlanItems } from "@/lib/queries";
import type { PlanItemRow } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const period = isValidPeriod(mes) ? mes : currentPeriod();

  const [items, summary, comparison] = await Promise.all([
    getPlanItems(period),
    getMonthSummary(period),
    getComparison(period),
  ]);

  const spentByKey = new Map(comparison.map((row) => [row.key, row]));
  const unplanned = comparison.filter((row) => row.plannedAmount === 0 && row.spentAmount > 0);

  // Agrupado por categoría, respetando el orden que ya trae getPlanItems.
  const byCategory = new Map<number, { name: string; icon: string; color: string; items: PlanItemRow[] }>();
  for (const item of items) {
    const group = byCategory.get(item.categoryId) ?? {
      name: item.categoryName,
      icon: item.categoryIcon,
      color: item.categoryColor,
      items: [],
    };
    group.items.push(item);
    byCategory.set(item.categoryId, group);
  }

  const difference = summary.planned - summary.spent;

  return (
    <>
      <PageHeader
        title="Plan del mes"
        action={
          <Link
            href={`/plan/nuevo?mes=${period}`}
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
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm text-muted">Planificado</p>
              <p className="tabular text-3xl font-semibold tracking-tight">{bs(summary.planned)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">Gastado</p>
              <p className="tabular text-xl font-semibold">{bs(summary.spent)}</p>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar spent={summary.spent} planned={summary.planned} color="var(--accent)" />
          </div>
          <p className="mt-2 text-sm">
            {summary.planned === 0 ? (
              <span className="text-muted">Todavía no hay nada planificado para este mes.</span>
            ) : difference >= 0 ? (
              <span className="text-accent">
                Te quedan <strong>{bs(difference)}</strong> ({pct(summary.spent, summary.planned)}%
                usado)
              </span>
            ) : (
              <span className="text-danger">
                Te pasaste por <strong>{bs(-difference)}</strong>
              </span>
            )}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <form action={copyPreviousPlan}>
            <input type="hidden" name="period" value={period} />
            <button
              type="submit"
              className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm font-medium active:bg-surface-2"
            >
              Copiar {periodLabel(shiftPeriod(period, -1)).split(" ")[0].toLowerCase()}
            </button>
          </form>
          <form action={syncPlanPrices}>
            <input type="hidden" name="period" value={period} />
            <button
              type="submit"
              className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm font-medium active:bg-surface-2"
            >
              Actualizar precios
            </button>
          </form>
        </div>

        {items.length === 0 ? (
          <Card>
            <EmptyState
              emoji="🎯"
              title="Plan vacío"
              description="Cargá lo que pensás comprar este mes: 4 litros de aceite, 3 kg de carne, la luz… y la app lo compara con lo que gastes."
              actionLabel="Agregar al plan"
              actionHref={`/plan/nuevo?mes=${period}`}
            />
          </Card>
        ) : (
          [...byCategory.entries()].map(([categoryId, group]) => {
            const planned = group.items.reduce((sum, i) => sum + i.amount, 0);
            const spent = group.items.reduce(
              (sum, i) => sum + (spentByKey.get(keyOf(i))?.spentAmount ?? 0),
              0,
            );
            return (
              <div key={categoryId}>
                <div className="mb-1.5 flex items-baseline justify-between px-1">
                  <h2 className="text-xs font-medium text-muted">
                    {group.icon} {group.name}
                  </h2>
                  <span className="tabular text-xs text-muted">
                    {bs(spent)} / {bs(planned)}
                  </span>
                </div>
                <Card>
                  <ul className="divide-y divide-border">
                    {group.items.map((item) => {
                      const actual = spentByKey.get(keyOf(item));
                      const spentAmount = actual?.spentAmount ?? 0;
                      const over = spentAmount > item.amount;
                      return (
                        <li key={item.id}>
                          <Link
                            href={`/plan/${item.id}?mes=${period}`}
                            className="block px-4 py-3 active:bg-surface-2"
                          >
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {item.label}
                              </span>
                              <span className="tabular text-sm font-semibold">
                                {bs(item.amount)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                              <span className="tabular">
                                {fmtQty(item.quantity)} {item.unit} × {bs(item.unitPrice)}
                              </span>
                              {spentAmount === 0 ? (
                                <Chip>sin comprar</Chip>
                              ) : over ? (
                                <Chip tone="bad">gastado {bs(spentAmount)}</Chip>
                              ) : (
                                <Chip tone="good">gastado {bs(spentAmount)}</Chip>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </div>
            );
          })
        )}

        {unplanned.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between px-1">
              <h2 className="text-xs font-medium text-muted">Comprado fuera del plan</h2>
              <span className="tabular text-xs text-danger">
                {bs(unplanned.reduce((sum, r) => sum + r.spentAmount, 0))}
              </span>
            </div>
            <Card>
              <ul className="divide-y divide-border">
                {unplanned.map((row) => (
                  <li key={row.key} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-lg leading-none">{row.categoryIcon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.label}</p>
                      <p className="text-xs text-muted">{row.categoryName}</p>
                    </div>
                    <span className="tabular text-sm font-semibold">{bs(row.spentAmount)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}

function keyOf(item: PlanItemRow): string {
  return item.productId !== null ? `p${item.productId}` : `t${item.label.trim().toLowerCase()}`;
}
