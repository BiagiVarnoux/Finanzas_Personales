import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteTransfer } from "@/app/actions/transfers";
import { TrashIcon } from "@/components/icons";
import { TransferForm } from "@/components/transfer-form";
import { PageHeader } from "@/components/ui";
import { toNumber } from "@/lib/format";
import { getAccountsOverview, getTransfer } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditTransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transferId = Number(id);
  if (!Number.isInteger(transferId)) notFound();

  const [transfer, { accounts }] = await Promise.all([
    getTransfer(transferId),
    getAccountsOverview(),
  ]);
  if (!transfer) notFound();

  return (
    <>
      <PageHeader
        title="Editar transferencia"
        action={
          <Link href="/ajustes/cuentas" className="text-sm font-medium text-muted">
            Cancelar
          </Link>
        }
      />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-4">
        <TransferForm
          accounts={accounts.filter((a) => a.isActive)}
          initial={{
            id: transfer.id,
            fromAccountId: transfer.fromAccountId,
            toAccountId: transfer.toAccountId,
            amount: toNumber(transfer.amount),
            transferredOn: transfer.transferredOn,
            note: transfer.note ?? "",
          }}
        />

        <form action={deleteTransfer}>
          <input type="hidden" name="id" value={transfer.id} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium text-danger active:bg-surface-2"
          >
            <TrashIcon className="h-4 w-4" />
            Eliminar transferencia
          </button>
        </form>
      </main>
    </>
  );
}
