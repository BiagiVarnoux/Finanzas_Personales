const money = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 19.5 -> "Bs 19,50" */
export function bs(value: number | string | null | undefined): string {
  return `Bs ${money.format(toNumber(value))}`;
}

/** 1234.5 -> "Bs 1.235" — para titulares donde los centavos estorban */
export function bsShort(value: number | string | null | undefined): string {
  return `Bs ${compact.format(toNumber(value))}`;
}

/** Los numeric de Postgres llegan como string desde Drizzle. */
export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** 2.5 -> "2,5" (sin ceros de relleno) */
export function qty(value: number | string | null | undefined): string {
  const n = toNumber(value);
  return new Intl.NumberFormat("es-BO", { maximumFractionDigits: 3 }).format(n);
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
