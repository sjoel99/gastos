// Importa lançamentos da planilha "Gastos Mensais.xlsx" para o banco.
// Uso: node --env-file=.env scripts/import-xlsx.mjs
//
// - Cria expense_line por nome exato (sem fundir variações).
// - Histórico (<= mês atual) entra como actual + paid_at; futuro como projected.
// - is_archived NÃO é setado automaticamente — fica para o usuário decidir.
//   A visibilidade no mês é controlada pela presença de monthly_entry > 0.
// - Re-executável: faz UPSERT.

import postgres from "postgres";
import XLSX from "/tmp/xlsx-tools/node_modules/xlsx/xlsx.js";

const XLSX_PATH = "/Users/joelsantos/Desenvolvimento/pessoal/gastos/Gastos Mensais.xlsx";

// Cabeçalhos / linhas que NÃO são despesas — são receitas, saldos ou totalizadores.
const SKIP_NAMES = new Set([
  "TOTAL",
  "Total",
  "Total Mês",
  "Reserva P/ Amortizar",
  "Saldo Mês (Último dia)",
  "Rendimento",
  "Livre Mês",
  "Custo de Vida",
  "Despesa", // header da Saúde - 2024
  "Orçamento",
  "Diferença",
  "Acumulado",
  // receitas
  "Joel - Pró-labore",
  "Joel - Dividendos",
  "Venda - Verde",
  "Aluguel - Sobrado",
  "Salário Joel",
  "Salário Vivi",
  "Salário",
  "Aluguel Maceió",
  "Aluguel Petropólis",
  "Aluguel 909 B",
  "Airbnb 911A",
  "Dividendos",
  "Swile",
  "Swile/Reembolso",
  // saldos / acumulados
  "Investimento (Saldo)",
  "Progresso (Saldo)",
  "Saldo Carteira (B3)",
]);

const SHEETS = ["2026", "2025", "2024", "2023", "2022", "Saúde - 2024"];

const TODAY = { year: 2026, month: 4 }; // ancorado em abril/2026 (mês corrente)
const ymInt = ({ year, month }) => year * 100 + month;
const TODAY_INT = ymInt(TODAY);

