import Link from "next/link";
import { TransferForm } from "@/components/transfer-form";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/period";
import { getAccountsOverview } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewTransferPage() {
  const { accounts } = await getAccountsOverview();
  const activas = accounts.filter((a) => a.isActive);

  return (
    <>
      <PageHeader
        title="Transferir"
        action={
          <Link href="/ajustes/cuentas" className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />
      <main className="mx-auto max-w-lg px-4 py-4">
        {activas.length < 2 ? (
          <Card>
            <EmptyState
              emoji="🔁"
              title="Hacen falta dos cuentas"
              description="Una transferencia mueve plata de una cuenta a otra, así que necesitás al menos dos: por ejemplo Efectivo y Banco."
              actionLabel="Crear una cuenta"
              actionHref="/ajustes/cuentas"
            />
          </Card>
        ) : (
          <TransferForm
            accounts={activas}
            initial={{
              fromAccountId: null,
              toAccountId: null,
              amount: 0,
              transferredOn: todayISO(),
              note: "",
            }}
          />
        )}
      </main>
    </>
  );
}
