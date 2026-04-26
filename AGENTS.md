<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project conventions (Gastos)

- **Idioma**: pt-BR no código de UI (labels, mensagens, comentários quando necessários).
- **Dinheiro**: armazenar em centavos como `integer` no DB; formatar com helpers em `src/lib/money.ts` (BRL).
- **Datas**: usar helpers de `src/lib/dates.ts` para mês/ano em PT.
- **Workspace único**: não há multi-tenancy — todos os usuários autenticados veem os mesmos dados. Não adicionar `workspace_id` em queries.
- **Auth**: e-mails permitidos vêm de `ALLOWED_EMAILS` (env). O callback `signIn` em `src/auth.ts` bloqueia o resto.
- **Server Actions**: ficam ao lado da página (`actions.ts`), com schema Zod no topo. Sempre revalidar `/matriz` e `/saldo` quando relevante.
- **Forms**: usar `useActionState` (React 19) — não `useFormState` (deprecated).
- **Next 16 gotchas já tratados**:
  - `params`/`searchParams` em pages são `Promise<…>` — usar `await`.
  - Middleware → `src/proxy.ts` exportando função `proxy`.
  - `revalidateTag` precisa de segundo arg `cacheLife` quando for usado.
- **Pago com cartão**: `monthly_entry.paid_with_card` (e `expense_line.default_paid_with_card` como default) marca itens já contidos na fatura. Linhas com a flag são exibidas, mas excluídas do total mensal — aparece um subtotal "no cartão" separado. Não usar valor negativo para esse caso (era o hack antigo). Valores negativos legados continuam sendo renderizados em vermelho por compat.
- **Versionamento de valor**: para alterar o valor de uma despesa "a partir do mês X em diante", usar `applyValueFromMonth` em `src/db/queries.ts`. Ela grava em `expense_line_value` e atualiza `monthly_entry.projected_cents` apenas para meses ainda não pagos (`paid_at IS NULL AND actual_cents IS NULL`). UI: botão "Aplicar a partir deste mês em diante" no `cell-editor`.
- **Mobile-first**: layout principal usa `BottomNav` (`md:hidden`) + `MobileTopBar` (`md:hidden`) e `AppHeader` desktop (`hidden md:block`). Utilitários safe-area em `globals.css`: `pb-safe`, `pt-safe`, `mb-safe`. Targets de toque ≥ 44px (`h-11` em inputs, `min-h-14` em rows).
- **MVP**: não construir importação de fatura, gráficos, ou histórico detalhado. Esses ficam pra v2 (ver README).
