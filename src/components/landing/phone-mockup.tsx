/**
 * Mockup de telefone com uma prévia fiel da tela "Mês" do ContaLeve — hero card
 * (total/pago/falta) e a lista de lançamentos. Puro CSS/markup, sem imagem.
 */
const rows = [
  { name: "Aluguel", due: "dia 5", value: "R$ 1.800,00", status: "Pago", tone: "paid" },
  { name: "Energia", due: "dia 10", value: "R$ 240,00", status: "Pendente", tone: "pending" },
  { name: "Internet", due: "dia 15", value: "R$ 120,00", status: "Pendente", tone: "pending" },
  { name: "Mercado", due: "dia 20", value: "R$ 950,00", status: "cartão", tone: "card" },
  { name: "Escola", due: "dia 8", value: "R$ 680,00", status: "Atrasado", tone: "overdue" },
] as const;

const toneClass: Record<string, string> = {
  paid: "text-emerald-600",
  pending: "text-amber-600",
  overdue: "text-red-600",
  card: "text-indigo-500",
};

const dotClass: Record<string, string> = {
  paid: "bg-emerald-500",
  pending: "bg-amber-500",
  overdue: "bg-red-500",
  card: "bg-indigo-500",
};

export function PhoneMockup() {
  return (
    <div className="relative w-[280px] rounded-[2.5rem] border-[10px] border-foreground/90 bg-background shadow-2xl">
      <div className="absolute left-1/2 top-0 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
      <div className="overflow-hidden rounded-[1.8rem]">
        {/* status bar */}
        <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[0.6rem] font-medium text-muted-foreground">
          <span>9:41</span>
          <span>ContaLeve</span>
        </div>

        <div className="space-y-3 px-3 pb-5">
          {/* hero card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/75 p-4 text-primary-foreground">
            <p className="text-center text-2xl font-bold tracking-tight">
              R$ 3.840,00
            </p>
            <div className="mt-3 flex justify-center gap-6 text-center text-[0.65rem]">
              <div>
                <p className="opacity-80">Pago</p>
                <p className="font-semibold">R$ 1.800,00</p>
              </div>
              <div>
                <p className="opacity-80">Falta</p>
                <p className="font-semibold">R$ 2.040,00</p>
              </div>
            </div>
            <p className="mt-2 text-center text-[0.6rem] opacity-80">
              R$ 950,00 no cartão
            </p>
          </div>

          {/* rows */}
          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            {rows.map((r) => (
              <div key={r.name} className="flex items-center gap-2.5 px-3 py-2.5">
                <span className={`size-2 rounded-full ${dotClass[r.tone]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{r.name}</p>
                  <p className="text-[0.6rem] text-muted-foreground">
                    Vence {r.due}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium tabular-nums">{r.value}</p>
                  <p className={`text-[0.6rem] ${toneClass[r.tone]}`}>
                    {r.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* tab bar */}
        <div className="flex justify-around border-t border-border bg-card py-2 text-[0.55rem] text-muted-foreground">
          <span className="font-semibold text-primary">Mês</span>
          <span>Análise</span>
          <span>Lançamentos</span>
          <span>Ajustes</span>
        </div>
      </div>
    </div>
  );
}
