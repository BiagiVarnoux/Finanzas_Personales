import Link from "next/link";
import { ExpenseForm } from "@/components/expense-form";
import { PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/period";
import { getAccounts, getCategories, getFrequentProducts, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const [products, categories, frequent, accounts] = await Promise.all([
    getProducts(),
    getCategories(),
    getFrequentProducts(),
    getAccounts(),
  ]);

  return (
    <>
      <PageHeader
        title="Nuevo gasto"
        action={
          <Link href="/gastos" className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <ExpenseForm
          products={products}
          categories={categories}
          accounts={accounts}
          frequent={frequent}
          initial={{
            productId: null,
            description: "",
            categoryId: null,
            subcategoryId: null,
            quantity: 1,
            unit: "unidad",
            unitPrice: 0,
            amount: 0,
            spentOn: todayISO(),
            note: "",
            accountId: accounts.length === 1 ? accounts[0].id : null,
          }}
        />
      </main>
    </>
  );
}
