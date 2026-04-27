import { listExpenseLines } from "@/db/queries";
import { ExpenseLineRow } from "./expense-line-row";
import { AddExpenseButton } from "./add-expense-button";
import { SearchInput } from "./search-input";

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim().toLowerCase();
  const allLines = await listExpenseLines({ includeArchived: true });

  const filterByQuery = (l: (typeof allLines)[number]) => {
    if (!query) return true;
    const haystack = `${l.name} ${l.category ?? ""}`.toLowerCase();
    return haystack.includes(query);
  };

  const active = allLines.filter((l) => !l.isArchived && filterByQuery(l));
  const archived = allLines.filter((l) => l.isArchived && filterByQuery(l));
  const totalActive = allLines.filter((l) => !l.isArchived).length;
  const totalArchived = allLines.filter((l) => l.isArchived).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="hidden md:block text-2xl font-semibold tracking-tight">
            Itens recorrentes
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalActive} {totalActive === 1 ? "ativa" : "ativas"}
            {totalArchived > 0 ? ` · ${totalArchived} arquivadas` : ""}
            {query ? ` · ${active.length + archived.length} resultados` : ""}
          </p>
        </div>
        <AddExpenseButton />
      </div>

      <SearchInput initial={query} />

      <section className="flex flex-col gap-2">
        {active.length === 0 && !query ? (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma despesa ainda. Toque em <strong>+</strong> para começar.
            </p>
          </div>
        ) : active.length === 0 && query ? (
          <div className="border border-dashed rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma despesa ativa para &ldquo;{query}&rdquo;.
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
            Arquivadas ({archived.length})
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
