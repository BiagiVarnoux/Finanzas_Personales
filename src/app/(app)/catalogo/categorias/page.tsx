import Link from "next/link";
import { deleteCategory, deleteSubcategory } from "@/app/actions/catalog";
import { NewCategoryForm, NewSubcategoryForm } from "@/components/category-forms";
import { Card, PageHeader } from "@/components/ui";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <PageHeader
        title="Categorías"
        action={
          <Link href="/catalogo" className="text-sm font-medium text-muted">
            Volver
          </Link>
        }
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {categories.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-lg leading-none">{category.icon}</span>
              <h2 className="min-w-0 flex-1 truncate font-medium">{category.name}</h2>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={category.id} />
                <button
                  type="submit"
                  className="rounded-lg px-2 py-1 text-xs text-muted active:bg-surface-2"
                >
                  Eliminar
                </button>
              </form>
            </div>

            {category.subcategories.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {category.subcategories.map((sub) => (
                  <li key={sub.id}>
                    <form action={deleteSubcategory}>
                      <input type="hidden" name="id" value={sub.id} />
                      <button
                        type="submit"
                        title="Quitar subcategoría"
                        className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted active:opacity-70"
                      >
                        {sub.name} <span className="ml-0.5 opacity-60">×</span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <NewSubcategoryForm categoryId={category.id} />
          </Card>
        ))}

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Nueva categoría</h2>
          <NewCategoryForm />
        </Card>

        <p className="px-1 text-xs text-muted">
          Una categoría con gastos o productos asociados no se puede eliminar. Movelos primero a
          otra categoría.
        </p>
      </main>
    </>
  );
}
