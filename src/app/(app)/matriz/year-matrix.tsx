"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CellEditor } from "@/components/cell-editor";
import { formatBRL } from "@/lib/money";
import {
  entryStatus,
  monthLabel,
  ymKey,
  type EntryStatus,
  type YearMonth,
} from "@/lib/dates";
import type { ExpenseLine, MonthlyEntry } from "@/db/schema";

type Props = {
  lines: ExpenseLine[];
  entries: MonthlyEntry[];
  months: YearMonth[];
};

type CellKey = `${number}:${number}:${number}`;

function cellKey(lineId: number, year: number, month: number): CellKey {
  return `${lineId}:${year}:${month}` as CellKey;
}

function StatusIcon({ status }: { status: EntryStatus }) {
  if (status === "paid")
    return <CheckCircle2 className="size-3.5 text-emerald-600" />;
  if (status === "overdue")
    return <AlertTriangle className="size-3.5 text-destructive" />;
  if (status === "pending")
    return <Clock className="size-3.5 text-muted-foreground" />;
  return null;
}

export function YearMatrix({ lines, entries, months }: Props) {
  const [editing, setEditing] = useState<{
    line: ExpenseLine;
    year: number;
    month: number;
  } | null>(null);

  const entryMap = useMemo(() => {
    const m = new Map<CellKey, MonthlyEntry>();
    for (const e of entries) m.set(cellKey(e.lineId, e.year, e.month), e);
    return m;
  }, [entries]);

  const totalsByMonth = useMemo(() => {
    const totals = new Map<string, number>();
    for (const ym of months) {
      let total = 0;
      for (const line of lines) {
        const e = entryMap.get(cellKey(line.id, ym.year, ym.month));
        const value =
          e?.actualCents !== null && e?.actualCents !== undefined
            ? e.actualCents
            : (e?.projectedCents ?? line.defaultProjectedCents);
        total += value;
      }
      totals.set(ymKey(ym), total);
    }
    return totals;
  }, [lines, months, entryMap]);

  const editingEntry = editing
    ? (entryMap.get(cellKey(editing.line.id, editing.year, editing.month)) ?? null)
    : null;

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
      <div className="overflow-x-auto p-4">
        <table className="min-w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="text-left font-medium px-3 py-2 sticky left-0 bg-muted/40 z-20 min-w-[200px]">
                Despesa
              </th>
              <th className="text-center font-medium px-2 py-2">Venc.</th>
              {months.map((ym) => (
                <th
                  key={ymKey(ym)}
                  className="text-right font-medium px-3 py-2 whitespace-nowrap min-w-[120px]"
                >
                  {monthLabel(ym.year, ym.month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b hover:bg-accent/30">
                <td className="px-3 py-2 sticky left-0 bg-background font-medium z-10">
                  {line.name}
                </td>
                <td className="px-2 py-2 text-center text-muted-foreground tabular-nums">
                  {line.dueDay}
                </td>
                {months.map((ym) => {
                  const entry = entryMap.get(cellKey(line.id, ym.year, ym.month));
                  const status = entryStatus({
                    projectedCents: entry?.projectedCents ?? line.defaultProjectedCents,
                    actualCents: entry?.actualCents ?? null,
                    paidAt: entry?.paidAt ?? null,
                    dueDay: line.dueDay,
                    year: ym.year,
                    month: ym.month,
                  });
                  const value =
                    entry?.actualCents !== null && entry?.actualCents !== undefined
                      ? entry.actualCents
                      : (entry?.projectedCents ?? line.defaultProjectedCents);
                  const isNegative = value < 0;
                  return (
                    <td
                      key={ymKey(ym)}
                      className="px-3 py-1.5 text-right tabular-nums"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({ line, year: ym.year, month: ym.month })
                        }
                        className={cn(
                          "w-full rounded px-2 py-1 hover:bg-accent text-right",
                          isNegative && "text-destructive",
                        )}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <StatusIcon status={status} />
                          <span>{value === 0 ? "—" : formatBRL(value)}</span>
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-muted/40 font-semibold">
              <td className="px-3 py-2 sticky left-0 bg-muted/40">TOTAL</td>
              <td />
              {months.map((ym) => (
                <td
                  key={ymKey(ym)}
                  className="px-3 py-2 text-right tabular-nums"
                >
                  {formatBRL(totalsByMonth.get(ymKey(ym)) ?? 0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <CellEditor
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        line={editing?.line ?? null}
        year={editing?.year ?? 0}
        month={editing?.month ?? 0}
        entry={editingEntry}
      />
    </>
  );
}
