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
    <header className="hidden md:block sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Calendar className="size-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Gastos Mensais
          </h1>
        </div>

        <nav className="flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 pl-3 border-l">
          {userEmail ? (
            <span className="text-xs text-muted-foreground">{userEmail}</span>
          ) : null}
          <Link
            href="/acessos"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Acessos"
            title="Gerenciar acessos"
          >
            <Users className="size-4" />
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground"
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
