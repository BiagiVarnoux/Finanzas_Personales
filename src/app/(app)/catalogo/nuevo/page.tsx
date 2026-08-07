import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { PageHeader } from "@/components/ui";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <>
      <PageHeader
        title="Nuevo producto"
        action={
          <Link href="/catalogo" className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <ProductForm
          categories={categories}
          initial={{
            name: "",
            unit: "unidad",
            lastPrice: 0,
            categoryId: null,
            subcategoryId: null,
          }}
        />
      </main>
    </>
  );
}
