import { and, asc, between, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "./client";
import {
  expenseLineValues,
  expenseLines,
  monthlyEntries,
  type ExpenseLine,
  type MonthlyEntry,
} from "./schema";
import { addMonths, type YearMonth } from "@/lib/dates";

export async function listExpenseLines(opts?: {
  includeArchived?: boolean;
}): Promise<ExpenseLine[]> {
  const where = opts?.includeArchived
    ? undefined
    : eq(expenseLines.isArchived, false);
  return db
    .select()
    .from(expenseLines)
    .where(where)
    .orderBy(
      asc(expenseLines.dueDay),
      asc(expenseLines.displayOrder),
      asc(expenseLines.id),
    );
}

/** Comparador numérico (yyyymm) entre dois year/month. */
function ymInt({ year, month }: YearMonth): number {
  return year * 100 + month;
}

export async function listMonthlyEntries(
  start: YearMonth,
  monthCount: number,
): Promise<MonthlyEntry[]> {
  const end = addMonths(start, monthCount - 1);
  const startInt = ymInt(start);
  const endInt = ymInt(end);
  return db
    .select()
    .from(monthlyEntries)
    .where(
      between(
        sql<number>`${monthlyEntries.year} * 100 + ${monthlyEntries.month}`,
        startInt,
        endInt,
      ),
    );
}

export async function getMonthlyEntry(
  lineId: number,
  year: number,
  month: number,
): Promise<MonthlyEntry | undefined> {
  const rows = await db
    .select()
    .from(monthlyEntries)
    .where(
      and(
        eq(monthlyEntries.lineId, lineId),
        eq(monthlyEntries.year, year),
        eq(monthlyEntries.month, month),
      ),
    )
    .limit(1);
  return rows[0];
}

export async function upsertMonthlyEntry(input: {
  lineId: number;
  year: number;
  month: number;
  projectedCents: number;
  actualCents: number | null;
  paidAt: Date | null;
  paidWithCard: boolean;
  dueDay: number | null;
  notes: string | null;
  updatedById: string | null;
}): Promise<void> {
  await db
    .insert(monthlyEntries)
    .values({
      lineId: input.lineId,
      year: input.year,
      month: input.month,
      projectedCents: input.projectedCents,
      actualCents: input.actualCents,
      paidAt: input.paidAt,
      paidWithCard: input.paidWithCard,
      dueDay: input.dueDay,
      notes: input.notes,
      updatedById: input.updatedById,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        monthlyEntries.lineId,
        monthlyEntries.year,
        monthlyEntries.month,
      ],
      set: {
        projectedCents: input.projectedCents,
        actualCents: input.actualCents,
        paidAt: input.paidAt,
        paidWithCard: input.paidWithCard,
        dueDay: input.dueDay,
        notes: input.notes,
        updatedById: input.updatedById,
        updatedAt: new Date(),
      },
    });
}

export async function applyDueDayFromMonth(input: {
  lineId: number;
  year: number;
  month: number;
  dueDay: number;
  oldLineDueDay: number;
}): Promise<void> {
  const targetInt = input.year * 100 + input.month;
  // 1) Snapshot do histórico: meses < target sem override herdavam a linha → cristaliza com o dueDay antigo.
  await db
    .update(monthlyEntries)
    .set({ dueDay: input.oldLineDueDay, updatedAt: new Date() })
    .where(
      and(
        eq(monthlyEntries.lineId, input.lineId),
        sql`${monthlyEntries.year} * 100 + ${monthlyEntries.month} < ${targetInt}`,
        isNull(monthlyEntries.dueDay),
      ),
    );
  // 2) Atualiza a linha com o novo dueDay.
  await db
    .update(expenseLines)
    .set({ dueDay: input.dueDay, updatedAt: new Date() })
    .where(eq(expenseLines.id, input.lineId));
  // 3) Limpa overrides em meses ≥ target não pagos para herdarem o novo dueDay.
  await db
    .update(monthlyEntries)
    .set({ dueDay: null, updatedAt: new Date() })
    .where(
      and(
        eq(monthlyEntries.lineId, input.lineId),
        gte(
          sql<number>`${monthlyEntries.year} * 100 + ${monthlyEntries.month}`,
          targetInt,
        ),
        isNull(monthlyEntries.paidAt),
      ),
    );
}


export async function applyValueFromMonth(input: {
  lineId: number;
  year: number;
  month: number;
  projectedCents: number;
}): Promise<void> {
  const { lineId, year, month, projectedCents } = input;
  await db
    .insert(expenseLineValues)
    .values({ lineId, effectiveYear: year, effectiveMonth: month, projectedCents })
    .onConflictDoUpdate({
      target: [
        expenseLineValues.lineId,
        expenseLineValues.effectiveYear,
        expenseLineValues.effectiveMonth,
      ],
      set: { projectedCents },
    });

  const targetInt = year * 100 + month;
  await db
    .update(monthlyEntries)
    .set({ projectedCents, updatedAt: new Date() })
    .where(
      and(
        eq(monthlyEntries.lineId, lineId),
        gte(
          sql<number>`${monthlyEntries.year} * 100 + ${monthlyEntries.month}`,
          targetInt,
        ),
        isNull(monthlyEntries.paidAt),
        isNull(monthlyEntries.actualCents),
      ),
    );
}

