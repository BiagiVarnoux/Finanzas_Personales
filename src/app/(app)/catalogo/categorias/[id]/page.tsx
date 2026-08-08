import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCategory, deleteSubcategory } from "@/app/actions/catalog";
import { CategoryEditForm, SubcategoryRenameForm } from "@/components/category-edit-form";
import { NewSubcategoryForm } from "@/components/category-forms";
import { TrashIcon } from "@/components/icons";
import { Card, PageHeader } from "@/components/ui";
import { getCategories, getCategory, getCategoryUsage, getSubcategoryUsage } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) notFound();

  const [category, all, usage, subUsage] = await Promise.all([
    getCategory(categoryId),
    getCategories(),
    getCategoryUsage(),
    getSubcategoryUsage(),
  ]);
  if (!category) notFound();

  const subcategories = all.find((c) => c.id === categoryId)?.subcategories ?? [];
  const used = usage.get(categoryId) ?? { products: 0, expenses: 0, planItems: 0, total: 0 };

  const partes = [
    used.expenses > 0 && `${used.expenses} ${used.expenses === 1 ? "gasto" : "gastos"}`,
    used.products > 0 && `${used.products} ${used.products === 1 ? "producto" : "productos"}`,
    used.planItems > 0 && `${used.planItems} en el plan`,
  ].filter(Boolean) as string[];

  return (
    <>
      <PageHeader
        title="Editar categoría"
        action={
          <Link href="/catalogo/categorias" className="text-sm font-medium text-muted">
            Volver
          </Link>
        }
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {error === "en-uso" && (
          <Card className="border-danger/40 p-4">
            <p className="text-sm font-medium text-danger">No se pudo eliminar</p>
            <p className="mt-1 text-xs text-muted">
              Todavía hay {partes.join(" y ")} usando esta categoría. Movelos a otra y volvé a
              intentar.
            </p>
          </Card>
        )}

        <Card className="p-4">
          <CategoryEditForm
            initial={{
              id: category.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
            }}
          />
        </Card>

        <Card className="p-4">
          <h2 className="mb-1 text-sm font-semibold">Subcategorías</h2>
          <p className="mb-3 text-xs text-muted">
            Tocá el nombre para cambiarlo. Al eliminar una, los movimientos que la usaban no se
            borran: quedan sin subcategoría.
          </p>

          {subcategories.length === 0 ? (
            <p className="py-2 text-sm text-muted">Todavía no hay ninguna.</p>
          ) : (
            <ul className="divide-y divide-border">
              {subcategories.map((sub) => {
                const n = subUsage.get(sub.id) ?? 0;
                return (
                  <li key={sub.id} className="flex items-center gap-2 py-1">
                    <SubcategoryRenameForm id={sub.id} categoryId={categoryId} name={sub.name} />
                    {n > 0 && (
                      <span className="tabular shrink-0 text-[11px] text-muted">{n} en uso</span>
                    )}
                    <form action={deleteSubcategory} className="shrink-0">
                      <input type="hidden" name="id" value={sub.id} />
                      <input type="hidden" name="categoryId" value={categoryId} />
                      <button
                        type="submit"
                        aria-label={`Eliminar ${sub.name}`}
                        className="rounded-lg p-2 text-muted active:bg-surface-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-2 border-t border-border pt-2">
            <NewSubcategoryForm categoryId={categoryId} />
          </div>
        </Card>

        {used.total === 0 ? (
          <form action={deleteCategory}>
            <input type="hidden" name="id" value={category.id} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium text-danger active:bg-surface-2"
            >
              <TrashIcon className="h-4 w-4" />
              Eliminar categoría
            </button>
          </form>
        ) : (
          <Card className="p-4">
            <p className="text-sm font-medium">No se puede eliminar todavía</p>
            <p className="mt-1 text-xs text-muted">
              Hay {partes.join(" y ")} usando &ldquo;{category.name}&rdquo;. Se borra recién cuando
              no quede nada apuntándole, así ningún gasto viejo se queda sin categoría.
            </p>
          </Card>
        )}
      </main>
    </>
  );
}
