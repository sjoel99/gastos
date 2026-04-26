import { AlertCircle, BellRing, CreditCard, Plus } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { monthLabelLong } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ExpenseRow } from "./expense-row";
import { AddExpenseButton } from "@/app/(app)/despesas/add-expense-button";
import { EnableNotificationsButton } from "@/components/enable-notifications";
import type { ExpenseLine, MonthlyEntry } from "@/db/schema";

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";

type Props = {
  lines: ExpenseLine[];
  entries: MonthlyEntry[];
  year: number;
  month: number;
};

function entryValueCents(line: ExpenseLine, entry: MonthlyEntry | undefined) {
  if (entry?.actualCents !== null && entry?.actualCents !== undefined) {
    return entry.actualCents;
  }
  return entry?.projectedCents ?? line.defaultProjectedCents;
}

function isCardLine(
  line: ExpenseLine,
  entry: MonthlyEntry | undefined,
): boolean {
  return entry?.paidWithCard ?? line.defaultPaidWithCard;
}

function dueLabel(daysUntil: number): string {
  if (daysUntil <= 0) return "Hoje";
  if (daysUntil === 1) return "Amanhã";
  return `${daysUntil}d`;
}

function lineActiveInMonth(
  line: ExpenseLine,
  entry: MonthlyEntry | undefined,
): boolean {
  // Aparece se tem lançamento (qualquer entry persistida) ou valor padrão > 0.
  return !!entry || line.defaultProjectedCents > 0;
}

