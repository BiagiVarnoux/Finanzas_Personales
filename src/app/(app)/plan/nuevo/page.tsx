import Link from "next/link";
import { PlanItemForm } from "@/components/plan-item-form";
import { PageHeader } from "@/components/ui";
import { currentPeriod, isValidPeriod, periodLabel } from "@/lib/period";
import { getCategories, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewPlanItemPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const period = isValidPeriod(mes) ? mes : currentPeriod();

  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <PageHeader
        title={`Plan · ${periodLabel(period)}`}
        action={
          <Link href={`/plan?mes=${period}`} className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <PlanItemForm
          period={period}
          products={products}
          categories={categories}
          initial={{
            productId: null,
            label: "",
            categoryId: null,
            subcategoryId: null,
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            note: "",
          }}
        />
      </main>
    </>
  );
}
