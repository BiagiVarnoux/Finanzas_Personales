import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePlanItem } from "@/app/actions/plan";
import { TrashIcon } from "@/components/icons";
import { PlanItemForm } from "@/components/plan-item-form";
import { PageHeader } from "@/components/ui";
import { toNumber } from "@/lib/format";
import { getCategories, getPlanItem, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditPlanItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) notFound();

  const [row, products, categories] = await Promise.all([
    getPlanItem(itemId),
    getProducts(),
    getCategories(),
  ]);
  if (!row) notFound();

  const { item, productName } = row;

  return (
    <>
      <PageHeader
        title="Editar del plan"
        action={
          <Link href={`/plan?mes=${item.period}`} className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-4">
        <PlanItemForm
          period={item.period}
          products={products}
          categories={categories}
          initial={{
            id: item.id,
            productId: item.productId,
            label: productName ?? item.label ?? "",
            categoryId: item.categoryId,
            subcategoryId: item.subcategoryId,
            quantity: toNumber(item.quantity),
            unitPrice: toNumber(item.unitPrice),
            amount: toNumber(item.amount),
            note: item.note ?? "",
          }}
        />

        <form action={deletePlanItem}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="period" value={item.period} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium text-danger active:bg-surface-2"
          >
            <TrashIcon className="h-4 w-4" />
            Quitar del plan
          </button>
        </form>
      </main>
    </>
  );
}
