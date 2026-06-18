<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project conventions (ContaLeve — Landing)

Este projeto **já foi** o app de finanças web (Next.js + PostgreSQL + Auth.js).
Em 2026-06-18 a parte de planilha foi **aposentada** (o app vive no Android e iOS)
e o projeto virou a **landing/suporte do ContaLeve**. O histórico está no git.

- **É um site estático**: sem banco, sem login, sem cron, sem Server Actions.
  Não reintroduzir Auth.js, Drizzle/Postgres ou rotas de API sem combinar antes —
  a proposta é um site de marketing + privacidade.
- **Idioma**: pt-BR em toda a copy e comentários. Acentuar normalmente.
- **Marca**: ContaLeve, violeta (`--primary` ≈ `#5d2ca8`); tagline "Suas contas,
  sem peso." Tokens de cor em `globals.css`.
- **Rotas**: `/` (landing, `src/app/page.tsx`) e `/privacy` (linkada na Play Store
  — não quebrar a URL `https://contaleve.sjoel99.com/privacy`).
- **Componentes da landing**: `src/components/landing/` (phone-mockup, store-badges).
  Primitivos shadcn em `src/components/ui/`.
- **`public/announcements.json`**: consumida pelo banner in-app do app **Android**.
  **Não remover.** Publicar novidade = editar o arquivo (mudar o `id`!) + rebuild.
- **Build/dev**: Next 16 standalone. `params`/`searchParams` são `Promise` (usar
  `await`). Deploy via `docker compose up -d --build` (só o serviço `app`).
- **Lojas**: Play Store ao vivo (`com.sjoel99.contaleve`); App Store ainda "em
  breve" no `store-badges.tsx` — trocar pelo link quando o iOS publicar.
