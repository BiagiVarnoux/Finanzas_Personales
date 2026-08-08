import Link from "next/link";
import { deleteIncomeCategory } from "@/app/actions/incomes";
import { NewIncomeCategoryForm } from "@/components/category-forms";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getIncomeCategories, getIncomeCategoryUsage } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function IncomeCategoriesPage() {
  const [categories, usage] = await Promise.all([
    getIncomeCategories(),
    getIncomeCategoryUsage(),
  ]);

  return (
    <>
      <PageHeader
        title="Categorías de ingreso"
        action={
          <Link href="/ajustes" className="text-sm font-medium text-muted">
            Volver
          </Link>
        }
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {categories.length === 0 ? (
          <Card>
            <EmptyState
              emoji="📈"
              title="Sin categorías de ingreso"
              description="Creá las que uses: Sueldo, Negocio, Ventas, Alquiler… También podés crearlas sobre la marcha al cargar un ingreso."
            />
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {categories.map((category) => {
                const uses = usage.get(category.id) ?? 0;
                return (
                  <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-lg leading-none">{category.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{category.name}</p>
                      <p className="text-xs text-muted">
                        {uses === 0
                          ? "sin ingresos cargados"
                          : `${uses} ${uses === 1 ? "ingreso" : "ingresos"}`}
                      </p>
                    </div>
                    {uses === 0 && (
                      <form action={deleteIncomeCategory}>
                        <input type="hidden" name="id" value={category.id} />
                        <button
                          type="submit"
                          className="rounded-lg px-2 py-1 text-xs text-muted active:bg-surface-2"
                        >
                          Eliminar
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Nueva categoría</h2>
          <NewIncomeCategoryForm />
        </Card>

        <p className="px-1 text-xs text-muted">
          Una categoría con ingresos cargados no se puede eliminar. Movelos primero a otra
          categoría.
        </p>
      </main>
    </>
  );
}
