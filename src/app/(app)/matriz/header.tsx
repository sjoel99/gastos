"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTHS_PT_LONG, addMonths } from "@/lib/dates";

type View = "mes" | "calendario" | "grafico" | "ano";

const HIDE_MONTH_SELECTOR: View[] = ["ano", "grafico"];

const VIEW_TITLE: Record<View, string> = {
  mes: "Mês",
  calendario: "Calendário",
  grafico: "Gráfico anual",
  ano: "Matriz anual",
};

export function MatrizFilters({
  view,
  year,
  month,
}: {
  view: View;
  year: number;
  month: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const push = (params: URLSearchParams) =>
    startTransition(() => router.push(`/matriz?${params.toString()}`));

  const setParam = (k: string, v: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(k, v);
    push(params);
  };

  const stepMonth = (delta: number) => {
    const next = addMonths({ year, month }, delta);
    const params = new URLSearchParams(searchParams);
    params.set("year", String(next.year));
    params.set("month", String(next.month));
    push(params);
  };

  const stepYear = (delta: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", String(year + delta));
    push(params);
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => year - 2 + i);
  const showMonthSelector = !HIDE_MONTH_SELECTOR.includes(view);
  const stepFn = showMonthSelector ? stepMonth : stepYear;
  const labelMonth = showMonthSelector
    ? `${MONTHS_PT_LONG[month - 1]} ${year}`
    : String(year);

  return (
    <div className="hidden md:flex px-6 lg:px-8 pt-6 pb-2 max-w-6xl w-full mx-auto items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{VIEW_TITLE[view]}</h1>
        <p className="text-sm text-muted-foreground capitalize tabular-nums">
          {labelMonth}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-muted rounded-full p-0.5">
          <button
            type="button"
            onClick={() => stepFn(-1)}
            disabled={pending}
            className="size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background"
            aria-label={showMonthSelector ? "Mês anterior" : "Ano anterior"}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => stepFn(1)}
            disabled={pending}
            className="size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background"
            aria-label={showMonthSelector ? "Próximo mês" : "Próximo ano"}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {showMonthSelector ? (
          <Select
            value={String(month)}
            onValueChange={(v) => v && setParam("month", v)}
            disabled={pending}
          >
            <SelectTrigger className="w-36">
              <SelectValue>{MONTHS_PT_LONG[month - 1]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MONTHS_PT_LONG.map((label, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Select
          value={String(year)}
          onValueChange={(v) => v && setParam("year", v)}
          disabled={pending}
        >
          <SelectTrigger className="w-28">
            <SelectValue>{year}</SelectValue>
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
    </div>
  );
}
