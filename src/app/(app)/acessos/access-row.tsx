"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeAccessAction } from "./actions";

type Props = {
  id: number;
  email: string;
  isCurrent: boolean;
};

export function AccessRow({ id, email, isCurrent }: Props) {
  const [pending, startTransition] = useTransition();

  const handleRemove = () => {
    if (isCurrent) {
      toast.error("Você não pode remover o próprio acesso.");
      return;
    }
    if (!confirm(`Remover acesso de ${email}?`)) return;
    startTransition(async () => {
      try {
        await removeAccessAction(id);
        toast.success("Acesso removido");
      } catch {
        toast.error("Falha ao remover.");
      }
    });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-b-0 min-h-14">
      <div className="size-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm uppercase shrink-0">
        {email.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[15px] truncate">{email}</div>
        {isCurrent ? (
          <div className="text-xs text-emerald-600 font-medium mt-0.5">você</div>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleRemove}
        disabled={pending || isCurrent}
        aria-label={`Remover ${email}`}
        className="size-9 text-muted-foreground hover:text-destructive disabled:opacity-30"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
