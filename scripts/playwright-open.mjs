// Abre o app autenticado em uma janela visível (não-headless) para inspeção
// manual em desktop. Mantém a janela aberta até o user fechar.
//
// Uso:
//   node scripts/playwright-open.mjs
//   BASE_URL=http://localhost:3001 VIEW=/matriz?view=calendario node scripts/playwright-open.mjs

import { chromium } from "playwright";
import fs from "node:fs";

const EMAIL = process.env.LOGIN_EMAIL;
const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const DEV_LOG = process.env.DEV_LOG;
if (!EMAIL) {
  console.error("LOGIN_EMAIL não definido.");
  process.exit(1);
}
const TARGET = process.env.VIEW ?? "/matriz?view=calendario&year=2026&month=4";
const WIDTH = Number(process.env.W ?? 1440);
const HEIGHT = Number(process.env.H ?? 900);

function readMagicLink() {
  if (!DEV_LOG && fs.existsSync(DEV_LOG)) return null;
  const text = fs.readFileSync(DEV_LOG, "utf-8");
  const matches = [...text.matchAll(/link:\s+(http[^\s]+)/g)];
  return matches.length > 0 ? matches[matches.length - 1][1] : null;
}

const browser = await chromium.launch({
  headless: false,
  args: ["--remote-debugging-port=9222"],
});
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
});
const page = await ctx.newPage();

console.log(`→ login com ${EMAIL}`);
const sizeBefore = DEV_LOG && fs.existsSync(DEV_LOG) ? fs.statSync(DEV_LOG).size : 0;
await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', EMAIL);
await page.click('button[type="submit"]');
await page.waitForLoadState("networkidle");

let link = null;
for (let i = 0; i < 30 && !link; i++) {
  await new Promise((r) => setTimeout(r, 250));
  if (DEV_LOG && fs.existsSync(DEV_LOG) && fs.statSync(DEV_LOG).size > sizeBefore) {
    link = readMagicLink();
  }
}
if (!link) {
  console.error("✗ Magic link não encontrado em DEV_LOG=" + DEV_LOG);
  await browser.close();
  process.exit(1);
}

await page.goto(link, { waitUntil: "networkidle" });
await page.goto(`${BASE}${TARGET}`, { waitUntil: "networkidle" });
console.log(`→ aberto em ${BASE}${TARGET} (${WIDTH}x${HEIGHT})`);
console.log("Feche a janela para encerrar.");

// Mantém vivo até o user fechar a janela
await new Promise((resolve) => {
  page.on("close", resolve);
  ctx.on("close", resolve);
  browser.on("disconnected", resolve);
});
await browser.close().catch(() => {});
