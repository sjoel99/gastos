import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { allowedEmails } from "@/db/schema";
import { allowedEmailsFromEnv } from "@/env";

let bootstrapped = false;

async function bootstrapFromEnv() {
  if (bootstrapped) return;
  if (allowedEmailsFromEnv.length === 0) {
    bootstrapped = true;
    return;
  }
  const existing = await db.select({ id: allowedEmails.id }).from(allowedEmails).limit(1);
  if (existing.length === 0) {
    await db
      .insert(allowedEmails)
      .values(allowedEmailsFromEnv.map((email) => ({ email })))
      .onConflictDoNothing();
  }
  bootstrapped = true;
}

export async function listAllowedEmails(): Promise<
  { id: number; email: string; createdAt: Date }[]
> {
  await bootstrapFromEnv();
  return db
    .select({
      id: allowedEmails.id,
      email: allowedEmails.email,
      createdAt: allowedEmails.createdAt,
    })
    .from(allowedEmails)
    .orderBy(asc(allowedEmails.createdAt));
}

export async function getAllowedEmailSet(): Promise<Set<string>> {
  await bootstrapFromEnv();
  const rows = await db.select({ email: allowedEmails.email }).from(allowedEmails);
  const set = new Set(rows.map((r) => r.email.toLowerCase()));
  // Fallback definitivo se a tabela ainda estiver vazia (env desligada).
  if (set.size === 0) {
    for (const e of allowedEmailsFromEnv) set.add(e);
  }
  return set;
}

export async function isEmailAllowed(email: string): Promise<boolean> {
  const set = await getAllowedEmailSet();
  return set.has(email.toLowerCase());
}
