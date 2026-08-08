import Link from "next/link";
import { logout } from "@/app/login/actions";
import { ChevronRight } from "@/components/icons";
import { Card, PageHeader } from "@/components/ui";
import { bsShort } from "@/lib/format";
import { getCurrentUser } from "@/lib/current-user";
import { currentPeriod } from "@/lib/period";
import { getAccountsOverview, getCategories, getIncomeCategories, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [user, categories, incomeCategories, products, wallet] = await Promise.all([
    getCurrentUser(),
    getCategories(),
    getIncomeCategories(),
    getProducts(),
    getAccountsOverview(),
  ]);

  const activeAccounts = wallet.accounts.filter((a) => a.isActive);

  const activeProducts = products.filter((p) => p.isActive).length;
  const subcategoryCount = categories.reduce((sum, c) => sum + c.subcategories.length, 0);
  const period = currentPeriod();

  return (
    <>
      <PageHeader title="Perfil y configuración" />

      <main className="mx-auto max-w-lg space-y-5 px-4 py-4">
        <section>
          <h2 className="mb-1.5 px-1 text-xs font-medium text-muted">Movimientos</h2>
          <Card className="divide-y divide-border">
            <Row
              href={`/ingresos?mes=${period}`}
              icon="💰"
              title="Ingresos del mes"
              detail="Sueldo, ventas y demás entradas"
            />
            <Row
              href="/ajustes/cuentas"
              icon="💵"
              title="Cuentas"
              detail={
                activeAccounts.length === 0
                  ? "Efectivo, banco, QR: todavía ninguna"
                  : `${activeAccounts.length} ${activeAccounts.length === 1 ? "cuenta" : "cuentas"} · ${bsShort(wallet.total)} disponibles`
              }
            />
            <Row
              href={`/plan?mes=${period}`}
              icon="🎯"
              title="Plan mensual"
              detail="Lo que pensás gastar este mes"
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-1.5 px-1 text-xs font-medium text-muted">Catálogo y categorías</h2>
          <Card className="divide-y divide-border">
            <Row
              href="/catalogo"
              icon="🏷️"
              title="Productos"
              detail={`${activeProducts} en el catálogo`}
            />
            <Row
              href="/catalogo/categorias"
              icon="📂"
              title="Categorías de gasto"
              detail={`${categories.length} categorías · ${subcategoryCount} subcategorías`}
            />
            <Row
              href="/ajustes/categorias-ingreso"
              icon="📈"
              title="Categorías de ingreso"
              detail={
                incomeCategories.length === 0
                  ? "Todavía no creaste ninguna"
                  : `${incomeCategories.length} ${incomeCategories.length === 1 ? "categoría" : "categorías"}`
              }
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-1.5 px-1 text-xs font-medium text-muted">Sesión</h2>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-base font-semibold text-accent uppercase">
                {(user.name ?? user.email).slice(0, 1)}
              </span>
              <div className="min-w-0">
                {user.name && <p className="truncate text-sm font-medium">{user.name}</p>}
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              Tus datos son solo tuyos: nadie más que entre a la app puede verlos.
            </p>
            <form action={logout} className="mt-4">
              <button
                type="submit"
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted active:bg-surface-2"
              >
                Cerrar sesión
              </button>
            </form>
          </Card>
        </section>
      </main>
    </>
  );
}

function Row({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: string;
  title: string;
  detail: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2">
      <span className="text-xl leading-none">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted">{detail}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}
