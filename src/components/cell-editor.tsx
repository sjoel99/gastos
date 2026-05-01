"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { CalendarRange, CreditCard, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteEntriesFromMonthAction,
  deleteEntryAction,
  saveEntryAction,
  type EntryFormState,
} from "@/app/(app)/matriz/actions";
import { centsToInputString, formatBRL, parseBRLToCents } from "@/lib/money";
import { monthLabelLong } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ExpenseLine, MonthlyEntry } from "@/db/schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: ExpenseLine | null;
  year: number;
  month: number;
  entry: MonthlyEntry | null;
};

function CellEditorForm({
  line,
  year,
  month,
  entry,
  onSaved,
}: {
  line: ExpenseLine;
  year: number;
  month: number;
  entry: MonthlyEntry | null;
  onSaved: () => void;
}) {
  const [state, action, pending] = useActionState<EntryFormState, FormData>(
    saveEntryAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const applyForwardRef = useRef<HTMLInputElement>(null);
  const applyDueDayForwardRef = useRef<HTMLInputElement>(null);
  const projectedRef = useRef<HTMLInputElement>(null);
  const [paidWithCard, setPaidWithCard] = useState<boolean>(
    entry?.paidWithCard ?? line.defaultPaidWithCard,
  );
  const initialDueDay = entry?.dueDay ?? line.dueDay;
  const [dueDayValue, setDueDayValue] = useState<string>(String(initialDueDay));
  const [confirmForward, setConfirmForward] = useState<{
    valueCents: number;
  } | null>(null);
  const [confirmDueDayForward, setConfirmDueDayForward] = useState<{
    day: number;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePending, startDelete] = useTransition();

  useEffect(() => {
    if (state?.ok) {
      toast.success("Lançamento salvo");
      onSaved();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSaved]);

  const handleApplyForward = () => {
    const raw = projectedRef.current?.value ?? "";
    const cents = raw ? parseBRLToCents(raw) : 0;
    setConfirmForward({ valueCents: cents ?? 0 });
  };

  const handleApplyDueDayForward = () => {
    const day = Number(dueDayValue);
    if (!day || day < 1 || day > 31) {
      toast.error("Informe um dia entre 1 e 31.");
      return;
    }
    setConfirmDueDayForward({ day });
  };

  const submitWithForward = () => {
    if (applyForwardRef.current) applyForwardRef.current.value = "true";
    setConfirmForward(null);
    formRef.current?.requestSubmit();
  };

  const submitWithDueDayForward = () => {
    if (applyDueDayForwardRef.current)
      applyDueDayForwardRef.current.value = "true";
    setConfirmDueDayForward(null);
    formRef.current?.requestSubmit();
  };

  const runDelete = (scope: "single" | "forward") => {
    if (!entry) return;
    startDelete(async () => {
      const fd = new FormData();
      fd.set("lineId", String(line.id));
      fd.set("year", String(year));
      fd.set("month", String(month));
      const result =
        scope === "single"
          ? await deleteEntryAction(undefined, fd)
          : await deleteEntriesFromMonthAction(undefined, fd);
      if (result?.ok) {
        toast.success(
          scope === "single"
            ? "Lançamento excluído"
            : "Lançamentos excluídos a partir deste mês",
        );
        setConfirmDelete(false);
        onSaved();
      } else {
        toast.error(result?.error ?? "Falha ao excluir.");
      }
    });
  };

  return (
    <>
      <form
        ref={formRef}
        action={action}
        className="flex-1 flex flex-col gap-4 px-4 pb-4 overflow-y-auto"
      >
        <input type="hidden" name="lineId" value={line.id} />
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="month" value={month} />
        <input
          ref={applyForwardRef}
          type="hidden"
          name="applyForward"
          defaultValue=""
        />
        <input
          ref={applyDueDayForwardRef}
          type="hidden"
          name="applyDueDayForward"
          defaultValue=""
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="projected">Valor (R$)</Label>
          <Input
            ref={projectedRef}
            id="projected"
            name="projected"
            inputMode="decimal"
            defaultValue={centsToInputString(
              entry?.projectedCents ?? line.defaultProjectedCents ?? null,
            )}
            placeholder="0,00"
            className="h-11 text-base"
          />
          <button
            type="button"
            onClick={handleApplyForward}
            className="self-start flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <CalendarRange className="size-3.5" />
            Aplicar valor a partir deste mês em diante
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="dueDay">Dia de vencimento</Label>
          <Input
            id="dueDay"
            name="dueDay"
            type="number"
            min={1}
            max={31}
            value={dueDayValue}
            onChange={(e) => setDueDayValue(e.target.value)}
            className="h-11 w-24 text-base text-center"
          />
          <button
            type="button"
            onClick={handleApplyDueDayForward}
            className="self-start flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <CalendarRange className="size-3.5" />
            Aplicar dia a partir deste mês em diante
          </button>
        </div>

        <label
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg border px-3 py-3 cursor-pointer",
            paidWithCard && "bg-muted/40",
          )}
        >
          <div className="flex items-start gap-3 min-w-0">
            <CreditCard className="size-5 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium">Pago com cartão</span>
              <span className="text-xs text-muted-foreground">
                Não soma no total — está dentro da fatura.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            name="paidWithCard"
            checked={paidWithCard}
            onChange={(e) => setPaidWithCard(e.target.checked)}
            className="size-5 accent-primary"
          />
        </label>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Anotações</Label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={entry?.notes ?? ""}
            className="rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <SheetFooter className="mt-auto gap-2">
          <Button type="submit" disabled={pending} className="w-full h-11">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
          {entry ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              disabled={deletePending}
              className="w-full h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
              Excluir lançamento
            </Button>
          ) : null}
        </SheetFooter>
      </form>

      <Dialog
        open={!!confirmForward}
        onOpenChange={(o) => !o && setConfirmForward(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar valor em diante?</DialogTitle>
            <DialogDescription>
              {confirmForward ? (
                <>
                  A partir de <strong>{monthLabelLong(year, month)}</strong>, o
                  valor previsto de <strong>{line.name}</strong> passa a ser{" "}
                  <strong>{formatBRL(confirmForward.valueCents)}</strong>. Meses
                  já pagos não serão alterados.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmForward(null)}
              type="button"
            >
              Cancelar
            </Button>
            <Button onClick={submitWithForward} type="button">
              Aplicar e salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir lançamento</DialogTitle>
            <DialogDescription>
              <strong>{line.name}</strong> em{" "}
              <strong>{monthLabelLong(year, month)}</strong>. Escolha o alcance
              da exclusão. Meses já pagos não são afetados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-col sm:items-stretch sm:space-x-0 gap-2">
            <Button
              variant="destructive"
              onClick={() => runDelete("single")}
              disabled={deletePending}
              type="button"
              className="h-11"
            >
              {deletePending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Excluindo...
                </>
              ) : (
                "Excluir só este mês"
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => runDelete("forward")}
              disabled={deletePending}
              type="button"
              className="h-11"
            >
              {deletePending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Excluindo...
                </>
              ) : (
                "Excluir este e os próximos"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              type="button"
              disabled={deletePending}
              className="h-11"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDueDayForward}
        onOpenChange={(o) => !o && setConfirmDueDayForward(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar dia em diante?</DialogTitle>
            <DialogDescription>
              {confirmDueDayForward ? (
                <>
                  A partir de <strong>{monthLabelLong(year, month)}</strong>,{" "}
                  <strong>{line.name}</strong> passa a vencer no dia{" "}
                  <strong>{confirmDueDayForward.day}</strong>. Meses já pagos
                  mantêm o dia anterior.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmDueDayForward(null)}
              type="button"
            >
              Cancelar
            </Button>
            <Button onClick={submitWithDueDayForward} type="button">
              Aplicar e salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CellEditor({
  open,
  onOpenChange,
  line,
  year,
  month,
  entry,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "max-h-[92vh] flex flex-col gap-0 p-0 rounded-t-2xl",
          "sm:max-w-md! sm:max-h-[85vh]! sm:rounded-2xl! sm:border!",
          "sm:left-1/2! sm:right-auto! sm:bottom-auto! sm:top-1/2!",
          "sm:translate-x-[-50%]! sm:translate-y-[-50%]!",
        )}
      >
        {line ? (
          <>
            <SheetHeader className="px-4 pt-4 pb-3 border-b">
              <SheetTitle>{line.name}</SheetTitle>
              <SheetDescription>
                {monthLabelLong(year, month)} · vence dia {line.dueDay}
              </SheetDescription>
            </SheetHeader>
            <CellEditorForm
              key={`${line.id}:${year}:${month}`}
              line={line}
              year={year}
              month={month}
              entry={entry}
              onSaved={() => onOpenChange(false)}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
