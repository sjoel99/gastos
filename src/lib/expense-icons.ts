import {
  CreditCard,
  Droplets,
  Zap,
  Wifi,
  GraduationCap,
  Home,
  Brain,
  Heart,
  Car,
  Dumbbell,
  Briefcase,
  Smile,
  Receipt,
  Tv,
  ShoppingBag,
  Plane,
  Phone,
  Music,
  Trees,
  Wallet,
  Tag,
  type LucideIcon,
} from "lucide-react";

type IconColor = {
  bg: string;
  fg: string;
};

type IconMatch = {
  pattern: RegExp;
  icon: LucideIcon;
  color: IconColor;
  category: string;
};

const PALETTE: Record<string, IconColor> = {
  purple: { bg: "bg-purple-100", fg: "text-purple-700" },
  indigo: { bg: "bg-indigo-100", fg: "text-indigo-700" },
  blue: { bg: "bg-blue-100", fg: "text-blue-700" },
  sky: { bg: "bg-sky-100", fg: "text-sky-700" },
  cyan: { bg: "bg-cyan-100", fg: "text-cyan-700" },
  teal: { bg: "bg-teal-100", fg: "text-teal-700" },
  emerald: { bg: "bg-emerald-100", fg: "text-emerald-700" },
  green: { bg: "bg-green-100", fg: "text-green-700" },
  amber: { bg: "bg-amber-100", fg: "text-amber-700" },
  orange: { bg: "bg-orange-100", fg: "text-orange-700" },
  rose: { bg: "bg-rose-100", fg: "text-rose-700" },
  pink: { bg: "bg-pink-100", fg: "text-pink-700" },
  slate: { bg: "bg-slate-100", fg: "text-slate-700" },
};

const MATCHERS: IconMatch[] = [
  { pattern: /cart[ãa]o/i, icon: CreditCard, color: PALETTE.purple, category: "Cartão" },
  { pattern: /[áa]gua/i, icon: Droplets, color: PALETTE.cyan, category: "Moradia" },
  { pattern: /\bluz\b|energia/i, icon: Zap, color: PALETTE.amber, category: "Moradia" },
  { pattern: /internet|fibra|vivo|fibralink/i, icon: Wifi, color: PALETTE.blue, category: "Internet & Telefone" },
  { pattern: /escola|col[ée]gio|ingl[êe]s|escote(?:iro|ira)/i, icon: GraduationCap, color: PALETTE.indigo, category: "Educação" },
  { pattern: /financ|imo[bv]el|aluguel|cond/i, icon: Home, color: PALETTE.slate, category: "Moradia" },
  { pattern: /terapia|psiqui|psic[óo]l/i, icon: Brain, color: PALETTE.pink, category: "Saúde" },
  { pattern: /sa[úu]de|plano|dental|m[ée]dic|dermo|exame|consulta/i, icon: Heart, color: PALETTE.rose, category: "Saúde" },
  { pattern: /carro|ipva|combust|posto|gasol|licenc|multa/i, icon: Car, color: PALETTE.orange, category: "Transporte" },
  { pattern: /academia|ginast|nat[aã]/i, icon: Dumbbell, color: PALETTE.green, category: "Saúde" },
  { pattern: /mei|pos\b|adv|virtus/i, icon: Briefcase, color: PALETTE.slate, category: "Trabalho" },
  { pattern: /canto|m[uú]sica/i, icon: Music, color: PALETTE.teal, category: "Lazer" },
  { pattern: /futebol|esporte/i, icon: Trees, color: PALETTE.emerald, category: "Lazer" },
  { pattern: /iptu|imposto/i, icon: Receipt, color: PALETTE.slate, category: "Impostos" },
  { pattern: /streaming|tv|netflix|spot/i, icon: Tv, color: PALETTE.rose, category: "Assinaturas" },
  { pattern: /viagem|airbnb|hotel|passagem/i, icon: Plane, color: PALETTE.sky, category: "Viagem" },
  { pattern: /telefone|celular|tim|claro/i, icon: Phone, color: PALETTE.blue, category: "Internet & Telefone" },
  { pattern: /m[ãa]e|pai|fam[íi]lia|filh|esposa|marido/i, icon: Smile, color: PALETTE.amber, category: "Família" },
  { pattern: /mercado|compras/i, icon: ShoppingBag, color: PALETTE.green, category: "Mercado" },
  { pattern: /sal[áa]rio|pr[óo]-?labore|dividendo/i, icon: Wallet, color: PALETTE.emerald, category: "Receita" },
];

