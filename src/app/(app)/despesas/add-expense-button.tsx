"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExpenseLineForm } from "./expense-line-form";

type Props = {
  defaultStartYear?: number;
  defaultStartMonth?: number;
  trigger?: ReactNode;
};

export function AddExpenseButton({
  defaultStartYear,
  defaultStartMonth,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const renderTrigger =
    trigger ??
    (
      <>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="md:hidden fixed right-4 z-30 size-14 rounded-full shadow-lg shadow-primary/25 p-0"
          style={{ bottom: "calc(80px + env(safe-area-inset-bottom))" }}
          aria-label="Adicionar despesa"
        >
          <Plus className="size-6" />
        </Button>

        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden md:inline-flex"
        >
          <Plus className="size-4" /> Adicionar
        </Button>
      </>
    );

  return (
    <>
      {trigger ? (
        <button type="button" onClick={() => setOpen(true)} className="contents">
          {trigger}
        </button>
      ) : (
        renderTrigger
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] sm:max-w-md sm:mx-auto rounded-t-2xl flex flex-col gap-0 p-0"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b">
            <SheetTitle>Nova despesa</SheetTitle>
            <SheetDescription>
              Defina valor previsto, mês de início e repetições.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {open ? (
              <ExpenseLineForm
                mode="create"
                defaultStartYear={defaultStartYear}
                defaultStartMonth={defaultStartMonth}
                onSaved={() => setOpen(false)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
