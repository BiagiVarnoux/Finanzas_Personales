import Link from "next/link";
import { NewCategoryForm } from "@/components/category-forms";
import { ChevronRight } from "@/components/icons";
import { Card, PageHeader } from "@/components/ui";
import { getCategories, getCategoryUsage } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ borrada?: string }>;
}) {
  const { borrada } = await searchParams;
  const [categories, usage] = await Promise.all([getCategories(), getCategoryUsage()]);

  return (
    <>
      <PageHeader
        title="Categorías"
        action={
          <Link href="/ajustes" className="text-sm font-medium text-muted">
            Volver
          </Link>
        }
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {borrada === "1" && (
          <Card className="px-4 py-3">
            <p className="text-sm text-accent">Categoría eliminada.</p>
          </Card>
        )}

        <Card>
          <ul className="divide-y divide-border">
            {categories.map((category) => {
              const used = usage.get(category.id)?.total ?? 0;
              return (
                <li key={category.id}>
                  <Link
                    href={`/catalogo/categorias/${category.id}`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-surface-2"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-lg leading-none">{category.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{category.name}</p>
                      <p className="truncate text-xs text-muted">
                        {category.subcategories.length === 0
                          ? "sin subcategorías"
                          : `${category.subcategories.length} ${
                              category.subcategories.length === 1
                                ? "subcategoría"
                                : "subcategorías"
                            }`}
                        {used > 0 && ` · ${used} en uso`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Nueva categoría</h2>
          <NewCategoryForm />
        </Card>

        <p className="px-1 text-xs text-muted">
          Tocá una categoría para cambiarle el nombre, el emoji o el color, y para administrar sus
          subcategorías.
        </p>
      </main>
    </>
  );
}
