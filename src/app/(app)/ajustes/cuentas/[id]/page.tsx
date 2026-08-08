import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { Card, PageHeader } from "@/components/ui";
import { bs, toNumber } from "@/lib/format";
import { getAccount, getAccountsOverview } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const accountId = Number(id);
  if (!Number.isInteger(accountId)) notFound();

  const [account, overview] = await Promise.all([getAccount(accountId), getAccountsOverview()]);
  if (!account) notFound();

  const balance = overview.accounts.find((a) => a.id === accountId);

  return (
    <>
      <PageHeader
        title="Editar cuenta"
        action={
          <Link href="/ajustes/cuentas" className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {balance && (
          <Card className="p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Saldo actual</span>
              <span
                className={`tabular text-xl font-semibold ${balance.balance < 0 ? "text-danger" : ""}`}
              >
                {bs(balance.balance)}
              </span>
            </div>
            <p className="tabular mt-1 text-xs text-muted">
              {bs(balance.openingBalance)} inicial + {bs(balance.received)} de ingresos −{" "}
              {bs(balance.paid)} de gastos
            </p>
          </Card>
        )}

        <Card className="p-4">
          <AccountForm
            initial={{
              id: account.id,
              name: account.name,
              icon: account.icon,
              color: account.color,
              openingBalance: toNumber(account.openingBalance),
            }}
          />
        </Card>
      </main>
    </>
  );
}
