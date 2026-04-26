"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { expenseLines, monthlyEntries } from "@/db/schema";
import { parseBRLToCents } from "@/lib/money";
import { addMonths } from "@/lib/dates";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  return session.user.id;
}

const baseSchema = z.object({
  name: z.string().min(1, "Informe o nome.").max(80),
  category: z
    .string()
    .max(40)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  defaultProjected: z.string().optional(),
  dueDay: z.coerce.number().int().min(1).max(31),
  displayOrder: z.coerce.number().int().min(0).default(0),
  defaultPaidWithCard: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

const createSchema = baseSchema.extend({
  startYear: z.coerce.number().int().min(2000).max(2100),
  startMonth: z.coerce.number().int().min(1).max(12),
  monthsCount: z.coerce.number().int().min(1).max(360),
});

export type LineFormState = { error?: string; ok?: boolean } | undefined;

export async function createLineAction(
  _prev: LineFormState,
  formData: FormData,
): Promise<LineFormState> {
  const userId = await requireAuth();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { defaultProjected, startYear, startMonth, monthsCount, ...rest } =
    parsed.data;
  const projectedCents = defaultProjected
    ? (parseBRLToCents(defaultProjected) ?? 0)
    : 0;

  const [line] = await db
    .insert(expenseLines)
    .values({ ...rest, defaultProjectedCents: projectedCents })
    .returning({ id: expenseLines.id });

  if (line && projectedCents > 0) {
    const rows = Array.from({ length: monthsCount }, (_, i) => {
      const ym = addMonths({ year: startYear, month: startMonth }, i);
      return {
        lineId: line.id,
        year: ym.year,
        month: ym.month,
        projectedCents,
        actualCents: null,
        paidAt: null,
        paidWithCard: rest.defaultPaidWithCard,
        notes: null,
        updatedById: userId,
      };
    });
    await db
      .insert(monthlyEntries)
      .values(rows)
      .onConflictDoNothing({
        target: [
          monthlyEntries.lineId,
          monthlyEntries.year,
          monthlyEntries.month,
        ],
      });
  }

  revalidatePath("/despesas");
  revalidatePath("/matriz");
  return { ok: true };
}

const updateSchema = baseSchema.extend({
  id: z.coerce.number().int().positive(),
});

export async function updateLineAction(
  _prev: LineFormState,
  formData: FormData,
): Promise<LineFormState> {
  await requireAuth();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { id, defaultProjected, ...rest } = parsed.data;
  const defaultProjectedCents = defaultProjected
    ? (parseBRLToCents(defaultProjected) ?? 0)
    : 0;
  await db
    .update(expenseLines)
    .set({ ...rest, defaultProjectedCents, updatedAt: new Date() })
    .where(eq(expenseLines.id, id));
  revalidatePath("/despesas");
  revalidatePath("/matriz");
  return { ok: true };
}

export async function setArchivedAction(
  id: number,
  archived: boolean,
): Promise<void> {
  await requireAuth();
  await db
    .update(expenseLines)
    .set({ isArchived: archived, updatedAt: new Date() })
    .where(eq(expenseLines.id, id));
  revalidatePath("/despesas");
  revalidatePath("/matriz");
}