const FALLBACK: { icon: LucideIcon; colors: IconColor[] } = {
  icon: Tag,
  colors: [
    PALETTE.purple,
    PALETTE.indigo,
    PALETTE.blue,
    PALETTE.teal,
    PALETTE.amber,
    PALETTE.rose,
    PALETTE.slate,
  ],
};

function hashColor(name: string): IconColor {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return FALLBACK.colors[h % FALLBACK.colors.length];
}

export type ExpenseIcon = {
  Icon: LucideIcon;
  bg: string;
  fg: string;
};

// Ícone canônico por categoria — quando a despesa tem `category` preenchida,
// o ícone é determinado pela categoria (não pelo nome).
const CATEGORY_META: Record<string, { icon: LucideIcon; color: IconColor }> = {
  "Cartão": { icon: CreditCard, color: PALETTE.purple },
  "Moradia": { icon: Home, color: PALETTE.slate },
  "Internet & Telefone": { icon: Wifi, color: PALETTE.blue },
  "Educação": { icon: GraduationCap, color: PALETTE.indigo },
  "Saúde": { icon: Heart, color: PALETTE.rose },
  "Transporte": { icon: Car, color: PALETTE.orange },
  "Trabalho": { icon: Briefcase, color: PALETTE.slate },
  "Lazer": { icon: Music, color: PALETTE.teal },
  "Impostos": { icon: Receipt, color: PALETTE.slate },
  "Assinaturas": { icon: Tv, color: PALETTE.rose },
  "Viagem": { icon: Plane, color: PALETTE.sky },
  "Família": { icon: Smile, color: PALETTE.amber },
  "Mercado": { icon: ShoppingBag, color: PALETTE.green },
  "Receita": { icon: Wallet, color: PALETTE.emerald },
};

export function expenseIcon(
  nameOrLine: string | { name: string; category?: string | null },
): ExpenseIcon {
  const name = typeof nameOrLine === "string" ? nameOrLine : nameOrLine.name;
  const category =
    typeof nameOrLine === "string" ? null : nameOrLine.category ?? null;

  // 1) categoria explícita conhecida → ícone canônico da categoria
  const cat = category?.trim();
  if (cat && CATEGORY_META[cat]) {
    const meta = CATEGORY_META[cat];
    return { Icon: meta.icon, bg: meta.color.bg, fg: meta.color.fg };
  }

  // 2) inferir categoria pelo nome → ícone canônico da categoria inferida
  for (const m of MATCHERS) {
    if (m.pattern.test(name)) {
      const meta = CATEGORY_META[m.category];
      if (meta) {
        return { Icon: meta.icon, bg: meta.color.bg, fg: meta.color.fg };
      }
      return { Icon: m.icon, bg: m.color.bg, fg: m.color.fg };
    }
  }

  // 3) sem match — ícone genérico com cor por hash do nome
  const c = hashColor(name);
  return { Icon: FALLBACK.icon, bg: c.bg, fg: c.fg };
}

/** Inferida a partir do nome — usada como fallback quando o campo `category` da despesa está vazio. */
export function expenseCategory(name: string): string | null {
  for (const m of MATCHERS) {
    if (m.pattern.test(name)) return m.category;
  }
  return null;
}
