"use client";

import { useActionState, useState } from "react";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importXlsxAction, type ImportFormState } from "./actions";

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportFormState, FormData>(
    importXlsxAction,
    undefined,
  );
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent/30 transition-colors">
        <Upload className="size-6 text-muted-foreground" />
        <span className="text-sm font-medium">
          {fileName ?? "Selecionar planilha (.xlsx)"}
        </span>
        <span className="text-xs text-muted-foreground">
          Até 10 MB. Abas com nome de ano (2022, 2023…) são reconhecidas.
        </span>
        <input
          type="file"
          name="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      <Button type="submit" disabled={pending} className="h-11">
        {pending ? "Importando..." : "Importar"}
      </Button>

      {state?.ok === true ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="size-5" />
            Importação concluída
          </div>
          <ul className="text-sm text-emerald-900 dark:text-emerald-200 grid grid-cols-2 gap-x-4 gap-y-1">
            <li>Despesas únicas</li>
            <li className="tabular-nums font-medium">
              {state.summary.uniqueLines}
            </li>
            <li>Despesas criadas</li>
            <li className="tabular-nums font-medium">
              {state.summary.createdLines}
            </li>
            <li>Lançamentos (upsert)</li>
            <li className="tabular-nums font-medium">
              {state.summary.upsertedEntries}
            </li>
            <li>Categorizadas</li>
            <li className="tabular-nums font-medium">
              {state.summary.categorized}
            </li>
            <li>Total de células</li>
            <li className="tabular-nums font-medium">
              {state.summary.totalCells}
            </li>
          </ul>
          {state.summary.sheetsProcessed.length > 0 ? (
            <details className="text-xs text-emerald-900/80 dark:text-emerald-200/80 mt-1">
              <summary className="cursor-pointer">Abas processadas</summary>
              <ul className="mt-2 space-y-0.5">
                {state.summary.sheetsProcessed.map((s) => (
                  <li key={s.name} className="tabular-nums">
                    {s.name}: {s.rows} despesas
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}

      {state?.ok === false ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 p-4 flex items-start gap-2 text-rose-700 dark:text-rose-300">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <span className="text-sm">{state.error}</span>
        </div>
      ) : null}
    </form>
  );
}
