"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CreditCard, Infinity as InfinityIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createLineAction,
  updateLineAction,
  type LineFormState,
} from "./actions";
import { centsToInputString } from "@/lib/money";
import { MONTHS_PT_LONG, currentYearMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ExpenseLine } from "@/db/schema";

type Props = {
  mode: "create" | "edit";
  initial?: ExpenseLine;
  defaultStartYear?: number;
  defaultStartMonth?: number;
  onSaved?: () => void;
};

const ONGOING_DEFAULT = 60; // mensal contínuo: 5 anos

export function ExpenseLineForm({
  mode,
  initial,
  defaultStartYear,
  defaultStartMonth,
  onSaved,
}: Props) {
  const action = mode === "create" ? createLineAction : updateLineAction;
  const [state, formAction, pending] = useActionState<LineFormState, FormData>(
    action,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const now = currentYearMonth();
  const initialStartYear = defaultStartYear ?? now.year;
  const initialStartMonth = defaultStartMonth ?? now.month;

  const [startYear, setStartYear] = useState(initialStartYear);
  const [startMonth, setStartMonth] = useState(initialStartMonth);
  const [recurrence, setRecurrence] = useState<"ongoing" | "fixed">("ongoing");
  const [monthsCount, setMonthsCount] = useState<number>(12);

  useEffect(() => {
    if (state?.ok) {
      toast.success(
        mode === "create" ? "Despesa criada" : "Despesa atualizada",
      );
      onSaved?.();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, mode, onSaved]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.year - 1 + i);
  const effectiveCount = recurrence === "ongoing" ? ONGOING_DEFAULT : monthsCount;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 sm:grid-cols-2"
    >
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder="Ex.: Água, Cartão Inter, Escola..."
          className="h-11 text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="category">Categoria (opcional)</Label>
        <Input
          id="category"
          name="category"
          defaultValue={initial?.category ?? ""}
          placeholder="Moradia, Cartão, Educação..."
          className="h-11 text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defaultProjected">Valor (R$)</Label>
        <Input
          id="defaultProjected"
          name="defaultProjected"
          inputMode="decimal"
          defaultValue={centsToInputString(
            initial?.defaultProjectedCents ?? null,
          )}
          placeholder="0,00"
          className="h-11 text-base"
          required={mode === "create"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dueDay">Dia de vencimento</Label>
        <Input
          id="dueDay"
          name="dueDay"
          type="number"
          min={1}
          max={31}
          required
          defaultValue={initial?.dueDay ?? 5}
          className="h-11 text-base"
        />
      </div>

      {mode === "create" ? (
        <>
          <div className="sm:col-span-2 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Começa em</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={String(startMonth)}
                  onValueChange={(v) => v && setStartMonth(Number(v))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue>
                      {MONTHS_PT_LONG[startMonth - 1].slice(0, 3)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS_PT_LONG.map((label, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(startYear)}
                  onValueChange={(v) => v && setStartYear(Number(v))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue>{startYear}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <input type="hidden" name="startMonth" value={startMonth} />
              <input type="hidden" name="startYear" value={startYear} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Repetições</Label>
              <div className="flex gap-1.5 bg-muted rounded-lg p-1 h-11">
                <button
                  type="button"
                  onClick={() => setRecurrence("ongoing")}
                  className={cn(
                    "flex-1 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors",
                    recurrence === "ongoing"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground",
                  )}
                  aria-pressed={recurrence === "ongoing"}
                >
                  <InfinityIcon className="size-3.5" />
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrence("fixed")}
                  className={cn(
                    "flex-1 rounded-md text-sm font-medium transition-colors",
                    recurrence === "fixed"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground",
                  )}
                  aria-pressed={recurrence === "fixed"}
                >
                  X meses
                </button>
              </div>
              {recurrence === "fixed" ? (
                <Input
                  type="number"
                  min={1}
                  max={360}
                  value={monthsCount}
                  onChange={(e) => setMonthsCount(Number(e.target.value) || 1)}
                  className="h-11 text-base"
                />
              ) : null}
              <input type="hidden" name="monthsCount" value={effectiveCount} />
            </div>
          </div>

          <p className="sm:col-span-2 text-xs text-muted-foreground -mt-1">
            {recurrence === "ongoing"
              ? "Lançamentos previstos para os próximos 60 meses (você ajusta valores conforme paga)."
              : `Cria ${monthsCount} lançamentos previstos a partir do mês escolhido.`}
          </p>
        </>
      ) : null}

      <label className="sm:col-span-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-3 cursor-pointer has-checked:bg-muted/40">
        <div className="flex items-start gap-3 min-w-0">
          <CreditCard className="size-5 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium">
              Pago com cartão por padrão
            </span>
            <span className="text-xs text-muted-foreground">
              Despesa já vem dentro da fatura — não soma no total mensal.
            </span>
          </div>
        </div>
        <input
          type="checkbox"
          name="defaultPaidWithCard"
          defaultChecked={initial?.defaultPaidWithCard ?? false}
          className="size-5 accent-primary"
        />
      </label>

      <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
        <Button type="submit" disabled={pending} className="h-11 px-5">
          {pending ? "..." : mode === "create" ? "Adicionar" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
