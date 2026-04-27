import { ImportForm } from "./import-form";

export default function ImportarPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl w-full mx-auto flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="hidden md:block text-2xl font-semibold tracking-tight">
          Importar planilha
        </h1>
        <p className="text-sm text-muted-foreground">
          Sobe um arquivo da planilha &ldquo;Gastos Mensais&rdquo;. Despesas
          existentes são atualizadas (UPSERT por nome) — nada é apagado.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
        <ImportForm />
      </div>

      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer font-medium">
          Como o arquivo é interpretado
        </summary>
        <ul className="mt-3 space-y-1.5 list-disc pl-5">
          <li>
            Cada aba com nome de ano (2022, 2023…) é processada. A primeira
            coluna é o nome da despesa.
          </li>
          <li>
            Se houver coluna <strong>Venc.</strong> na segunda posição, o dia é
            usado como vencimento padrão.
          </li>
          <li>
            Demais colunas devem ter cabeçalho com data em formato Excel — uma
            por mês.
          </li>
          <li>
            Linhas até o mês corrente entram como <em>realizado</em> (pago);
            futuras entram apenas como <em>previsto</em>.
          </li>
          <li>
            Valor negativo é interpretado como &ldquo;pago no cartão&rdquo;
            (legado da planilha) — convertido em valor absoluto + flag.
          </li>
          <li>
            Receitas e totalizadores comuns (Salário, TOTAL, Saldo etc.) são
            ignorados automaticamente.
          </li>
        </ul>
      </details>
    </div>
  );
}
