import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db/client";
import {
  expenseLines,
  monthlyEntries,
  pushSubscriptions,
  users,
} from "@/db/schema";
import { env } from "@/env";
import { getAllowedEmailSet } from "@/lib/allowed-emails";
import { clampDueDay, todayInAppTz } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { isPushConfigured, sendPush } from "@/lib/push";

export const dynamic = "force-dynamic";

type DueItem = {
  name: string;
  valueCents: number;
};

async function findDueToday(): Promise<DueItem[]> {
  const { year, month, day } = todayInAppTz();

  // Busca entries do mês corrente, não pagas, não cartão, com despesa ativa
  const rows = await db
    .select({
      name: expenseLines.name,
      dueDay: expenseLines.dueDay,
      projectedCents: monthlyEntries.projectedCents,
      actualCents: monthlyEntries.actualCents,
    })
    .from(monthlyEntries)
    .innerJoin(expenseLines, eq(monthlyEntries.lineId, expenseLines.id))
    .where(
      and(
        eq(monthlyEntries.year, year),
        eq(monthlyEntries.month, month),
        isNull(monthlyEntries.paidAt),
        eq(monthlyEntries.paidWithCard, false),
        eq(expenseLines.isArchived, false),
      ),
    );

  // Filtra pelo dia (clamp se o mês não tem o dia exato)
  return rows
    .filter((r) => clampDueDay(r.dueDay, year, month) === day)
    .map((r) => ({
      name: r.name,
      valueCents: r.actualCents ?? r.projectedCents ?? 0,
    }))
    .filter((r) => r.valueCents > 0);
}

function buildEmailHtml(items: DueItem[]): string {
  const total = items.reduce((s, x) => s + x.valueCents, 0);
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${it.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; font-variant-numeric: tabular-nums;">${formatBRL(it.valueCents)}</td>
      </tr>`,
    )
    .join("");
  const baseUrl = env.AUTH_URL ?? "";
  return `
  <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
    <h2 style="color: #6b21a8; margin: 0 0 8px;">Contas que vencem hoje</h2>
    <p style="color: #555; margin: 0 0 16px; font-size: 14px;">${items.length} conta${items.length === 1 ? "" : "s"} · Total ${formatBRL(total)}</p>
    <table style="width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <tbody>${rows}</tbody>
    </table>
    ${baseUrl ? `<p style="margin-top: 16px;"><a href="${baseUrl}/matriz?view=mes" style="color: #6b21a8; text-decoration: none; font-weight: 600;">Abrir o app →</a></p>` : ""}
    <p style="color: #999; font-size: 12px; margin-top: 24px;">Gastos · aviso diário</p>
  </div>
  `;
}

async function sendEmails(items: DueItem[], emails: string[]) {
  if (!env.RESEND_API_KEY) return { sent: 0, skipped: "RESEND_API_KEY ausente" };
  if (emails.length === 0) return { sent: 0, skipped: "Sem destinatários" };

  const resend = new Resend(env.RESEND_API_KEY);
  const total = items.reduce((s, x) => s + x.valueCents, 0);
  const subject = `${items.length} conta${items.length === 1 ? "" : "s"} hoje · ${formatBRL(total)}`;
  const html = buildEmailHtml(items);

  let sent = 0;
  for (const to of emails) {
    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      sent++;
    } catch (err) {
      console.error("[cron] resend error:", err);
    }
  }
  return { sent };
}

async function sendPushes(items: DueItem[], allowedSet: Set<string>) {
  if (!isPushConfigured()) return { sent: 0, removed: 0 };

  const total = items.reduce((s, x) => s + x.valueCents, 0);
  const title = `${items.length} conta${items.length === 1 ? "" : "s"} hoje`;
  const body = `${items
    .slice(0, 3)
    .map((i) => i.name)
    .join(", ")}${items.length > 3 ? "…" : ""} · ${formatBRL(total)}`;

  const subs = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      userEmail: users.email,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(pushSubscriptions.userId, users.id));

  const eligible = subs.filter((s) =>
    s.userEmail ? allowedSet.has(s.userEmail.toLowerCase()) : false,
  );

  let sent = 0;
  let removed = 0;
  for (const s of eligible) {
    const result = await sendPush(s, {
      title,
      body,
      url: "/matriz?view=mes",
    });
    if (result.ok) {
      sent++;
    } else if (result.gone) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, s.endpoint));
      removed++;
    }
  }
  return { sent, removed };
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET ausente." }, { status: 503 });
  }
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await findDueToday();
  if (items.length === 0) {
    return NextResponse.json({ ok: true, items: 0 });
  }

  const allowedSet = await getAllowedEmailSet();
  const emails = [...allowedSet];

  const [emailResult, pushResult] = await Promise.all([
    sendEmails(items, emails),
    sendPushes(items, allowedSet),
  ]);

  return NextResponse.json({
    ok: true,
    items: items.length,
    email: emailResult,
    push: pushResult,
  });
}

export async function GET(request: Request) {
  return POST(request);
}
