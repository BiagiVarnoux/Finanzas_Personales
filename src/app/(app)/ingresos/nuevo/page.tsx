import Link from "next/link";
import { IncomeForm } from "@/components/income-form";
import { PageHeader } from "@/components/ui";
import { currentPeriod, isValidPeriod, periodRange, todayISO } from "@/lib/period";
import { getIncomeCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewIncomePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const period = isValidPeriod(mes) ? mes : currentPeriod();
  const categories = await getIncomeCategories();

  // Si estás mirando otro mes, la fecha por defecto cae en ese mes, no en hoy.
  const today = todayISO();
  const defaultDate = today.startsWith(period) ? today : periodRange(period).start;

  return (
    <>
      <PageHeader
        title="Nuevo ingreso"
        action={
          <Link href={`/ingresos?mes=${period}`} className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        <IncomeForm
          categories={categories}
          initial={{
            description: "",
            categoryId: null,
            amount: 0,
            receivedOn: defaultDate,
            note: "",
          }}
        />
      </main>
    </>
  );
}
