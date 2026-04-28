"use client";

import { useMemo } from "react";
import { sankey, sankeyLinkHorizontal, sankeyJustify } from "d3-sankey";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatBRL } from "@/lib/money";
import { monthLabelLong } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { expenseCategory } from "@/lib/expense-icons";
import type { ExpenseLine, MonthlyEntry } from "@/db/schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number | null;
  lines: ExpenseLine[];
  entries: MonthlyEntry[];
};

// Paleta hex pra colorir categorias (paralela à paleta Tailwind em lib/categories).
const CATEGORY_HEX = [
  "#3b82f6", // blue
  "#f43f5e", // rose
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#d946ef", // fuchsia
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
];

const TOTAL_COLOR = "#6366f1";
const UNCATEGORIZED = "Sem categoria";

function colorForCategory(name: string): string {
  if (name === UNCATEGORIZED) return "#94a3b8"; // slate-400
  let hash = 0;
  for (const ch of name.trim().toLowerCase()) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return CATEGORY_HEX[hash % CATEGORY_HEX.length];
}

function entryValueCents(line: ExpenseLine, entry: MonthlyEntry) {
  if (entry.actualCents !== null && entry.actualCents !== undefined) {
    return entry.actualCents;
  }
  return entry.projectedCents;
}

type SankeyNode = {
  name: string;
  kind: "total" | "category" | "expense";
  color: string;
  valueCents: number;
};
type SankeyLink = { source: number; target: number; value: number };

function buildGraph(
  lines: ExpenseLine[],
  entries: MonthlyEntry[],
  year: number,
  month: number,
): { nodes: SankeyNode[]; links: SankeyLink[]; total: number } {
  const linesById = new Map(lines.map((l) => [l.id, l]));

  type Bucket = { name: string; categoryRaw: string; cents: number };
  const buckets: Bucket[] = [];

  for (const e of entries) {
    if (e.year !== year || e.month !== month) continue;
    const line = linesById.get(e.lineId);
    if (!line) continue;
    if (e.paidWithCard ?? line.defaultPaidWithCard) continue; // cartão fica fora
    const cents = entryValueCents(line, e);
    if (cents <= 0) continue;
    const category =
      line.category?.trim() || expenseCategory(line.name) || UNCATEGORIZED;
    buckets.push({
      name: line.name,
      categoryRaw: category,
      cents,
    });
  }

  // Agrupa por categoria (ordem estável: maior primeiro).
  const byCategory = new Map<string, Bucket[]>();
  for (const b of buckets) {
    if (!byCategory.has(b.categoryRaw)) byCategory.set(b.categoryRaw, []);
    byCategory.get(b.categoryRaw)!.push(b);
  }
  const categoryOrder = [...byCategory.keys()].sort((a, b) => {
    const sa = byCategory.get(a)!.reduce((s, x) => s + x.cents, 0);
    const sb = byCategory.get(b)!.reduce((s, x) => s + x.cents, 0);
    return sb - sa;
  });

  const total = buckets.reduce((s, b) => s + b.cents, 0);

  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  const totalIdx = nodes.length;
  nodes.push({
    name: "Total",
    kind: "total",
    color: TOTAL_COLOR,
    valueCents: total,
  });

  // Se só há uma categoria (ou nenhuma de fato categorizada), pula o nível
  // intermediário pra evitar um nó pass-through inútil.
  const skipCategoryLevel = categoryOrder.length <= 1;

  for (const cat of categoryOrder) {
    const items = byCategory.get(cat)!;
    items.sort((a, b) => b.cents - a.cents);
    const catSum = items.reduce((s, x) => s + x.cents, 0);
    const catColor = colorForCategory(cat);

    let parentIdx = totalIdx;
    if (!skipCategoryLevel) {
      const catNodeIdx = nodes.length;
      nodes.push({
        name: cat,
        kind: "category",
        color: catColor,
        valueCents: catSum,
      });
      links.push({ source: totalIdx, target: catNodeIdx, value: catSum });
      parentIdx = catNodeIdx;
    }

    for (const item of items) {
      const expIdx = nodes.length;
      nodes.push({
        name: item.name,
        kind: "expense",
        color: skipCategoryLevel ? colorForCategory(item.name) : catColor,
        valueCents: item.cents,
      });
      links.push({ source: parentIdx, target: expIdx, value: item.cents });
    }
  }

  return { nodes, links, total };
}

