"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, CreditCard, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseLineForm } from "./expense-line-form";
import { setArchivedAction } from "./actions";
import { categoryColor } from "@/lib/categories";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ExpenseLine } from "@/db/schema";

export function ExpenseLineRow({ line }: { line: ExpenseLine }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggleArchived = () => {
    startTransition(async () => {
      try {
        await setArchivedAction(line.id, !line.isArchived);
        toast.success(line.isArchived ? "Restaurada" : "Arquivada");
      } catch {
        toast.error("Falha ao atualizar.");
      }
    });
  };

  if (editing) {
    return (
      <div className="border rounded-lg p-4 bg-card">
        <ExpenseLineForm
          mode="edit"
          initial={line}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const color = categoryColor(line.category);
  return (
    <div className="border rounded-lg p-3 flex items-center gap-3 bg-card min-h-14">
      <div
        className={cn(
          "flex flex-col items-center justify-center min-w-[40px] size-10 rounded-md text-xs",
          "bg-muted/50 text-muted-foreground",
        )}
      >
        <span className="text-[10px] leading-none">dia</span>
        <span className="font-semibold text-foreground tabular-nums text-sm leading-tight">
          {line.dueDay}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate flex items-center gap-1.5">
          <span className="truncate">{line.name}</span>
          {line.defaultPaidWithCard ? (
            <CreditCard
              className="size-3.5 text-muted-foreground shrink-0"
              aria-label="Padrão pago no cartão"
            />
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
          {line.category ? (
            <span className="flex items-center gap-1">
              <span
                className={cn(
                  "size-2 rounded-full",
                  color?.dot ?? "bg-muted-foreground",
                )}
              />
              <span className={color?.text ?? ""}>{line.category}</span>
            </span>
          ) : null}
          {line.defaultProjectedCents !== 0 ? (
            <span className="tabular-nums">
              {formatBRL(line.defaultProjectedCents)}
            </span>
          ) : null}
          {line.isArchived ? <span>arquivada</span> : null}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setEditing(true)}
        aria-label="Editar"
        className="size-9"
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleArchived}
        disabled={pending}
        aria-label={line.isArchived ? "Restaurar" : "Arquivar"}
        className="size-9"
      >
        {line.isArchived ? (
          <ArchiveRestore className="size-4" />
        ) : (
          <Archive className="size-4" />
        )}
      </Button>
    </div>
  );
}
