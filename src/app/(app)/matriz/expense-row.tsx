"use client";

import { useState, useTransition } from "react";
import { Check, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CellEditor } from "@/components/cell-editor";
import { ConfirmPaymentDialog } from "@/components/confirm-payment-dialog";
import { expenseIcon } from "@/lib/expense-icons";
import { formatBRL } from "@/lib/money";
import { togglePaidAction } from "./actions";
import type { ExpenseLine, MonthlyEntry } from "@/db/schema";

type Props = {
  line: ExpenseLine;
  entry: MonthlyEntry | null;
  year: number;
  month: number;
};

export function ExpenseRow({ line, entry, year, month }: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isPaid = !!entry?.paidAt;
  const projected = entry?.projectedCents ?? line.defaultProjectedCents;
  const actual = entry?.actualCents ?? null;
  const display = actual !== null ? actual : projected;
  const isNegative = display < 0;
  const isCard = entry?.paidWithCard ?? line.defaultPaidWithCard;
  const effectiveDueDay = entry?.dueDay ?? line.dueDay;
  const { Icon, bg, fg } = expenseIcon(line);

  const today = new Date();
  const dueDate = new Date(year, month - 1, Math.min(effectiveDueDay, 28));
  const dueKey =
    dueDate.getFullYear() * 10000 +
    (dueDate.getMonth() + 1) * 100 +
    dueDate.getDate();
  const todayKey =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const isDueToday = !isPaid && !isCard && dueKey === todayKey;
  const isOverdue = !isPaid && !isCard && dueKey < todayKey;

  const onTogglePaid = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPaid) {
      // Marcar como pago: abre dialog de confirmação de valor.
      setConfirmOpen(true);
      return;
    }
    // Desmarcar: toggle direto.
    const fd = new FormData();
    fd.set("lineId", String(line.id));
    fd.set("year", String(year));
    fd.set("month", String(month));
    fd.set("paid", "false");
    startTransition(async () => {
      try {
        await togglePaidAction(fd);
        toast.success("Pago desmarcado");
      } catch {
        toast.error("Falha ao atualizar");
      }
    });
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setEditorOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setEditorOpen(true);
          }
        }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-b-0 min-h-16 cursor-pointer transition-colors outline-none",
          "active:bg-accent/40 hover:bg-accent/30 focus-visible:bg-accent/40",
          isCard && "bg-muted/40",
        )}
      >
        <div
          className={cn(
            "size-11 rounded-full flex items-center justify-center shrink-0",
            bg,
          )}
        >
          <Icon className={cn("size-5", fg)} />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "font-medium truncate text-[15px]",
              isPaid && "text-muted-foreground",
            )}
          >
            {line.name}
          </div>
          <div className="text-xs tabular-nums mt-0.5">
            {isPaid ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-medium">
                Pago
                {isCard ? (
                  <CreditCard
                    className="size-3.5"
                    aria-label="no cartão"
                  />
                ) : null}
              </span>
            ) : isDueToday ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold text-[11px]">
                <span className="size-1.5 rounded-full bg-rose-600 animate-pulse" />
                Vence hoje
              </span>
            ) : isOverdue ? (
              <span className="text-rose-700 dark:text-rose-400 font-medium">
                Atrasado · venceu dia {effectiveDueDay}
              </span>
            ) : (
              <span className="text-muted-foreground">
                vence dia {effectiveDueDay}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end">
            <span
              className={cn(
                "tabular-nums font-semibold text-[15px]",
                isNegative && "text-destructive",
                isCard && !isPaid && "text-muted-foreground",
              )}
            >
              {display === 0 && actual === null
                ? "—"
                : (isNegative ? "" : "") + formatBRL(display)}
            </span>
          </div>
          <button
            type="button"
            onClick={onTogglePaid}
            disabled={pending}
            aria-label={isPaid ? "Desmarcar pago" : "Marcar como pago"}
            className={cn(
              "size-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
              isPaid
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-border hover:border-primary/60",
            )}
          >
            {isPaid ? <Check className="size-4 stroke-[3]" /> : null}
          </button>
        </div>
      </div>

      <CellEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        line={line}
        year={year}
        month={month}
        entry={entry}
      />
      <ConfirmPaymentDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        lineId={line.id}
        lineName={line.name}
        year={year}
        month={month}
        projectedCents={projected}
      />
    </>
  );
}
