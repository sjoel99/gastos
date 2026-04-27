import "server-only";

import * as XLSX from "xlsx";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { expenseLines, monthlyEntries } from "@/db/schema";

// Cabeçalhos / linhas que NÃO são despesas — receitas, saldos, totalizadores.
const SKIP_NAMES = new Set([
  "TOTAL",
  "Total",
  "Total Mês",
  "Reserva P/ Amortizar",
  "Saldo Mês (Último dia)",
  "Rendimento",
  "Livre Mês",
  "Custo de Vida",
  "Despesa",
  "Orçamento",
  "Diferença",
  "Acumulado",
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
  "Investimento (Saldo)",
  "Progresso (Saldo)",
  "Saldo Carteira (B3)",
]);

type ParsedCell = {
  year: number;
  month: number;
  cents: number;
  paidWithCard: boolean;
};
type ParsedRow = { name: string; dueDay: number | null; cells: ParsedCell[] };

function excelSerialToYM(n: number): { year: number; month: number } {
  const ms = (n - 25569) * 86400 * 1000;
  const d = new Date(ms);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function toCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

function endOfMonthUTC(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 12, 0, 0));
}

function parseSheet(
  ws: XLSX.WorkSheet,
  sheetName: string,
): { rows: ParsedRow[] } {
  const data = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
    raw: true,
  });
  if (data.length === 0) return { rows: [] };

  const header = data[0];
  let firstMonthCol = 1;
  let dueDayCol = -1;
  if (header[1] === "Venc.") {
    dueDayCol = 1;
    firstMonthCol = 2;
  }

  let sheetYear: number | null = null;
  const m = sheetName.match(/(\d{4})/);
  if (m) sheetYear = Number(m[1]);

  const months: { col: number; year: number; month: number }[] = [];
  for (let c = firstMonthCol; c < header.length; c++) {
    const v = header[c];
    if (typeof v !== "number") continue;
    const ym = excelSerialToYM(v);
    if (sheetYear !== null && ym.year !== sheetYear) continue;
    months.push({ col: c, ...ym });
  }

  const rows: ParsedRow[] = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const name = row[0];
    if (name === null || name === undefined) continue;
    const trimmed = String(name).trim();
    if (trimmed === "") continue;
    if (SKIP_NAMES.has(trimmed)) continue;

    let dueDay: number | null = null;
    if (dueDayCol >= 0) {
      const v = row[dueDayCol];
      if (typeof v === "number" && v >= 1 && v <= 31) dueDay = Math.round(v);
    }

    const cells: ParsedCell[] = [];
    for (const m of months) {
      const cents = toCents(row[m.col]);
      if (cents === null) continue;
      if (cents === 0) continue;
      // Valor negativo na planilha = "pago no cartão" (hack legado).
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

  return { rows };
}

export type ImportSummary = {
  uniqueLines: number;
  totalCells: number;
  createdLines: number;
  upsertedEntries: number;
  sheetsProcessed: { name: string; rows: number }[];
};

const ymInt = ({ year, month }: { year: number; month: number }) =>
  year * 100 + month;

export async function importFromXlsxBuffer(
  buffer: Buffer,
): Promise<ImportSummary> {
  const wb = XLSX.read(buffer, { type: "buffer" });

  // Anchora hoje pelo relógio do servidor — entries até o mês corrente
  // viram histórico (actual + paid_at), o resto vira projeção.
  const now = new Date();
  const todayInt = ymInt({
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
  });

  // Aceita qualquer aba que case com /^\d{4}$/ ou "Saúde - YYYY".
  const sheetNames = wb.SheetNames.filter(
    (n) => /^\d{4}$/.test(n) || /\d{4}/.test(n),
  );

  type Consolidated = {
    dueDay: number | null;
    entries: ParsedCell[];
  };
  const byName = new Map<string, Consolidated>();
  const sheetsProcessed: { name: string; rows: number }[] = [];

  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const { rows } = parseSheet(ws, sheetName);
    sheetsProcessed.push({ name: sheetName, rows: rows.length });
    for (const r of rows) {
      const cur = byName.get(r.name) ?? { dueDay: r.dueDay, entries: [] };
      if (cur.dueDay === null && r.dueDay !== null) cur.dueDay = r.dueDay;
      for (const c of r.cells) cur.entries.push(c);
      byName.set(r.name, cur);
    }
  }

  let createdLines = 0;
  let upsertedEntries = 0;

  for (const [name, info] of byName) {
    const dueDay = info.dueDay ?? 5;

    const existing = await db
      .select({ id: expenseLines.id })
      .from(expenseLines)
      .where(eq(expenseLines.name, name))
      .limit(1);

    let lineId: number;
    if (existing.length > 0) {
      lineId = existing[0].id;
      await db
        .update(expenseLines)
        .set({ dueDay, updatedAt: new Date() })
        .where(eq(expenseLines.id, lineId));
    } else {
      const inserted = await db
        .insert(expenseLines)
        .values({ name, dueDay, isArchived: false, defaultProjectedCents: 0 })
        .returning({ id: expenseLines.id });
      lineId = inserted[0].id;
      createdLines++;
    }

    for (const c of info.entries) {
      const yi = ymInt(c);
      const isHistory = yi <= todayInt;
      const projected = c.cents;
      const actual = isHistory ? c.cents : null;
      const paidAt = isHistory ? endOfMonthUTC(c.year, c.month) : null;

      await db
        .insert(monthlyEntries)
        .values({
          lineId,
          year: c.year,
          month: c.month,
          projectedCents: projected,
          actualCents: actual,
          paidAt,
          paidWithCard: c.paidWithCard,
        })
        .onConflictDoUpdate({
          target: [
            monthlyEntries.lineId,
            monthlyEntries.year,
            monthlyEntries.month,
          ],
          set: {
            projectedCents: projected,
            actualCents: actual,
            paidAt,
            paidWithCard: c.paidWithCard,
            updatedAt: sql`now()`,
          },
        });
      upsertedEntries++;
    }
  }

  const totalCells = [...byName.values()].reduce(
    (s, x) => s + x.entries.length,
    0,
  );

  return {
    uniqueLines: byName.size,
    totalCells,
    createdLines,
    upsertedEntries,
    sheetsProcessed,
  };
}
