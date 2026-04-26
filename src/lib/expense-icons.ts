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
  { pattern: /cart[ãa]o/i, icon: CreditCard, color: PALETTE.purple },
  { pattern: /[áa]gua/i, icon: Droplets, color: PALETTE.cyan },
  { pattern: /\bluz\b|energia/i, icon: Zap, color: PALETTE.amber },
  { pattern: /internet|fibra|vivo|fibralink/i, icon: Wifi, color: PALETTE.blue },
  { pattern: /escola|col[ée]gio|ingl[êe]s|escote(?:iro|ira)/i, icon: GraduationCap, color: PALETTE.indigo },
  { pattern: /financ|imo[bv]el|aluguel|cond/i, icon: Home, color: PALETTE.slate },
  { pattern: /terapia|psiqui|psic[óo]l/i, icon: Brain, color: PALETTE.pink },
  { pattern: /sa[úu]de|plano|dental|m[ée]dic|dermo|exame|consulta/i, icon: Heart, color: PALETTE.rose },
  { pattern: /carro|ipva|combust|posto|gasol|licenc|multa/i, icon: Car, color: PALETTE.orange },
  { pattern: /academia|ginast|nat[aã]/i, icon: Dumbbell, color: PALETTE.green },
  { pattern: /mei|pos\b|adv|virtus/i, icon: Briefcase, color: PALETTE.slate },
  { pattern: /canto|m[uú]sica/i, icon: Music, color: PALETTE.teal },
  { pattern: /futebol|esporte/i, icon: Trees, color: PALETTE.emerald },
  { pattern: /iptu|imposto/i, icon: Receipt, color: PALETTE.slate },
  { pattern: /streaming|tv|netflix|spot/i, icon: Tv, color: PALETTE.rose },
  { pattern: /viagem|airbnb|hotel|passagem/i, icon: Plane, color: PALETTE.sky },
  { pattern: /telefone|celular|tim|claro/i, icon: Phone, color: PALETTE.blue },
  { pattern: /m[ãa]e|fam[íi]lia|filh|davi|isa|vivi|joel/i, icon: Smile, color: PALETTE.amber },
  { pattern: /mercado|compras/i, icon: ShoppingBag, color: PALETTE.green },
  { pattern: /sal[áa]rio|pr[óo]-?labore|dividendo/i, icon: Wallet, color: PALETTE.emerald },
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

export function expenseIcon(name: string): ExpenseIcon {
  for (const m of MATCHERS) {
    if (m.pattern.test(name)) {
      return { Icon: m.icon, bg: m.color.bg, fg: m.color.fg };
    }
  }
  const c = hashColor(name);
  return { Icon: FALLBACK.icon, bg: c.bg, fg: c.fg };
}
