/**
 * Un "period" es un mes en formato 'YYYY-MM'. Todo el mes se calcula en hora de
 * Bolivia, para que un gasto registrado a las 11 de la noche no caiga en el día
 * siguiente por culpa de UTC.
 */
export const TIMEZONE = "America/La_Paz";

const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Fecha de hoy en Bolivia, como 'YYYY-MM-DD' */
export function todayISO(): string {
  return isoFormatter.format(new Date());
}

/** Mes actual, como 'YYYY-MM' */
export function currentPeriod(): string {
  return todayISO().slice(0, 7);
}

export function isValidPeriod(value: string | undefined | null): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** El mes de una fecha 'YYYY-MM-DD' */
export function periodOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** shiftPeriod('2026-01', -1) === '2025-12' */
export function shiftPeriod(period: string, months: number): string {
  const [year, month] = period.split("-").map(Number);
  const total = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (total % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

/** Rango [primer día, último día] del mes, ambos inclusive, como 'YYYY-MM-DD' */
export function periodRange(period: string): { start: string; end: string } {
  const [year, month] = period.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${period}-01`,
    end: `${period}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** 'agosto 2026' */
export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-BO", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** 'ago 2026' — versión corta para selectores */
export function periodLabelShort(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** '2026-08-07' -> 'vie 7 de agosto' */
export function dayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Cuántos días tiene el mes y cuántos van transcurridos (para proyectar el gasto) */
export function periodProgress(period: string): { daysInMonth: number; daysElapsed: number } {
  const [year, month] = period.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const today = todayISO();
  if (periodOf(today) > period) return { daysInMonth, daysElapsed: daysInMonth };
  if (periodOf(today) < period) return { daysInMonth, daysElapsed: 0 };
  return { daysInMonth, daysElapsed: Number(today.slice(8, 10)) };
}
