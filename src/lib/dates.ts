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

export function currentYearMonth(): YearMonth {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
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
  const today = opts.today ?? new Date();
  const due = new Date(year, month - 1, Math.min(dueDay, 28));
  if (today > due) return "overdue";
  return "pending";
}
