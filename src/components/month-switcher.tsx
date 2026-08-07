"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "./icons";
import { currentPeriod, periodLabel, shiftPeriod } from "@/lib/period";

export function MonthSwitcher({ period }: { period: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const go = (next: string) => {
    startTransition(() => router.push(`${pathname}?mes=${next}`));
  };

  const isCurrent = period === currentPeriod();

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        aria-label="Mes anterior"
        onClick={() => go(shiftPeriod(period, -1))}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => go(currentPeriod())}
        disabled={isCurrent}
        className={`min-w-0 flex-1 truncate rounded-full px-3 py-1.5 text-center text-sm font-medium ${
          pending ? "opacity-50" : ""
        } ${isCurrent ? "text-ink" : "bg-surface-2 text-ink"}`}
      >
        {periodLabel(period)}
        {!isCurrent && <span className="ml-1.5 text-xs text-muted">· ir a hoy</span>}
      </button>

      <button
        type="button"
        aria-label="Mes siguiente"
        onClick={() => go(shiftPeriod(period, 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted active:scale-95"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
