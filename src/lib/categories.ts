// Paleta fixa pra cores derivadas de string. Classes literais para o Tailwind JIT.
const palette = [
  { dot: "bg-blue-500", text: "text-blue-600", soft: "bg-blue-50" },
  { dot: "bg-rose-500", text: "text-rose-600", soft: "bg-rose-50" },
  { dot: "bg-emerald-500", text: "text-emerald-600", soft: "bg-emerald-50" },
  { dot: "bg-amber-500", text: "text-amber-600", soft: "bg-amber-50" },
  { dot: "bg-violet-500", text: "text-violet-600", soft: "bg-violet-50" },
  { dot: "bg-cyan-500", text: "text-cyan-600", soft: "bg-cyan-50" },
  { dot: "bg-fuchsia-500", text: "text-fuchsia-600", soft: "bg-fuchsia-50" },
  { dot: "bg-orange-500", text: "text-orange-600", soft: "bg-orange-50" },
  { dot: "bg-teal-500", text: "text-teal-600", soft: "bg-teal-50" },
  { dot: "bg-indigo-500", text: "text-indigo-600", soft: "bg-indigo-50" },
] as const;

export type CategoryColor = (typeof palette)[number];

export function categoryColor(category: string | null | undefined): CategoryColor | null {
  if (!category) return null;
  const key = category.trim().toLowerCase();
  if (!key) return null;
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}
