"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Calendar,
  CalendarDays,
  LogOut,
  Settings,
  Table as TableIcon,
  Users,
} from "lucide-react";
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
  { id: "ano", label: "Ano", href: "/matriz?view=ano", icon: TableIcon },
] as const;

function activeTabId(pathname: string, view: string | null): string {
  if (pathname.startsWith("/acessos")) return "";
  if (pathname.startsWith("/despesas")) return "itens";
  if (pathname.startsWith("/matriz")) {
    if (view === "ano") return "ano";
    if (view === "calendario") return "calendario";
    if (view === "grafico") return "grafico";
    return "mes";
  }
  return "";
}

export function AppHeader({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const active = activeTabId(pathname, search.get("view"));

  return (
    <header className="hidden md:block sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="px-6 lg:px-8 h-14 max-w-6xl mx-auto flex items-center justify-between gap-4">
        <Link href="/matriz?view=mes" className="flex items-center gap-2.5 group">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-purple-700 text-primary-foreground flex items-center justify-center shadow-sm shadow-primary/30">
            <Calendar className="size-4" />
          </div>
          <h1 className="font-bold tracking-tight group-hover:text-primary transition-colors">
            Gastos
          </h1>
        </Link>

        <nav className="flex items-center gap-0.5 bg-muted/60 rounded-full p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
                  isActive
                    ? "bg-background text-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          {userEmail ? (
            <span className="text-xs text-muted-foreground mr-2 hidden lg:inline">
              {userEmail}
            </span>
          ) : null}
          <Link
            href="/acessos"
            className="size-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Acessos"
            title="Gerenciar acessos"
          >
            <Users className="size-4" />
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="size-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
