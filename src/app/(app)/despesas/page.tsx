import { listExpenseLines } from "@/db/queries";
import { ExpenseLineRow } from "./expense-line-row";
import { AddExpenseButton } from "./add-expense-button";

export default async function DespesasPage() {
  const lines = await listExpenseLines({ includeArchived: true });
  const active = lines.filter((l) => !l.isArchived);
  const archived = lines.filter((l) => l.isArchived);

  return (
    <div className="p-4 sm:p-6 max-w-2xl w-full mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="hidden md:block text-2xl font-semibold tracking-tight">
            Itens recorrentes
          </h1>
          <p className="text-sm text-muted-foreground">
            {active.length} {active.length === 1 ? "ativa" : "ativas"}
            {archived.length > 0 ? ` · ${archived.length} arquivadas` : ""}
          </p>
        </div>
        <AddExpenseButton />
      </div>

      <section className="flex flex-col gap-2">
        {active.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma despesa ainda. Toque em <strong>+</strong> para começar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {active.map((l) => (
              <ExpenseLineRow key={l.id} line={l} />
            ))}
          </div>
        )}
      </section>

      {archived.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase px-1">
            Arquivadas
          </h2>
          <div className="flex flex-col gap-2 opacity-70">
            {archived.map((l) => (
              <ExpenseLineRow key={l.id} line={l} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
