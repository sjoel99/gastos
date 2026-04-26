"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { allowedEmails } from "@/db/schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  return session.user;
}

const addSchema = z.object({
  email: z
    .string()
    .email("E-mail inválido.")
    .max(120)
    .transform((v) => v.trim().toLowerCase()),
});

export type AccessFormState = { error?: string; ok?: boolean } | undefined;

export async function addAccessAction(
  _prev: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  const user = await requireAuth();
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { email } = parsed.data;
  await db
    .insert(allowedEmails)
    .values({ email, invitedById: user.id ?? null })
    .onConflictDoNothing({ target: allowedEmails.email });
  revalidatePath("/acessos");
  return { ok: true };
}

export async function removeAccessAction(id: number): Promise<void> {
  await requireAuth();
  await db.delete(allowedEmails).where(eq(allowedEmails.id, id));
  revalidatePath("/acessos");
}
