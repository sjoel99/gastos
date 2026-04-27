import { TrendingUp } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { MONTHS_PT, monthLabelLong } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ExpenseLine, MonthlyEntry } from "@/db/schema";

type Props = {
  lines: ExpenseLine[];
  entries: MonthlyEntry[];
  year: number;
};

type MonthBucket = {
  month: number;
  paidCents: number;
  pendingCents: number;
  cardCents: number;
};

function isCardLine(
  line: ExpenseLine,
  entry: MonthlyEntry | undefined,
): boolean {
  return entry?.paidWithCard ?? line.defaultPaidWithCard;
}

function entryValueCents(line: ExpenseLine, entry: MonthlyEntry | undefined) {
  if (entry?.actualCents !== null && entry?.actualCents !== undefined) {
    return entry.actualCents;
  }
  return entry?.projectedCents ?? line.defaultProjectedCents;
}

export function ChartView({ lines, entries, year }: Props) {
  const linesById = new Map(lines.map((l) => [l.id, l]));

  const buckets: MonthBucket[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    paidCents: 0,
    pendingCents: 0,
    cardCents: 0,
  }));

  for (const e of entries) {
    if (e.year !== year) continue;
    const line = linesById.get(e.lineId);
    if (!line) continue;
    const value = entryValueCents(line, e);
    if (value <= 0) continue;
    const b = buckets[e.month - 1];
    if (isCardLine(line, e)) {
      b.cardCents += value;
      continue;
    }
    if (e.paidAt) b.paidCents += value;
    else b.pendingCents += value;
  }

  // "Pago cartão" abate do total mensal (igual à planilha).
  const monthlyTotals = buckets.map(
    (b) => b.paidCents + b.pendingCents - b.cardCents,
  );
  const monthlyPositives = buckets.map(
    (b) => b.paidCents + b.pendingCents + b.cardCents,
  );
  const yearTotal = monthlyTotals.reduce((s, v) => s + v, 0);
  const monthsWithData = monthlyPositives.filter((v) => v > 0).length;
  const avgMonthly = monthsWithData > 0 ? yearTotal / monthsWithData : 0;
  const maxMonthly = Math.max(...monthlyPositives, 1);
  const peakMonthIdx = monthlyTotals.indexOf(Math.max(...monthlyTotals));

  // SVG layout
  const W = 600;
  const H = 220;
  const padX = 24;
  const padTop = 16;
  const padBottom = 28;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const barGap = 6;
  const barWidth = (innerW - barGap * 11) / 12;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex flex-col gap-4 lg:gap-6 max-w-6xl w-full mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-primary via-primary to-purple-900 text-primary-foreground shadow-lg shadow-primary/20 p-6 flex flex-col gap-1.5">
        <span className="text-xs font-medium opacity-75 tracking-wide">
          Total {year}
        </span>
        <span className="text-[40px] leading-none font-bold tabular-nums tracking-tight">
          {formatBRL(yearTotal)}
        </span>
        <div className="flex items-center gap-4 text-xs opacity-80 mt-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5" />
            <span>Média</span>
            <span className="tabular-nums font-semibold">
              {formatBRL(Math.round(avgMonthly))}
            </span>
          </div>
          {peakMonthIdx >= 0 && maxMonthly > 0 ? (
            <div className="flex items-center gap-1.5">
              <span>Pico</span>
              <span className="font-semibold capitalize">
                {MONTHS_PT[peakMonthIdx]}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[15px]">Despesas por mês</h2>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" />
              Pago
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-primary" />
              Pendente
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-muted-foreground/40" />
              Cartão
            </span>
          </div>
        </div>

        {monthsWithData === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma despesa em {year}.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto"
            role="img"
            aria-label={`Gráfico de despesas de ${year}`}
          >
            {[0.25, 0.5, 0.75, 1].map((p) => (
              <line
                key={p}
                x1={padX}
                x2={W - padX}
                y1={padTop + innerH * (1 - p)}
                y2={padTop + innerH * (1 - p)}
                className="stroke-border"
                strokeDasharray="2 4"
              />
            ))}

            {buckets.map((b, i) => {
              const total = monthlyTotals[i];
              const positive = monthlyPositives[i];
              const x = padX + i * (barWidth + barGap);
              const paidH = (b.paidCents / maxMonthly) * innerH;
              const pendingH = (b.pendingCents / maxMonthly) * innerH;
              const cardH = (b.cardCents / maxMonthly) * innerH;
              const baseY = padTop + innerH;

              return (
                <g key={b.month}>
                  {positive > 0 ? (
                    <>
                      <rect
                        x={x}
                        y={baseY - cardH}
                        width={barWidth}
                        height={cardH}
                        className="fill-muted-foreground/40"
                        rx={2}
                      />
                      <rect
                        x={x}
                        y={baseY - cardH - pendingH}
                        width={barWidth}
                        height={pendingH}
                        className="fill-primary"
                        rx={2}
                      />
                      <rect
                        x={x}
                        y={baseY - cardH - pendingH - paidH}
                        width={barWidth}
                        height={paidH}
                        className="fill-emerald-500"
                        rx={2}
                      />
                      <title>
                        {monthLabelLong(year, b.month)}: {formatBRL(total)}
                        {"\n"}Pago {formatBRL(b.paidCents)} · Pendente{" "}
                        {formatBRL(b.pendingCents)} · Cartão −
                        {formatBRL(b.cardCents)}
                      </title>
                    </>
                  ) : null}
                  <text
                    x={x + barWidth / 2}
                    y={H - 10}
                    textAnchor="middle"
                    className={cn(
                      "fill-muted-foreground text-[10px]",
                      positive > 0 && "font-medium",
                    )}
                    style={{ fontSize: 10 }}
                  >
                    {MONTHS_PT[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 text-[13px] font-semibold">
          Detalhe mensal
        </div>
        <ul>
          {buckets.map((b, i) => {
            const total = monthlyTotals[i];
            const positive = monthlyPositives[i];
            return (
              <li
                key={b.month}
                className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-border/60 last:border-b-0 text-sm"
              >
                <span className="capitalize text-muted-foreground w-16 shrink-0">
                  {MONTHS_PT[i]}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden flex">
                  {positive > 0 ? (
                    <>
                      <div
                        className="bg-emerald-500"
                        style={{
                          width: `${(b.paidCents / maxMonthly) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-primary"
                        style={{
                          width: `${(b.pendingCents / maxMonthly) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-muted-foreground/40"
                        style={{
                          width: `${(b.cardCents / maxMonthly) * 100}%`,
                        }}
                      />
                    </>
                  ) : null}
                </div>
                <span className="tabular-nums font-semibold w-24 text-right shrink-0">
                  {positive > 0 ? formatBRL(total) : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
