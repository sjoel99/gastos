"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTHS_PT_LONG } from "@/lib/dates";

type View = "mes" | "calendario" | "grafico" | "ano";

const HIDE_MONTH_SELECTOR: View[] = ["ano", "grafico"];

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

  const setParam = (k: string, v: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(k, v);
    startTransition(() => router.push(`/matriz?${params.toString()}`));
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => year - 2 + i);

  // No mobile o seletor de mês fica no MobileTopBar.
  return (
    <div className="hidden md:flex px-4 sm:px-6 pt-4 items-center gap-2">
      {!HIDE_MONTH_SELECTOR.includes(view) ? (
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
  );
}
