"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { expenseLines, monthlyEntries } from "@/db/schema";
import {
  applyDueDayFromMonth,
  applyValueFromMonth,
  getMonthlyEntry,
  upsertMonthlyEntry,
} from "@/db/queries";
import { parseBRLToCents } from "@/lib/money";

const boolField = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

const upsertSchema = z.object({
  lineId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  projected: z.string().optional(),
  paidWithCard: boolField,
  applyForward: boolField,
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
  applyDueDayForward: boolField,
  notes: z.string().optional(),
});

export type EntryFormState = { error?: string; ok?: boolean } | undefined;

export async function saveEntryAction(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado." };

  const parsed = upsertSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const {
    lineId,
    year,
    month,
    projected,
    paidWithCard,
    applyForward,
    dueDay,
    applyDueDayForward,
    notes,
  } = parsed.data;
  const projectedCents = projected ? (parseBRLToCents(projected) ?? 0) : 0;

  const existing = await getMonthlyEntry(lineId, year, month);

  if (applyForward) {
    await applyValueFromMonth({ lineId, year, month, projectedCents });
  }

  // Determina o due_day a salvar na entry (override ou herdado).
  let entryDueDay: number | null = existing?.dueDay ?? null;
  if (dueDay !== undefined) {
    const lineRows = await db
      .select({ dueDay: expenseLines.dueDay })
      .from(expenseLines)
      .where(eq(expenseLines.id, lineId))
      .limit(1);
    const oldLineDueDay = lineRows[0]?.dueDay ?? dueDay;

    if (applyDueDayForward) {
      await applyDueDayFromMonth({
        lineId,
        year,
        month,
        dueDay,
        oldLineDueDay,
      });
      // Após applyDueDayFromMonth o registro futuro não pago herda da line; limpa override desta entry.
      entryDueDay = null;
    } else {
      // Override individual: NULL se igual ao da line atual, senão grava o valor.
      entryDueDay = dueDay === oldLineDueDay ? null : dueDay;
    }
  }

  await upsertMonthlyEntry({
    lineId,
    year,
    month,
    projectedCents,
    actualCents: existing?.actualCents ?? null,
    paidAt: existing?.paidAt ?? null,
    paidWithCard,
    dueDay: entryDueDay,
    notes: notes?.trim() ? notes.trim() : null,
    updatedById: session.user.id,
  });

  revalidatePath("/matriz");
  return { ok: true };
}

const confirmSchema = z.object({
  lineId: z.coerce.number().int().positive(),
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(1).max(12),
  paidValue: z.string(),
  applyForward: boolField,
});

export type ConfirmPaymentState =
  | { error?: string; ok?: boolean }
  | undefined;

export async function confirmPaymentAction(
  _prev: ConfirmPaymentState,
  formData: FormData,
): Promise<ConfirmPaymentState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado." };
  const parsed = confirmSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const { lineId, year, month, paidValue, applyForward } = parsed.data;
  const paidCents = parseBRLToCents(paidValue);
  if (paidCents === null) return { error: "Valor inválido." };

  const [existing, lineRows] = await Promise.all([
    getMonthlyEntry(lineId, year, month),
    db
      .select({
        defaultProjectedCents: expenseLines.defaultProjectedCents,
        defaultPaidWithCard: expenseLines.defaultPaidWithCard,
      })
      .from(expenseLines)
      .where(eq(expenseLines.id, lineId))
      .limit(1),
  ]);

  const projected =
    existing?.projectedCents ?? lineRows[0]?.defaultProjectedCents ?? 0;
  const paidWithCard =
    existing?.paidWithCard ?? lineRows[0]?.defaultPaidWithCard ?? false;

  if (applyForward && paidCents !== projected) {
    await applyValueFromMonth({
      lineId,
      year,
      month,
      projectedCents: paidCents,
    });
  }

  await upsertMonthlyEntry({
    lineId,
    year,
    month,
    projectedCents: applyForward ? paidCents : projected,
    actualCents: paidCents,
    paidAt: new Date(),
    paidWithCard,
    dueDay: existing?.dueDay ?? null,
    notes: existing?.notes ?? null,
    updatedById: session.user.id,
  });

  revalidatePath("/matriz");
  return { ok: true };
}

const toggleSchema = z.object({
  lineId: z.coerce.number().int().positive(),
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(1).max(12),
  paid: z.string(),
});

const deleteEntrySchema = z.object({
  lineId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export type DeleteEntryState = { error?: string; ok?: boolean } | undefined;

export async function deleteEntryAction(
  _prev: DeleteEntryState,
  formData: FormData,
): Promise<DeleteEntryState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado." };

  const parsed = deleteEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const { lineId, year, month } = parsed.data;
  await db
    .delete(monthlyEntries)
    .where(
      and(
        eq(monthlyEntries.lineId, lineId),
        eq(monthlyEntries.year, year),
        eq(monthlyEntries.month, month),
      ),
    );

  revalidatePath("/matriz");
  return { ok: true };
}

export async function deleteEntriesFromMonthAction(
  _prev: DeleteEntryState,
  formData: FormData,
): Promise<DeleteEntryState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado." };

  const parsed = deleteEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const { lineId, year, month } = parsed.data;
  const targetInt = year * 100 + month;
  // Preserva meses já pagos (paidAt OU actualCents preenchidos), seguindo a
  // mesma convenção de applyValueFromMonth.
  await db
    .delete(monthlyEntries)
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

  revalidatePath("/matriz");
  return { ok: true };
}

export async function togglePaidAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  const parsed = toggleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Dados inválidos.");

  const { lineId, year, month, paid } = parsed.data;
  const isPaid = paid === "true" || paid === "on";

  const [existing, lineRows] = await Promise.all([
    getMonthlyEntry(lineId, year, month),
    db
      .select({
        defaultProjectedCents: expenseLines.defaultProjectedCents,
        defaultPaidWithCard: expenseLines.defaultPaidWithCard,
      })
      .from(expenseLines)
      .where(eq(expenseLines.id, lineId))
      .limit(1),
  ]);

  const projected =
    existing?.projectedCents ?? lineRows[0]?.defaultProjectedCents ?? 0;
  const paidWithCard =
    existing?.paidWithCard ?? lineRows[0]?.defaultPaidWithCard ?? false;

  await upsertMonthlyEntry({
    lineId,
    year,
    month,
    projectedCents: projected,
    actualCents: existing?.actualCents ?? null,
    paidAt: isPaid ? new Date() : null,
    paidWithCard,
    dueDay: existing?.dueDay ?? null,
    notes: existing?.notes ?? null,
    updatedById: session.user.id,
  });

  revalidatePath("/matriz");
}
