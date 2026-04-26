"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  confirmPaymentAction,
  type ConfirmPaymentState,
} from "@/app/(app)/matriz/actions";
import {
  centsToInputString,
  formatBRL,
  parseBRLToCents,
} from "@/lib/money";
import { monthLabelLong } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lineId: number;
  lineName: string;
  year: number;
  month: number;
  projectedCents: number;
};

function ConfirmPaymentForm({
  lineId,
  lineName,
  year,
  month,
  projectedCents,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [state, action, pending] = useActionState<
    ConfirmPaymentState,
    FormData
  >(confirmPaymentAction, undefined);
  const [valueStr, setValueStr] = useState(
    centsToInputString(projectedCents) ?? "",
  );
  const [applyForward, setApplyForward] = useState<"yes" | "no">("yes");

  useEffect(() => {
    if (state?.ok) {
      toast.success("Pagamento confirmado");
      onClose();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onClose]);

  const paidCents = parseBRLToCents(valueStr);
  const isDifferent =
    paidCents !== null && paidCents !== projectedCents;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirmar pagamento</DialogTitle>
        <DialogDescription>
          {lineName} · {monthLabelLong(year, month)}
        </DialogDescription>
      </DialogHeader>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="lineId" value={lineId} />
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="month" value={month} />
        <input
          type="hidden"
          name="applyForward"
          value={isDifferent && applyForward === "yes" ? "true" : "false"}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="paidValue">Quanto foi pago?</Label>
          <Input
            id="paidValue"
            name="paidValue"
            inputMode="decimal"
            value={valueStr}
            onChange={(e) => setValueStr(e.target.value)}
            placeholder="0,00"
            className="h-11 text-base"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Valor da despesa: {formatBRL(projectedCents)}
            {isDifferent && paidCents !== null ? (
              <span
                className={cn(
                  "ml-2 font-medium",
                  paidCents > projectedCents
                    ? "text-amber-600"
                    : "text-emerald-600",
                )}
              >
                {paidCents > projectedCents ? "+" : ""}
                {formatBRL(paidCents - projectedCents)}
              </span>
            ) : null}
          </p>
        </div>

        {isDifferent ? (
          <div className="rounded-lg border bg-muted/30 p-3 flex flex-col gap-2.5">
            <div className="flex items-start gap-2">
              <TrendingUp className="size-4 mt-0.5 text-primary shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  Aplicar esse valor para os próximos meses?
                </span>
                <span className="text-xs text-muted-foreground">
                  Atualiza meses futuros não pagos para{" "}
                  {paidCents !== null ? formatBRL(paidCents) : "—"}.
                </span>
              </div>
            </div>
            <div className="flex gap-1.5 bg-background rounded-md p-1">
              <button
                type="button"
                onClick={() => setApplyForward("yes")}
                className={cn(
                  "flex-1 py-1.5 rounded text-sm font-medium transition-colors",
                  applyForward === "yes"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                Sim, aplicar
              </button>
              <button
                type="button"
                onClick={() => setApplyForward("no")}
                className={cn(
                  "flex-1 py-1.5 rounded text-sm font-medium transition-colors",
                  applyForward === "no"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                Só este mês
              </button>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Confirmando...
              </>
            ) : (
              "Confirmar pagamento"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function ConfirmPaymentDialog(props: Props) {
  const { open, onOpenChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <ConfirmPaymentForm
            key={`${props.lineId}:${props.year}:${props.month}`}
            lineId={props.lineId}
            lineName={props.lineName}
            year={props.year}
            month={props.month}
            projectedCents={props.projectedCents}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