function excelSerialToYM(n) {
  const ms = (n - 25569) * 86400 * 1000;
  const d = new Date(ms);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function toCents(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

function endOfMonthUTC(year, month) {
  // último dia do mês em UTC
  return new Date(Date.UTC(year, month, 0, 12, 0, 0));
}

function parseSheet(ws, sheetName) {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
  if (data.length === 0) return { months: [], rows: [] };

  const header = data[0];
  // Detectar coluna "Venc."
  let firstMonthCol = 1;
  let dueDayCol = -1;
  if (header[1] === "Venc.") {
    dueDayCol = 1;
    firstMonthCol = 2;
  }

  // Detectar ano da sheet
  let sheetYear = null;
  const m = sheetName.match(/(\d{4})/);
  if (m) sheetYear = Number(m[1]);

  // Mapear coluna -> {year, month} a partir do cabeçalho.
  const months = [];
  for (let c = firstMonthCol; c < header.length; c++) {
    const v = header[c];
    if (typeof v !== "number") continue;
    const ym = excelSerialToYM(v);
    if (sheetYear !== null && ym.year !== sheetYear) continue; // ignora col fora do ano
    months.push({ col: c, ...ym });
  }

  const rows = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const name = row[0];
    if (name === null || name === undefined) continue;
    const trimmed = String(name).trim();
    if (trimmed === "") continue;
    if (SKIP_NAMES.has(trimmed)) continue;

    let dueDay = null;
    if (dueDayCol >= 0) {
      const v = row[dueDayCol];
      if (typeof v === "number" && v >= 1 && v <= 31) dueDay = Math.round(v);
    }

    const cells = [];
    for (const m of months) {
      const cents = toCents(row[m.col]);
      if (cents === null) continue;
      if (cents === 0) continue;
      // Valor negativo na planilha = "pago no cartão" (hack legado).
      // Convertemos para valor absoluto + flag paid_with_card.
      const isCard = cents < 0;
      cells.push({
        year: m.year,
        month: m.month,
        cents: Math.abs(cents),
        paidWithCard: isCard,
      });
    }

    if (cells.length === 0) continue;

    rows.push({ name: trimmed, dueDay, cells });
  }

  return { months, rows };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL não definido.");
    process.exit(1);
  }

  console.log(`Lendo ${XLSX_PATH}...`);
  const wb = XLSX.readFile(XLSX_PATH);

  // Coleta consolidada por nome
  const byName = new Map(); // name -> { dueDay, lastYM, entries: [{year, month, cents}] }

  for (const sheetName of SHEETS) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const { rows } = parseSheet(ws, sheetName);
    console.log(`  ${sheetName}: ${rows.length} despesas com lançamentos`);
    for (const r of rows) {
      const cur = byName.get(r.name) ?? {
        dueDay: r.dueDay,
        lastYM: 0,
        entries: [],
      };
      // Atualiza dueDay se ainda não tinha
      if (cur.dueDay === null && r.dueDay !== null) cur.dueDay = r.dueDay;
      // Última aparição
      for (const c of r.cells) {
        const yi = ymInt(c);
        if (yi > cur.lastYM) cur.lastYM = yi;
        cur.entries.push(c);
      }
      byName.set(r.name, cur);
    }
  }

  console.log(`\nTotal de despesas únicas: ${byName.size}`);
  console.log(
    `Total de lançamentos: ${[...byName.values()].reduce((s, x) => s + x.entries.length, 0)}`,
  );

  const sql = postgres(url, { max: 1 });

  let createdLines = 0;
  let upsertedEntries = 0;

  try {
    for (const [name, info] of byName) {
      const dueDay = info.dueDay ?? 5;

      // Upsert expense_line por nome (sem mexer em is_archived)
      const existing = await sql`
        SELECT id, due_day FROM expense_line WHERE name = ${name} LIMIT 1
      `;
      let lineId;
      if (existing.length > 0) {
        lineId = existing[0].id;
        await sql`
          UPDATE expense_line
          SET due_day = ${dueDay}, updated_at = now()
          WHERE id = ${lineId}
        `;
      } else {
        const inserted = await sql`
          INSERT INTO expense_line (name, due_day, is_archived, default_projected_cents)
          VALUES (${name}, ${dueDay}, false, 0)
          RETURNING id
        `;
        lineId = inserted[0].id;
        createdLines++;
      }

      // Upsert monthly_entries
      for (const c of info.entries) {
        const yi = ymInt(c);
        const isHistory = yi <= TODAY_INT;
        const projected = c.cents;
        const actual = isHistory ? c.cents : null;
        const paidAt = isHistory ? endOfMonthUTC(c.year, c.month) : null;
        const paidWithCard = c.paidWithCard ?? false;

        await sql`
          INSERT INTO monthly_entry (line_id, year, month, projected_cents, actual_cents, paid_at, paid_with_card, updated_at)
          VALUES (${lineId}, ${c.year}, ${c.month}, ${projected}, ${actual}, ${paidAt}, ${paidWithCard}, now())
          ON CONFLICT (line_id, year, month) DO UPDATE SET
            projected_cents = EXCLUDED.projected_cents,
            actual_cents = EXCLUDED.actual_cents,
            paid_at = EXCLUDED.paid_at,
            paid_with_card = EXCLUDED.paid_with_card,
            updated_at = now()
        `;
        upsertedEntries++;
      }
    }
  } finally {
    await sql.end();
  }

  console.log(`\nResumo:`);
  console.log(`  Despesas criadas: ${createdLines}`);
  console.log(`  Lançamentos importados (upsert): ${upsertedEntries}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
