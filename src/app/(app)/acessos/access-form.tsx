"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAccessAction, type AccessFormState } from "./actions";

export function AccessForm() {
  const [state, action, pending] = useActionState<AccessFormState, FormData>(
    addAccessAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Acesso liberado");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex gap-2">
      <Input
        type="email"
        name="email"
        placeholder="email@dominio.com"
        required
        className="h-11 flex-1 text-base"
        autoComplete="off"
      />
      <Button type="submit" disabled={pending} className="h-11">
        <Plus className="size-4" /> Adicionar
      </Button>
    </form>
  );
}
