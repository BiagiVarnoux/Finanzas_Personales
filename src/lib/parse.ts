/** Acepta "19,50" y "19.50" por igual — en el teclado del iPhone sale coma. */
export function parseDecimal(value: FormDataEntryValue | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const raw = String(value).trim().replace(/\s/g, "").replace(",", ".");
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function parseId(value: FormDataEntryValue | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function parseText(value: FormDataEntryValue | null | undefined): string {
  return String(value ?? "").trim();
}

/** Redondea a 2 decimales y lo deja como string, que es lo que espera numeric en Postgres. */
export function money(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function quantity(value: number): string {
  return (Math.round(value * 1000) / 1000).toFixed(3);
}
