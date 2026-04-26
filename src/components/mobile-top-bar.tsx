"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight, LogOut, Users } from "lucide-react";
import { addMonths, currentYearMonth, MONTHS_PT_LONG } from "@/lib/dates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function viewTitle(pathname: string, view: string | null): string {
  if (pathname.startsWith("/acessos")) return "Acessos";
  if (pathname.startsWith("/despesas")) return "Itens";
  if (pathname.startsWith("/matriz")) {
    if (view === "calendario") return "Calendário";
    if (view === "ano") return "Matriz anual";
    if (view === "grafico") return "Gráfico anual";
    return "Mês";
  }
  return "";
}

export function MobileTopBar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const view = search.get("view");

  const isMatrizMonth =
    pathname.startsWith("/matriz") &&
    (view === null || view === "mes" || view === "calendario");
  const isMatrizYear =
    pathname.startsWith("/matriz") && (view === "grafico" || view === "ano");

  const now = currentYearMonth();
  const year = search.get("year") ? Number(search.get("year")) : now.year;
  const month = search.get("month") ? Number(search.get("month")) : now.month;

  const setMonth = (delta: number) => {
    const next = addMonths({ year, month }, delta);
    const params = new URLSearchParams(search);
    params.set("year", String(next.year));
    params.set("month", String(next.month));
    if (!params.get("view")) params.set("view", view ?? "mes");
    startTransition(() => router.push(`/matriz?${params.toString()}`));
  };

  const setYear = (delta: number) => {
    const params = new URLSearchParams(search);
    params.set("year", String(year + delta));
    if (!params.get("view")) params.set("view", view ?? "grafico");
    startTransition(() => router.push(`/matriz?${params.toString()}`));
  };

  return (
    <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-safe">
      <div className="px-4 h-14 flex items-center justify-between gap-2">
        <h1 className="font-bold text-lg tracking-tight">
          {viewTitle(pathname, view)}
        </h1>

        {isMatrizYear ? (
          <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setYear(-1)}
              disabled={pending}
              className="size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background"
              aria-label="Ano anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-3 text-sm font-semibold tabular-nums">
              {year}
            </span>
            <button
              type="button"
              onClick={() => setYear(1)}
              disabled={pending}
              className="size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background"
              aria-label="Próximo ano"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : isMatrizMonth ? (
          <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setMonth(-1)}
              disabled={pending}
              className="size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <Select
              value={String(month)}
              onValueChange={(v) => {
                if (!v) return;
                const params = new URLSearchParams(search);
                params.set("month", v);
                params.set("year", String(year));
                if (!params.get("view")) params.set("view", view ?? "mes");
                startTransition(() => router.push(`/matriz?${params.toString()}`));
              }}
              disabled={pending}
            >
              <SelectTrigger className="h-8 px-3 border-0 bg-transparent focus:ring-0 shadow-none gap-1 font-semibold text-sm">
                <SelectValue>
                  <span className="tabular-nums">
                    {MONTHS_PT_LONG[month - 1].slice(0, 3)} {year}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {MONTHS_PT_LONG.map((label, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {label} {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => setMonth(1)}
              disabled={pending}
              className="size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background"
              aria-label="Próximo mês"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Link
              href="/acessos"
              className="size-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Acessos"
            >
              <Users className="size-4" />
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="size-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Sair"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
