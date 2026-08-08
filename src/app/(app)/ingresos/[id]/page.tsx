import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteIncome } from "@/app/actions/incomes";
import { TrashIcon } from "@/components/icons";
import { IncomeForm } from "@/components/income-form";
import { PageHeader } from "@/components/ui";
import { toNumber } from "@/lib/format";
import { getIncome, getIncomeCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditIncomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incomeId = Number(id);
  if (!Number.isInteger(incomeId)) notFound();

  const [income, categories] = await Promise.all([getIncome(incomeId), getIncomeCategories()]);
  if (!income) notFound();

  return (
    <>
      <PageHeader
        title="Editar ingreso"
        action={
          <Link href={`/ingresos?mes=${income.period}`} className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-4">
        <IncomeForm
          categories={categories}
          initial={{
            id: income.id,
            description: income.description,
            categoryId: income.categoryId,
            amount: toNumber(income.amount),
            receivedOn: income.receivedOn,
            note: income.note ?? "",
          }}
        />

        <form action={deleteIncome}>
          <input type="hidden" name="id" value={income.id} />
          <input type="hidden" name="period" value={income.period} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium text-danger active:bg-surface-2"
          >
            <TrashIcon className="h-4 w-4" />
            Eliminar ingreso
          </button>
        </form>
      </main>
    </>
  );
}
