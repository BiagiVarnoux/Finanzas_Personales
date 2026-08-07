import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteExpense } from "@/app/actions/expenses";
import { ExpenseForm } from "@/components/expense-form";
import { TrashIcon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { toNumber } from "@/lib/format";
import { getCategories, getExpense, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expenseId = Number(id);
  if (!Number.isInteger(expenseId)) notFound();

  const [expense, products, categories] = await Promise.all([
    getExpense(expenseId),
    getProducts(),
    getCategories(),
  ]);
  if (!expense) notFound();

  return (
    <>
      <PageHeader
        title="Editar gasto"
        action={
          <Link href={`/gastos?mes=${expense.period}`} className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-4">
        <ExpenseForm
          products={products}
          categories={categories}
          frequent={[]}
          initial={{
            id: expense.id,
            productId: expense.productId,
            description: expense.description,
            categoryId: expense.categoryId,
            subcategoryId: expense.subcategoryId,
            quantity: toNumber(expense.quantity),
            unit: expense.unit,
            unitPrice: toNumber(expense.unitPrice),
            amount: toNumber(expense.amount),
            spentOn: expense.spentOn,
            note: expense.note ?? "",
          }}
        />

        <form action={deleteExpense}>
          <input type="hidden" name="id" value={expense.id} />
          <input type="hidden" name="period" value={expense.period} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium text-danger active:bg-surface-2"
          >
            <TrashIcon className="h-4 w-4" />
            Eliminar gasto
          </button>
        </form>
      </main>
    </>
  );
}
