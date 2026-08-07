import Link from "next/link";
import { pct } from "@/lib/format";

export function PageHeader({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="safe-top sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto max-w-lg px-4 pt-3 pb-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {action}
        </div>
        {children}
      </div>
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-surface ${className}`}>
      {children}
    </section>
  );
}

/**
 * Barra de gastado vs planificado. Si te pasaste del plan, la parte de más
 * se pinta aparte para que se vea de un golpe.
 */
export function ProgressBar({
  spent,
  planned,
  color,
}: {
  spent: number;
  planned: number;
  color: string;
}) {
  const over = planned > 0 && spent > planned;
  const width = planned > 0 ? Math.min(100, pct(spent, planned)) : spent > 0 ? 100 : 0;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${width}%`,
          backgroundColor: over ? "var(--danger)" : color,
        }}
      />
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 text-4xl">{emoji}</div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref as never}
          className="mt-5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white active:opacity-80"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "bad" | "warn";
}) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    good: "bg-accent-soft text-accent",
    bad: "bg-danger/10 text-danger",
    warn: "bg-warn/10 text-warn",
  } as const;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
