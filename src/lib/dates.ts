export const MONTHS_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

export const MONTHS_PT_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export function monthLabel(year: number, month: number): string {
  return `${MONTHS_PT[month - 1]}.-${year}`;
}

export function monthLabelLong(year: number, month: number): string {
  return `${MONTHS_PT_LONG[month - 1]} ${year}`;
}

export type YearMonth = { year: number; month: number };

export const APP_TZ = "America/Sao_Paulo";

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Retorna {year, month, day} no fuso do app (independe da TZ do processo). */
export function todayInAppTz(now: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const parts = ymdFormatter.formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  const day = Number(parts.find((p) => p.type === "day")!.value);
  return { year, month, day };
}

export function currentYearMonth(): YearMonth {
  const { year, month } = todayInAppTz();
  return { year, month };
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

/** Gera N meses começando em `start`. */
export function rangeMonths(start: YearMonth, count: number): YearMonth[] {
  return Array.from({ length: count }, (_, i) => addMonths(start, i));
}

export function ymKey({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Comparador numérico (yyyymm). Útil pra ordenar/comparar year+month. */
export function ymInt({ year, month }: YearMonth): number {
  return year * 100 + month;
}

/** Último dia do mês (28-31). */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Clampa o dia de vencimento ao último dia do mês informado. */
export function clampDueDay(dueDay: number, year: number, month: number): number {
  return Math.min(dueDay, lastDayOfMonth(year, month));
}

/** Status visual de um lançamento. */
export type EntryStatus = "paid" | "pending" | "overdue" | "empty";

export function entryStatus(opts: {
  projectedCents: number;
  actualCents: number | null;
  paidAt: Date | null;
  dueDay: number;
  year: number;
  month: number;
  today?: Date;
}): EntryStatus {
  const { projectedCents, actualCents, paidAt, dueDay, year, month } = opts;
  if (paidAt || actualCents !== null) return "paid";
  if (projectedCents === 0 && actualCents === null) return "empty";
  const t = todayInAppTz(opts.today ?? new Date());
  const todayKey = t.year * 10000 + t.month * 100 + t.day;
  const dueKey = year * 10000 + month * 100 + clampDueDay(dueDay, year, month);
  if (todayKey > dueKey) return "overdue";
  return "pending";
}
