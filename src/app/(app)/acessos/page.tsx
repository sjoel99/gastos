import { auth } from "@/auth";
import { listAllowedEmails } from "@/lib/allowed-emails";
import { AccessForm } from "./access-form";
import { AccessRow } from "./access-row";

export default async function AcessosPage() {
  const [session, emails] = await Promise.all([auth(), listAllowedEmails()]);
  const currentEmail = session?.user?.email?.toLowerCase() ?? "";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="hidden md:block text-2xl font-semibold tracking-tight">
          Acessos
        </h1>
        <p className="text-sm text-muted-foreground">
          Pessoas que podem entrar no Gastos via magic link.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-sm">Convidar novo e-mail</h2>
        <AccessForm />
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Liberados</h2>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {emails.length}
          </span>
        </div>
        {emails.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum e-mail liberado.
          </div>
        ) : (
          <div>
            {emails.map((e) => (
              <AccessRow
                key={e.id}
                id={e.id}
                email={e.email}
                isCurrent={e.email.toLowerCase() === currentEmail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
