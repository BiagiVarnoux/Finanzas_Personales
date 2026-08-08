import Link from "next/link";
import { archiveAccount, deleteAccount, restoreAccount } from "@/app/actions/accounts";
import { AccountForm } from "@/components/account-form";
import { Card, Chip, EmptyState, PageHeader } from "@/components/ui";
import { bs } from "@/lib/format";
import { dayLabel } from "@/lib/period";
import { getAccountsOverview, getTransfers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [{ accounts, total, unassigned }, transfers] = await Promise.all([
    getAccountsOverview(),
    getTransfers(undefined, 15),
  ]);
  const active = accounts.filter((a) => a.isActive);
  const archived = accounts.filter((a) => !a.isActive);

  return (
    <>
      <PageHeader
        title="Cuentas"
        action={
          active.length >= 2 ? (
            <Link
              href="/ajustes/cuentas/transferir"
              className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-white active:opacity-80"
            >
              Transferir
            </Link>
          ) : (
            <Link href="/ajustes" className="text-sm font-medium text-muted">
              Volver
            </Link>
          )
        }
      />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {active.length === 0 ? (
          <Card>
            <EmptyState
              emoji="💵"
              title="Todavía no tenés cuentas"
              description="Creá una por cada lugar donde guardás plata: efectivo, banco, QR. Después, al cargar un gasto o un ingreso, elegís de dónde sale o a dónde entra."
            />
          </Card>
        ) : (
          <>
            <Card className="p-5">
              <p className="text-sm text-muted">Total disponible</p>
              <p className="tabular mt-1 text-3xl font-semibold tracking-tight">{bs(total)}</p>
              <p className="mt-1 text-xs text-muted">
                Suma de todas las cuentas activas, acumulado desde siempre.
              </p>
            </Card>

            <Card>
              <ul className="divide-y divide-border">
                {active.map((account) => (
                  <li key={account.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-8 w-8 shrink-0 rounded-full text-center text-lg leading-8"
                        style={{ backgroundColor: `${account.color}22` }}
                      >
                        {account.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{account.name}</p>
                        <p className="text-xs text-muted">
                          {account.movements === 0
                            ? "sin movimientos"
                            : `${account.movements} ${account.movements === 1 ? "movimiento" : "movimientos"}`}
                        </p>
                      </div>
                      <span
                        className={`tabular text-base font-semibold ${
                          account.balance < 0 ? "text-danger" : ""
                        }`}
                      >
                        {bs(account.balance)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                      <span className="tabular">inicial {bs(account.openingBalance)}</span>
                      {account.received > 0 && (
                        <Chip tone="good">+{bs(account.received)}</Chip>
                      )}
                      {account.paid > 0 && <Chip tone="bad">−{bs(account.paid)}</Chip>}
                      {(account.transferredIn > 0 || account.transferredOut > 0) && (
                        <Chip>
                          ⇄ {bs(account.transferredIn - account.transferredOut)}
                        </Chip>
                      )}

                      <span className="ml-auto flex gap-3">
                        <Link
                          href={`/ajustes/cuentas/${account.id}`}
                          className="font-medium text-accent"
                        >
                          Editar
                        </Link>
                        {account.movements === 0 ? (
                          <form action={deleteAccount}>
                            <input type="hidden" name="id" value={account.id} />
                            <button type="submit" className="font-medium text-muted">
                              Eliminar
                            </button>
                          </form>
                        ) : (
                          <form action={archiveAccount}>
                            <input type="hidden" name="id" value={account.id} />
                            <button type="submit" className="font-medium text-muted">
                              Archivar
                            </button>
                          </form>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}

        {unassigned.count > 0 && (
          <Card className="p-4">
            <p className="text-sm font-medium">Movimientos sin cuenta</p>
            <p className="mt-1 text-xs text-muted">
              Hay {unassigned.count}{" "}
              {unassigned.count === 1 ? "movimiento" : "movimientos"} cargados antes de que
              existieran las cuentas
              {unassigned.expenses > 0 && ` (${bs(unassigned.expenses)} en gastos`}
              {unassigned.incomes > 0 &&
                `${unassigned.expenses > 0 ? ", " : " ("}${bs(unassigned.incomes)} en ingresos`}
              {(unassigned.expenses > 0 || unassigned.incomes > 0) && ")"}. No entran en ningún
              saldo. Podés abrirlos y asignarles una cuenta cuando quieras.
            </p>
          </Card>
        )}

        {archived.length > 0 && (
          <div>
            <h2 className="mb-1.5 px-1 text-xs font-medium text-muted">Archivadas</h2>
            <Card>
              <ul className="divide-y divide-border">
                {archived.map((account) => (
                  <li key={account.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-lg leading-none opacity-50">{account.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted">
                      {account.name}
                    </span>
                    <span className="tabular text-sm text-muted">{bs(account.balance)}</span>
                    <form action={restoreAccount}>
                      <input type="hidden" name="id" value={account.id} />
                      <button type="submit" className="text-xs font-medium text-accent">
                        Restaurar
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {transfers.length > 0 && (
          <div>
            <h2 className="mb-1.5 px-1 text-xs font-medium text-muted">Entre cuentas</h2>
            <Card>
              <ul className="divide-y divide-border">
                {transfers.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/ajustes/cuentas/transferir/${t.id}`}
                      className="flex items-center gap-3 px-4 py-3 active:bg-surface-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {t.fromIcon} {t.fromName} <span className="text-muted">→</span> {t.toIcon}{" "}
                          {t.toName}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {dayLabel(t.transferredOn)}
                          {t.note && ` · ${t.note}`}
                        </p>
                      </div>
                      <span className="tabular text-sm font-semibold">{bs(t.amount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
            <p className="mt-1.5 px-1 text-xs text-muted">
              Mover plata entre tus cuentas no cuenta como gasto ni como ingreso: los totales del
              mes no cambian, solo cambia dónde está.
            </p>
          </div>
        )}

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Nueva cuenta</h2>
          <AccountForm
            showSuggestions
            initial={{ name: "", icon: "💵", color: "#10794f", openingBalance: 0 }}
          />
        </Card>
      </main>
    </>
  );
}