export function MonthFlowSheet({
  open,
  onOpenChange,
  year,
  month,
  lines,
  entries,
}: Props) {
  const graph = useMemo(() => {
    if (month === null) return null;
    return buildGraph(lines, entries, year, month);
  }, [lines, entries, year, month]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "max-h-[92vh] flex flex-col rounded-t-2xl",
          "sm:w-[56rem]! sm:max-w-[calc(100vw-2rem)]! sm:max-h-[88vh]! sm:rounded-2xl! sm:border!",
          "sm:left-1/2! sm:right-auto! sm:bottom-auto! sm:top-1/2!",
          "sm:translate-x-[-50%]! sm:translate-y-[-50%]!",
        )}
      >
        <SheetHeader>
          <SheetTitle className="capitalize">
            {month !== null ? monthLabelLong(year, month) : ""}
          </SheetTitle>
          <SheetDescription>
            {graph && graph.total > 0
              ? `Fluxo de ${formatBRL(graph.total)} entre categorias e despesas`
              : "Sem despesas para mostrar neste mês"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
          {graph && graph.total > 0 ? (
            <SankeyChart graph={graph} />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma despesa lançada
              {month !== null ? ` em ${monthLabelLong(year, month)}` : ""}.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SankeyChart({
  graph,
}: {
  graph: { nodes: SankeyNode[]; links: SankeyLink[]; total: number };
}) {
  const W = 800;
  const expenseCount = graph.nodes.filter((n) => n.kind === "expense").length;
  // altura escala com número de despesas pra labels não atropelarem
  const H = Math.max(360, Math.min(900, 80 + expenseCount * 28));
  const padX = 8;
  const padY = 12;

  const layout = useMemo(() => {
    const generator = sankey<SankeyNode, SankeyLink>()
      .nodeAlign(sankeyJustify)
      .nodeWidth(14)
      .nodePadding(8)
      .extent([
        [padX, padY],
        [W - padX, H - padY],
      ]);

    // d3-sankey muta os nós/links — clonamos para não poluir o input.
    const nodes = graph.nodes.map((n) => ({ ...n }));
    const links = graph.links.map((l) => ({ ...l }));
    const result = generator({ nodes, links });
    return result;
  }, [graph, H]);

  const linkPath = sankeyLinkHorizontal<SankeyNode, SankeyLink>();

  const content = (
    <>
      <g>
        {layout.links.map((link, i) => {
          const target = link.target as unknown as SankeyNode & {
            color: string;
          };
          return (
            <path
              key={i}
              d={linkPath(link) ?? ""}
              fill="none"
              stroke={target.color}
              strokeOpacity={0.35}
              strokeWidth={Math.max(1, link.width ?? 1)}
            />
          );
        })}
      </g>

      <g>
        {layout.nodes.map((node, i) => {
          const x0 = node.x0 ?? 0;
          const y0 = node.y0 ?? 0;
          const x1 = node.x1 ?? 0;
          const y1 = node.y1 ?? 0;
          const isLeft = node.kind === "total";
          const isExpense = node.kind === "expense";
          const labelX = isLeft ? x1 + 8 : x0 - 8;
          const labelY = (y0 + y1) / 2;
          const anchor = isLeft ? "start" : "end";
          const showLabel = !isExpense || (y1 - y0) >= 8;

          return (
            <g key={i}>
              <rect
                x={x0}
                y={y0}
                width={Math.max(1, x1 - x0)}
                height={Math.max(1, y1 - y0)}
                fill={node.color}
                rx={2}
              >
                <title>{`${node.name}: ${formatBRL(node.valueCents)}`}</title>
              </rect>
              {showLabel ? (
                <text
                  x={labelX}
                  y={labelY}
                  dy="0.35em"
                  textAnchor={anchor}
                  className="fill-foreground"
                  style={{ fontSize: 11 }}
                >
                  <tspan className={isExpense ? "" : "font-semibold"}>
                    {node.name}
                  </tspan>
                  <tspan
                    className="fill-muted-foreground"
                    dx={6}
                    style={{ fontSize: 10 }}
                  >
                    {formatBRL(node.valueCents)}
                  </tspan>
                </text>
              ) : null}
            </g>
          );
        })}
      </g>
    </>
  );

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="hidden md:block w-full h-auto"
        role="img"
        aria-label="Diagrama de fluxo de despesas"
      >
        {content}
      </svg>

      {/* Mobile: rotacionado 90° pra aproveitar a tela em retrato.
          O wrapper inverte o aspect-ratio (H/W) e o SVG é dimensionado
          via container queries (100cqh × 100cqw) antes da rotação. */}
      <div
        className="md:hidden relative w-full"
        style={
          {
            aspectRatio: `${H} / ${W}`,
            containerType: "size",
          } as React.CSSProperties
        }
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Diagrama de fluxo de despesas"
          style={{
            width: "100cqh",
            height: "100cqw",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(90deg)",
          }}
        >
          {content}
        </svg>
      </div>
    </>
  );
}
