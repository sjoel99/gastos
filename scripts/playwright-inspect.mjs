import { chromium } from "playwright";
import fs from "node:fs";

const EMAIL = process.env.LOGIN_EMAIL;
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const DEV_LOG = process.env.DEV_LOG;
if (!EMAIL) {
  console.error("LOGIN_EMAIL não definido.");
  process.exit(1);
}

function readMagicLinkFromDevLog() {
  if (!DEV_LOG || !fs.existsSync(DEV_LOG)) return null;
  const text = fs.readFileSync(DEV_LOG, "utf-8");
  // Pega o ÚLTIMO link emitido
  const matches = [...text.matchAll(/link:\s+(http[^\s]+)/g)];
  return matches.length > 0 ? matches[matches.length - 1][1] : null;
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

console.log("→ /sign-in...");
await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });

// Marca posição do log antes do submit pra pegar o link novo
const sizeBefore = fs.existsSync(DEV_LOG) ? fs.statSync(DEV_LOG).size : 0;

await page.fill('input[name="email"]', EMAIL);
await page.click('button[type="submit"]');
await page.waitForLoadState("networkidle");

// Espera o link aparecer
let link = null;
for (let i = 0; i < 20 && !link; i++) {
  await new Promise((r) => setTimeout(r, 250));
  if (fs.existsSync(DEV_LOG) && fs.statSync(DEV_LOG).size > sizeBefore) {
    link = readMagicLinkFromDevLog();
  }
}
if (!link) {
  console.error("✗ Magic link não encontrado.");
  await browser.close();
  process.exit(1);
}
console.log("→ link OK");

await page.goto(link, { waitUntil: "networkidle" });
await page.goto(`${BASE}/matriz?view=mes&year=2026&month=4`, {
  waitUntil: "networkidle",
});

await page.screenshot({ path: "/tmp/inspect-mes.png", fullPage: true });
console.log("→ screenshot: /tmp/inspect-mes.png");

// Extrair: total do mês (texto do hero), valor do chip cartão, e lista de itens com seus valores
const data = await page.evaluate(() => {
  const card = document.querySelector(".bg-gradient-to-br");
  const total = card?.querySelector(
    "span.text-\\[34px\\], span.text-\\[40px\\]",
  )?.textContent;
  const chip = card?.querySelector(".bg-white\\/15 .tabular-nums")?.textContent;

  const rows = [...document.querySelectorAll('[role="button"]')]
    .filter((el) => el.querySelector(".size-11.rounded-full"))
    .map((el) => {
      const name = el
        .querySelector(".font-medium .truncate, .font-medium > span:first-child")
        ?.textContent?.trim();
      const subtitle = el
        .querySelector(".text-xs.tabular-nums, .text-xs.text-emerald-600")
        ?.textContent?.trim();
      const valueEl = el.querySelector(".tabular-nums.font-semibold");
      const value = valueEl?.textContent?.trim();
      const isCardBg = el.classList.contains("bg-muted/40") ||
        el.className.includes("bg-muted/40");
      const hasCardIcon = !!el.querySelector(
        '[aria-label="Pago no cartão"], svg[data-lucide="credit-card"]',
      );
      return { name, subtitle, value, isCardBg, hasCardIcon };
    });

  return { total, chip, rows, count: rows.length };
});

console.log("\n=== HERO ===");
console.log("  Total:", data.total);
console.log("  Chip cartão:", data.chip ?? "(nenhum)");
console.log(`\n=== LISTA (${data.count} itens) ===`);
for (const r of data.rows) {
  const flags = [];
  if (r.isCardBg) flags.push("bg-muted");
  if (r.hasCardIcon) flags.push("ícone cartão");
  console.log(
    `  ${(r.name ?? "?").padEnd(22)} ${(r.subtitle ?? "").padEnd(16)} ${(r.value ?? "?").padStart(14)} ${flags.length ? "[" + flags.join(", ") + "]" : ""}`,
  );
}

await browser.close();
