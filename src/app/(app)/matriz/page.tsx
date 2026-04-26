import { listExpenseLines, listMonthlyEntries } from "@/db/queries";
import { currentYearMonth, rangeMonths } from "@/lib/dates";
import { MatrizFilters } from "./header";
import { MonthView } from "./month-view";
import { CalendarView } from "./calendar-view";
import { ChartView } from "./chart-view";
import { YearMatrix } from "./year-matrix";

type View = "mes" | "calendario" | "grafico" | "ano";

function parseView(raw: string | undefined): View {
  if (raw === "ano") return "ano";
  if (raw === "calendario") return "calendario";
  if (raw === "grafico") return "grafico";
  return "mes";
}

export default async function MatrizPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const view = parseView(sp.view);
  const now = currentYearMonth();
  const year = sp.year ? Math.max(2000, Math.min(2100, Number(sp.year))) : now.year;
  const month = sp.month
    ? Math.max(1, Math.min(12, Number(sp.month)))
    : now.month;

  if (view === "ano" || view === "grafico") {
    const months = rangeMonths({ year, month: 1 }, 12);
    const [lines, entries] = await Promise.all([
      listExpenseLines(),
      listMonthlyEntries({ year, month: 1 }, 12),
    ]);
    return (
      <>
        <MatrizFilters view={view} year={year} month={month} />
        {view === "grafico" ? (
          <ChartView lines={lines} entries={entries} year={year} />
        ) : (
          <YearMatrix lines={lines} entries={entries} months={months} />
        )}
      </>
    );
  }

  const [lines, entries] = await Promise.all([
    listExpenseLines(),
    listMonthlyEntries({ year, month }, 1),
  ]);

  if (view === "calendario") {
    return (
      <>
        <MatrizFilters view="calendario" year={year} month={month} />
        <CalendarView lines={lines} entries={entries} year={year} month={month} />
      </>
    );
  }

  return (
    <>
      <MatrizFilters view="mes" year={year} month={month} />
      <MonthView lines={lines} entries={entries} year={year} month={month} />
    </>
  );
}
