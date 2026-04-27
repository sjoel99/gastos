"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput({ initial }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = new URLSearchParams(window.location.search);
      const trimmed = value.trim();
      const cur = current.get("q") ?? "";
      if (cur === trimmed) return; // sem mudança, não bate na URL
      if (trimmed) current.set("q", trimmed);
      else current.delete("q");
      const qs = current.toString();
      startTransition(() => {
        router.replace(`/despesas${qs ? "?" + qs : ""}`);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [value, router]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Buscar por nome ou categoria..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-11 pl-9 pr-9 text-base"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
