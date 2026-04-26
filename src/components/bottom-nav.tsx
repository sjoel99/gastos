"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, Calendar, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "mes", label: "Mês", href: "/matriz?view=mes", icon: Calendar },
  {
    id: "calendario",
    label: "Calendário",
    href: "/matriz?view=calendario",
    icon: CalendarDays,
  },
  {
    id: "grafico",
    label: "Gráfico",
    href: "/matriz?view=grafico",
    icon: BarChart3,
  },
  { id: "itens", label: "Itens", href: "/despesas", icon: Settings },
] as const;

function activeTabId(pathname: string, view: string | null): string {
  if (pathname.startsWith("/despesas")) return "itens";
  if (pathname.startsWith("/matriz")) {
    if (view === "calendario") return "calendario";
    if (view === "grafico") return "grafico";
    return "mes";
  }
  return "";
}

export function BottomNav() {
  const pathname = usePathname();
  const search = useSearchParams();
  const active = activeTabId(pathname, search.get("view"));

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md pb-safe"
      aria-label="Navegação principal"
    >
      <ul className="grid grid-cols-4 px-2 pt-2 pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "px-4 py-1 rounded-full transition-colors",
                    isActive && "bg-primary-soft",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