export function MonthView({ lines, entries, year, month }: Props) {
  const entryByLine = new Map(entries.map((e) => [e.lineId, e]));
  const visibleLines = lines.filter((l) =>
    lineActiveInMonth(l, entryByLine.get(l.id)),
  );

  let positiveTotal = 0;
  let cardTotal = 0;
  let paidPositive = 0;
  let paidCard = 0;
  for (const line of visibleLines) {
    const entry = entryByLine.get(line.id);
    const value = entryValueCents(line, entry);
    const paid = !!entry?.paidAt;
    if (isCardLine(line, entry)) {
      cardTotal += value;
      if (paid) paidCard += value;
      continue;
    }
    positiveTotal += value;
    if (paid) paidPositive += value;
  }
  // "Pago cartão" abate do total do mês (já está dentro de outra fatura).
  const total = positiveTotal - cardTotal;
  const paidTotal = paidPositive - paidCard;
  const pendingTotal =
    positiveTotal - paidPositive - (cardTotal - paidCard);
  const denom = positiveTotal + cardTotal;
  const pctPaid =
    denom > 0 ? Math.round(((paidPositive + paidCard) / denom) * 100) : 0;
  const isFullyPaid = pctPaid === 100;

  const today = new Date();
  const todayKey =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const upcomingAll = visibleLines
    .map((line) => {
      const entry = entryByLine.get(line.id);
      if (entry?.paidAt) return null;
      if (isCardLine(line, entry)) return null;
      const effectiveDueDay = entry?.dueDay ?? line.dueDay;
      const dueDate = new Date(year, month - 1, Math.min(effectiveDueDay, 28));
      const dueKey =
        dueDate.getFullYear() * 10000 +
        (dueDate.getMonth() + 1) * 100 +
        dueDate.getDate();
      const daysUntil = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const isToday = dueKey === todayKey;
      if (!isToday && (daysUntil < 0 || daysUntil > 7)) return null;
      return {
        line,
        daysUntil,
        isToday,
        value: entryValueCents(line, entry),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const dueToday = upcomingAll.filter((x) => x.isToday);
  const upcoming = upcomingAll.filter((x) => !x.isToday);
  const dueTodayTotal = dueToday.reduce((s, x) => s + x.value, 0);

  if (visibleLines.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="max-w-sm space-y-3">
          <h2 className="text-lg font-semibold">
            {lines.length === 0
              ? "Nenhuma despesa cadastrada"
              : "Nenhuma despesa neste mês"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lines.length === 0 ? (
              <>
                Adicione suas despesas recorrentes na aba <strong>Itens</strong>.
              </>
            ) : (
              "Navegue pelos meses ou cadastre uma despesa para este período."
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4 flex flex-col gap-4 max-w-2xl w-full mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-purple-900 text-primary-foreground shadow-lg shadow-primary/20">
        <div
          aria-hidden
          className="absolute -top-16 -right-12 size-52 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-10 size-48 rounded-full bg-white/5 blur-2xl"
        />
        <div className="relative p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium opacity-75 tracking-wide">
                Total do mês
              </span>
              {cardTotal > 0 ? (
                <div
                  className="flex items-center gap-1.5 text-[11px] bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm shrink-0"
                  title="Pago no cartão — abate do total do mês"
                >
                  <CreditCard className="size-3" />
                  <span className="tabular-nums font-semibold">
                    −{formatBRL(cardTotal)}
                  </span>
                </div>
              ) : null}
            </div>
            <span className="text-[34px] sm:text-[40px] leading-none font-bold tabular-nums tracking-tight">
              {formatBRL(total)}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isFullyPaid ? "bg-emerald-300" : "bg-white",
                )}
                style={{ width: `${pctPaid}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="opacity-70">Pago</span>
                <span className="tabular-nums font-bold text-sm">
                  {formatBRL(paidTotal)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="opacity-70">Falta</span>
                <span className="tabular-nums font-bold text-sm">
                  {formatBRL(pendingTotal)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 items-end">
                <span className="opacity-70">% pago</span>
                <span className="tabular-nums font-bold text-sm">
                  {pctPaid}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {VAPID_PUBLIC ? (
        <div className="flex justify-end -mb-1">
          <EnableNotificationsButton vapidPublicKey={VAPID_PUBLIC} />
        </div>
      ) : null}

      {dueToday.length > 0 ? (
        <div className="rounded-2xl border-2 border-rose-500/80 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-700 p-4 flex flex-col gap-3 shadow-md shadow-rose-500/10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <BellRing className="size-4 animate-pulse" />
              <span className="font-bold text-sm">
                {dueToday.length === 1
                  ? "Vence hoje"
                  : `${dueToday.length} contas vencem hoje`}
              </span>
            </div>
            <span className="tabular-nums font-bold text-sm text-rose-700 dark:text-rose-300">
              {formatBRL(dueTodayTotal)}
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {dueToday.map(({ line, value }) => (
              <li
                key={line.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-1.5 rounded-full bg-rose-600 shrink-0" />
                  <span className="truncate text-rose-950 dark:text-rose-100 font-medium">
                    {line.name}
                  </span>
                </div>
                <span className="tabular-nums shrink-0 font-semibold text-rose-950 dark:text-rose-100">
                  {formatBRL(value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-900/60 p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertCircle className="size-4" />
              <span className="font-semibold text-sm">
                Próximos vencimentos
              </span>
            </div>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 tabular-nums">
              {upcoming.length}
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {upcoming.map(({ line, daysUntil, value }) => (
              <li
                key={line.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums shrink-0",
                      daysUntil <= 0
                        ? "bg-rose-600 text-white"
                        : "bg-amber-200/70 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100",
                    )}
                  >
                    {dueLabel(daysUntil)}
                  </span>
                  <span className="truncate text-amber-950 dark:text-amber-100">
                    {line.name}
                  </span>
                </div>
                <span className="tabular-nums shrink-0 font-semibold text-amber-950 dark:text-amber-100">
                  {formatBRL(value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-semibold text-[15px] capitalize leading-tight">
              {monthLabelLong(year, month)}
            </h2>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {visibleLines.length}{" "}
              {visibleLines.length === 1 ? "despesa" : "despesas"}
            </p>
          </div>
          <AddExpenseButton
            defaultStartYear={year}
            defaultStartMonth={month}
            trigger={
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary px-3 py-1.5 rounded-full bg-primary-soft hover:bg-accent transition-colors">
                <Plus className="size-3.5" />
                Adicionar
              </span>
            }
          />
        </div>
        <div>
          {visibleLines.map((line) => (
            <ExpenseRow
              key={line.id}
              line={line}
              entry={entryByLine.get(line.id) ?? null}
              year={year}
              month={month}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
