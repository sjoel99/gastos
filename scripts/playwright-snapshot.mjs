// Conecta ao Chromium aberto pelo playwright-open.mjs (via CDP em :9222)
// e tira um screenshot da página atual.
//
// Uso: node scripts/playwright-snapshot.mjs

import { chromium } from "playwright";

const browser = await chromium.connectOverCDP("http://localhost:9222");
const ctx = browser.contexts()[0];
if (!ctx) {
  console.error("✗ Nenhum contexto encontrado.");
  process.exit(1);
}
const page = ctx.pages()[0];
if (!page) {
  console.error("✗ Nenhuma página encontrada.");
  process.exit(1);
}

const path = process.env.OUT ?? "/tmp/inspect.png";
await page.screenshot({ path, fullPage: true });
console.log(`→ screenshot: ${path}`);
console.log(`→ url: ${page.url()}`);
console.log(`→ size: ${(await page.evaluate(() => `${innerWidth}x${innerHeight}`))}`);
await browser.close();
