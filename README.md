# Gastos

Controle de gastos mensais da família. PWA mobile-first, autenticação por magic link, com aviso diário por e-mail e push.

**Stack**: Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · PostgreSQL · Drizzle ORM · Auth.js (Resend) · web-push.

## Funcionalidades

- **Mês** — lista de despesas do mês, com hero card mostrando total/pago/falta e chip de "no cartão". Banner destacado quando há vencimento no dia.
- **Calendário** — grade mensal com chips coloridos por categoria; toque num dia abre a lista do dia.
- **Gráfico** — visão anual em barras (pago/pendente/cartão) + lista detalhada mês a mês.
- **Itens** — CRUD de despesas recorrentes; criar com mês de início + número de repetições (ou mensal contínuo por 60 meses); arquivar/restaurar.
- **Acessos** — gerenciar e-mails autorizados pela UI (sem editar `.env` cada vez).
- **Cell editor** — bottom sheet com valor + dia de vencimento; cada um pode ser aplicado só ao mês ou "daqui em diante" (snapshot do passado, propaga futuro não pago).
- **Confirmar pagamento** — dialog que valida o valor pago; se diferente do previsto, pergunta se aplica nos meses futuros.
- **Pago no cartão** — flag por entrada (e default por despesa); abate do total mensal e marca a linha visualmente.
- **Avisos diários às 9h** (timezone São Paulo) — e-mail via Resend + push notification PWA pra cada subscriber.
- **PWA instalável**, com service worker pra receber push.

## Modelo de dados

| Tabela | Função |
| --- | --- |
| `expense_line` | Despesa recorrente (nome, dia padrão, valor padrão, flag `default_paid_with_card`) |
| `expense_line_value` | Histórico de versões de valor (alimentado por "aplicar daqui em diante") |
| `monthly_entry` | Lançamento de um mês (`projected_cents`, `actual_cents`, `paid_at`, `paid_with_card`, `due_day` override opcional) |
| `allowed_email` | Lista de e-mails que podem fazer login (gerenciada pela UI) |
| `push_subscription` | Subscriptions de push notification por usuário |
| `user / account / session / verificationToken` | Auth.js padrão |

Workspace único: todos os usuários autorizados veem os mesmos dados.

## Estrutura

```
src/
  app/
    (app)/                 ← rotas autenticadas
      matriz/              ← Mês / Calendário / Gráfico / Ano
      despesas/            ← Itens (CRUD)
      acessos/             ← gerenciar e-mails autorizados
    api/
      auth/[...nextauth]/  ← Auth.js handlers
      cron/daily-reminder/ ← endpoint do cron (token-protected)
      push/subscribe/      ← (un)subscribe push
    sign-in/
  components/
    app-header, mobile-top-bar, bottom-nav
    cell-editor, confirm-payment-dialog, enable-notifications
    ui/ (shadcn)
  db/         schema.ts · queries.ts · client.ts · migrate.mjs
  lib/        money · dates · categories · expense-icons · push · allowed-emails
  auth.ts · env.ts · proxy.ts
drizzle/      migrations
public/sw.js  service worker
scripts/      setup-secrets.sh · import-xlsx.mjs · playwright-inspect.mjs
```

## Desenvolvimento local

Pré-requisitos: **Node 20.9+** (Next 16 não suporta Node 18) e **pnpm 10**.

```bash
pnpm install
docker compose up -d db          # só o Postgres
cp .env.example .env             # editar AUTH_SECRET, RESEND_API_KEY, ALLOWED_EMAILS, etc.
./scripts/setup-secrets.sh       # gera AUTH_SECRET + CRON_SECRET + VAPID e imprime; cole no .env
pnpm db:migrate
pnpm dev                          # http://localhost:3000
```

Magic link em dev é impresso no terminal do `pnpm dev` (não precisa de Resend funcional).

### Scripts

| comando | descrição |
| --- | --- |
| `pnpm dev` | dev server (Turbopack) |
| `pnpm build` / `pnpm start` | build e start de produção |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | gera migration do schema |
| `pnpm db:migrate` | aplica migrations |
| `pnpm db:studio` | Drizzle Studio |
| `./scripts/setup-secrets.sh` | imprime bloco `.env` com AUTH/CRON/VAPID gerados |
| `node --env-file=.env scripts/import-xlsx.mjs` | importa planilha "Gastos Mensais.xlsx" pra base |
| `node scripts/playwright-inspect.mjs` | smoke test via Playwright (login + scrape da view Mês) |

## Deploy via Docker Compose

A imagem do app aplica as migrations no startup (`entrypoint.sh`). O serviço `cron` dispara `/api/cron/daily-reminder` às 9h (America/Sao_Paulo).

### 1. Pré-requisitos no servidor

- Docker + Docker Compose
- DNS apontando o subdomínio para o servidor (ou Cloudflare Tunnel)
- Conta Resend com domínio verificado (pra magic link e aviso diário)

### 2. No servidor

```bash
git clone <repo> gastos
cd gastos

# 1. Gere segredos e popule o .env
cp .env.example .env
./scripts/setup-secrets.sh           # imprime AUTH_SECRET, CRON_SECRET, VAPID — cole no .env
$EDITOR .env                          # ajuste AUTH_URL, RESEND_API_KEY, EMAIL_FROM, ALLOWED_EMAILS, POSTGRES_PASSWORD

# 2. Suba os 3 serviços
docker compose up -d --build

# Logs:
docker compose logs -f app
docker compose logs -f cron
```

O `entrypoint.sh` roda as migrations automaticamente antes de subir o servidor Next.

### 3. .env de produção (campos obrigatórios)

```env
# Postgres (DATABASE_URL é montada automaticamente pelo compose com estes valores)
POSTGRES_USER=gastos
POSTGRES_PASSWORD=<senha forte>
POSTGRES_DB=gastos

# Auth.js
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://gastos.seu-dominio.com
AUTH_TRUST_HOST=true

# Resend (magic link e aviso diário)
RESEND_API_KEY=re_...
EMAIL_FROM="Gastos <no-reply@seu-dominio.com>"

# Lista inicial de e-mails (depois você gerencia em /acessos)
ALLOWED_EMAILS=joel@...,vivi@...

# Push (npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:joel@...

# Cron daily reminder (openssl rand -hex 32)
CRON_SECRET=...
```

`./scripts/setup-secrets.sh` gera as 4 chaves de segurança de uma vez.

### 4. Cloudflare Tunnel (opcional)

Em Zero Trust → Networks → Tunnels, adicione um Public Hostname:

- Subdomain: `gastos`
- Domain: seu domínio
- Service: `http://<host-do-app>:3000`

Cloudflare cuida de DNS + TLS. Sem necessidade de Caddy/Nginx local.

### 5. Portainer (opcional)

Importe o `docker-compose.yml` como Stack e cole o conteúdo do `.env` em Environment variables. As migrations rodam sozinhas.

## Atualizar em produção

```bash
git pull
docker compose up -d --build       # reconstrói app, mantém db
```

Migrations novas rodam automaticamente no entrypoint.

## Notas Next 16

- `params`/`searchParams` em pages são `Promise` (usar `await`)
- `middleware.ts` virou `proxy.ts` exportando `proxy`
- `useFormState` virou `useActionState` (React 19)
- Turbopack é default em `dev`/`build`
