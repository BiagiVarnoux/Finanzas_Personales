import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { bs } from "@/lib/format";
import { getProducts } from "@/lib/queries";
import type { ProductRow } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archivados?: string }>;
}) {
  const { q, archivados } = await searchParams;
  const showArchived = archivados === "1";

  const all = await getProducts(q);
  const products = all.filter((p) => p.isActive !== showArchived);

  const byCategory = new Map<string, { icon: string; items: ProductRow[] }>();
  for (const product of products) {
    const group = byCategory.get(product.categoryName) ?? {
      icon: product.categoryIcon,
      items: [],
    };
    group.items.push(product);
    byCategory.set(product.categoryName, group);
  }

  return (
    <>
      <PageHeader
        title={showArchived ? "Archivados" : "Catálogo"}
        action={
          <Link
            href="/catalogo/nuevo"
            className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-white active:opacity-80"
          >
            Nuevo
          </Link>
        }
      >
        <form action="/catalogo" method="get" className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar producto…"
            aria-label="Buscar producto"
            className="w-full rounded-xl border border-border bg-surface py-2.5 pr-3 pl-9 text-sm outline-none focus:border-accent"
          />
          {showArchived && <input type="hidden" name="archivados" value="1" />}
        </form>
      </PageHeader>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-muted">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </span>
          <div className="flex gap-4">
            <Link href="/catalogo/categorias" className="font-medium text-accent">
              Categorías
            </Link>
            <Link
              href={showArchived ? "/catalogo" : "/catalogo?archivados=1"}
              className="font-medium text-muted"
            >
              {showArchived ? "Ver activos" : "Ver archivados"}
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
          <Card>
            <EmptyState
              emoji="🏷️"
              title={q ? "Sin resultados" : "Catálogo vacío"}
              description={
                q
                  ? `No encontramos nada con "${q}".`
                  : "Agregá los productos que comprás seguido, con su medida y precio."
              }
              actionLabel="Agregar producto"
              actionHref="/catalogo/nuevo"
            />
          </Card>
        ) : (
          [...byCategory.entries()].map(([categoryName, group]) => (
            <div key={categoryName}>
              <h2 className="mb-1.5 px-1 text-xs font-medium text-muted">
                {group.icon} {categoryName}
              </h2>
              <Card>
                <ul className="divide-y divide-border">
                  {group.items.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/catalogo/${product.id}`}
                        className="flex items-center gap-3 px-4 py-3 active:bg-surface-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{product.name}</p>
                          <p className="truncate text-xs text-muted">
                            por {product.unit}
                            {product.subcategoryName && ` · ${product.subcategoryName}`}
                          </p>
                        </div>
                        <span className="tabular text-sm font-semibold">
                          {product.lastPrice > 0 ? bs(product.lastPrice) : "—"}
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
