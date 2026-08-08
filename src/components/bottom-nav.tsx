"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GearIcon, HomeIcon, ListIcon, PlusIcon, TargetIcon } from "./icons";

// El catálogo y las categorías viven dentro de Ajustes: se tocan de vez en
// cuando, no todos los días como los gastos.
const TABS = [
  { href: "/", label: "Resumen", Icon: HomeIcon, exact: true },
  { href: "/gastos", label: "Gastos", Icon: ListIcon, exact: false },
  { href: "/plan", label: "Plan", Icon: TargetIcon, exact: false },
  {
    href: "/ajustes",
    label: "Ajustes",
    Icon: GearIcon,
    exact: false,
    // El catálogo y los ingresos cuelgan de Ajustes, así que la pestaña
    // se queda encendida mientras estás ahí adentro.
    alsoMatches: ["/catalogo", "/ingresos"],
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pt-1 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {TABS.slice(0, 2).map((tab) => (
          <Tab key={tab.href} {...tab} pathname={pathname} />
        ))}

        <Link
          href="/gastos/nuevo"
          aria-label="Agregar gasto"
          className="relative -mt-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-black/20 active:scale-95"
        >
          <PlusIcon className="h-6 w-6" />
        </Link>

        {TABS.slice(2).map((tab) => (
          <Tab key={tab.href} {...tab} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  Icon,
  exact,
  pathname,
  alsoMatches = [],
}: {
  href: string;
  label: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  exact: boolean;
  pathname: string;
  alsoMatches?: readonly string[];
}) {
  const active = exact
    ? pathname === href
    : pathname.startsWith(href) || alsoMatches.some((p) => pathname.startsWith(p));
  return (
    <Link
      href={href}
      className={`flex min-w-16 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] transition-colors ${
        active ? "text-accent" : "text-muted"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
