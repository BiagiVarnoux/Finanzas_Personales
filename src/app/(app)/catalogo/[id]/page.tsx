import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProduct, restoreProduct } from "@/app/actions/catalog";
import { TrashIcon } from "@/components/icons";
import { ProductForm } from "@/components/product-form";
import { PageHeader } from "@/components/ui";
import { toNumber } from "@/lib/format";
import { getCategories, getProduct } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const [product, categories] = await Promise.all([getProduct(productId), getCategories()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title="Editar producto"
        action={
          <Link href="/catalogo" className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-4">
        <ProductForm
          categories={categories}
          initial={{
            id: product.id,
            name: product.name,
            unit: product.unit,
            lastPrice: toNumber(product.lastPrice),
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId,
          }}
        />

        {product.isActive ? (
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium text-danger active:bg-surface-2"
            >
              <TrashIcon className="h-4 w-4" />
              Archivar producto
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              No se borra: los gastos que ya registraste lo siguen usando.
            </p>
          </form>
        ) : (
          <form action={restoreProduct}>
            <input type="hidden" name="id" value={product.id} />
            <button
              type="submit"
              className="w-full rounded-2xl border border-border py-3.5 text-sm font-medium active:bg-surface-2"
            >
              Restaurar producto
            </button>
          </form>
        )}
      </main>
    </>
  );
}
