# ContaLeve — Landing

Landing page e suporte do **ContaLeve** — o app de controle financeiro da família
(Android e iPhone). Site estático que apresenta o app, leva às lojas e hospeda a
política de privacidade.

> **Histórico**: este projeto já foi o app de finanças web (Next.js + PostgreSQL +
> Auth.js). Com o [app Android](../gastos-android) e o [iOS](../gastos-ios) maduros,
> a parte de planilha foi **aposentada** (2026-06-18) e o projeto virou só a
> landing. O histórico do app vive no git.

**Stack**: Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui. **100% estático** —
sem banco, sem login, sem cron.

## Rotas

| Rota | Função |
| --- | --- |
| `/` | Landing — hero, features, badges das lojas, mockup do app |
| `/privacy` | Política de privacidade do ContaLeve (linkada na Play Store) |
| `/manifest.webmanifest`, `/icon`, `/apple-icon` | Metadados/ícones |

## Estrutura

```
src/
  app/
    page.tsx            ← landing
    privacy/page.tsx    ← política de privacidade
    layout.tsx · globals.css · manifest.ts · icon.tsx · apple-icon.tsx
  components/
    landing/            ← phone-mockup, store-badges
    ui/ (shadcn)
  lib/utils.ts
public/
  announcements.json    ← consumida pelo banner in-app do app Android (NÃO remover)
```

## Desenvolvimento local

Pré-requisitos: **Node 20.9+** (Next 16 não suporta Node 18) e **pnpm 10**.

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

## Deploy via Docker Compose

Imagem Next standalone, estática. Sem variáveis de ambiente obrigatórias.

```bash
docker compose up -d --build
```

Servida em `contaleve.sjoel99.com` via Cloudflare Tunnel (DNS + TLS pela
Cloudflare; aponta para `http://<host>:3000`).

### Atualizar em produção

```bash
git pull
docker compose up -d --build
```

## Anúncios in-app (banner do Android)

`public/announcements.json` alimenta o banner de novidades do app Android. Para
publicar uma novidade: edite o arquivo (**mude o `id`!**), faça push e
reconstrua a imagem (o `public/` é embutido no build standalone).
