"use client";

import { useMemo, useState } from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { categoryColor } from "@/lib/categories";
import { formatBRL } from "@/lib/money";
import { monthLabelLong } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ExpenseRow } from "./expense-row";
import type { ExpenseLine, MonthlyEntry } from "@/db/schema";

type Props = {
  lines: ExpenseLine[];
  entries: MonthlyEntry[];
  year: number;
  month: number;
};

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

function entryValue(line: ExpenseLine, entry: MonthlyEntry | undefined) {
  if (entry?.actualCents !== null && entry?.actualCents !== undefined) {
    return entry.actualCents;
  }
  return entry?.projectedCents ?? line.defaultProjectedCents;
}

export function CalendarView({ lines, entries, year, month }: Props) {
  const [openDay, setOpenDay] = useState<number | null>(null);

  const entryByLine = useMemo(
    () => new Map(entries.map((e) => [e.lineId, e])),
    [entries],
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  const cells: Array<{ day: number | null; inMonth: boolean }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true });
  while (cells.length % 7 !== 0) cells.push({ day: null, inMonth: false });

  const linesByDay = useMemo(() => {
    const map = new Map<number, ExpenseLine[]>();
    for (const line of lines) {
      const entry = entryByLine.get(line.id);
      // Só conta a despesa no mês se tem lançamento ou valor padrão > 0.
      if (!entry && line.defaultProjectedCents <= 0) continue;
      const effectiveDueDay = entry?.dueDay ?? line.dueDay;
      const day = Math.min(effectiveDueDay, daysInMonth);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(line);
    }
    return map;
  }, [lines, entryByLine, daysInMonth]);

  const dayTotal = (day: number) => {
    const ls = linesByDay.get(day) ?? [];
    let total = 0;
    let cardTotal = 0;
    for (const l of ls) {
      const e = entryByLine.get(l.id);
      const v = entryValue(l, e);
      if (e?.paidWithCard ?? l.defaultPaidWithCard) cardTotal += v;
      else total += v;
    }
    return { total, cardTotal };
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day;

  const linesForOpen = openDay ? (linesByDay.get(openDay) ?? []) : [];

  if (lines.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="max-w-sm space-y-3">
          <h2 className="text-lg font-semibold">Nenhuma despesa cadastrada</h2>
          <p className="text-sm text-muted-foreground">
            Adicione suas despesas recorrentes na aba <strong>Itens</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-3 sm:p-6 flex flex-col gap-3 max-w-3xl w-full mx-auto">
        <h2 className="text-sm font-semibold capitalize text-muted-foreground px-1">
          {monthLabelLong(year, month)}
        </h2>

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
          {WEEKDAYS_PT.map((w) => (
            <div
              key={w}
              className="bg-muted/40 text-[10px] sm:text-xs font-medium text-muted-foreground text-center py-1.5"
            >
              {w}
            </div>
          ))}

          {cells.map((cell, idx) => {
            if (!cell.inMonth || cell.day === null) {
              return <div key={idx} className="bg-background min-h-[72px]" />;
            }
            const day = cell.day;
            const linesOnDay = linesByDay.get(day) ?? [];
            const { total } = dayTotal(day);
            const today = isToday(day);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => linesOnDay.length > 0 && setOpenDay(day)}
                disabled={linesOnDay.length === 0}
                className={cn(
                  "bg-background relative text-left p-1 sm:p-1.5 min-h-[72px] sm:min-h-[88px] flex flex-col gap-0.5",
                  linesOnDay.length > 0 && "active:bg-accent/50 cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] sm:text-xs font-semibold tabular-nums w-5 h-5 flex items-center justify-center rounded-full",
                    today
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {day}
                </span>

                <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                  {linesOnDay.slice(0, 2).map((l) => {
                    const e = entryByLine.get(l.id);
                    const color = categoryColor(l.category);
                    const isPaid = !!e?.paidAt;
                    const isCard = e?.paidWithCard ?? l.defaultPaidWithCard;
                    return (
                      <div
                        key={l.id}
                        className={cn(
                          "flex items-center gap-1 text-[10px] sm:text-[11px] px-1 py-0.5 rounded truncate",
                          color?.soft ?? "bg-muted",
                          color?.text ?? "text-foreground",
                          isPaid && "opacity-60 line-through",
                        )}
                      >
                        {isCard ? (
                          <CreditCard className="size-2.5 shrink-0" />
                        ) : isPaid ? (
                          <CheckCircle2 className="size-2.5 shrink-0" />
                        ) : null}
                        <span className="truncate">{l.name}</span>
                      </div>
                    );
                  })}
                  {linesOnDay.length > 2 ? (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{linesOnDay.length - 2}
                    </div>
                  ) : null}
                </div>

                {total > 0 && linesOnDay.length > 0 ? (
                  <span className="text-[9px] sm:text-[10px] tabular-nums text-muted-foreground mt-auto">
                    {formatBRL(total)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground px-1">
          Toque num dia para ver e editar as despesas.
        </p>
      </div>

      <Sheet
        open={openDay !== null}
        onOpenChange={(open) => {
          if (!open) setOpenDay(null);
        }}
      >
        <SheetContent side="bottom" className="max-h-[85vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>
              Dia {openDay} · {monthLabelLong(year, month)}
            </SheetTitle>
            <SheetDescription>
              {linesForOpen.length}{" "}
              {linesForOpen.length === 1 ? "despesa" : "despesas"} vencendo
              neste dia
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto -mx-6">
            {linesForOpen.map((line) => (
              <ExpenseRow
                key={line.id}
                line={line}
                entry={entryByLine.get(line.id) ?? null}
                year={year}
                month={month}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
