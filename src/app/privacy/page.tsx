import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — ContaLeve",
  description:
    "Como o ContaLeve trata os dados dos usuários. Local-first por padrão; coleta só no plano Premium.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-6 py-12 leading-relaxed">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Política de Privacidade — ContaLeve
          </h1>
          <dl className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-[max-content_1fr] sm:gap-x-3">
            <dt className="font-medium">Última atualização:</dt>
            <dd>22 de maio de 2026</dd>
            <dt className="font-medium">Aplicativo:</dt>
            <dd>ContaLeve (Android)</dd>
            <dt className="font-medium">Desenvolvedor:</dt>
            <dd>Joel Santos (sjoel99)</dd>
            <dt className="font-medium">Contato:</dt>
            <dd>
              <a
                href="mailto:sjoel99@gmail.com"
                className="underline underline-offset-2"
              >
                sjoel99@gmail.com
              </a>
            </dd>
          </dl>
        </header>

        <p className="mb-6">
          Esta política descreve como o aplicativo ContaLeve trata os dados
          dos seus usuários. Foi escrita com a intenção de ser direta e clara —
          sem juridiquês.
        </p>

        <section className="mb-8">
          <h2 className="mb-2 text-xl font-semibold">Resumo em uma linha</h2>
          <p>
            O ContaLeve é <strong>local-first</strong>: por padrão, todos os
            seus dados ficam apenas no seu celular. Nada é enviado para
            servidores externos a menos que você <strong>explicitamente</strong>{" "}
            ative a sincronização (recurso pago, ContaLeve Premium).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-xl font-semibold">Plano grátis</h2>
          <p className="mb-3">
            No plano grátis, o ContaLeve{" "}
            <strong>
              não coleta, transmite ou armazena nenhum dado em servidores
              externos
            </strong>
            . Suas despesas, receitas e demais lançamentos ficam exclusivamente
            no banco de dados local do aplicativo (SQLite via Room), no seu
            próprio dispositivo.
          </p>
          <p className="mb-2">Nesse modo:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Não há login.</li>
            <li>Não há rastreadores de uso ou analytics.</li>
            <li>Não há publicidade nem identificadores publicitários.</li>
            <li>Não enviamos crash reports automáticos.</li>
            <li>
              Permissões de internet são usadas apenas se você optar pela
              versão Premium.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-xl font-semibold">
            Plano pago (ContaLeve Premium)
          </h2>
          <p className="mb-4">
            Ao assinar o ContaLeve Premium, você concorda com a coleta e o
            tratamento dos seguintes dados, exclusivamente para viabilizar os
            recursos pagos:
          </p>

          <h3 className="mb-2 text-lg font-semibold">Dados coletados</h3>
          <ol className="mb-4 list-decimal space-y-2 pl-6">
            <li>
              <strong>Endereço de e-mail</strong> — usado como sua identidade
              de login (OAuth do Google via Supabase). Necessário para
              autenticar você ao sincronizar entre dispositivos ou compartilhar
              com terceiros.
            </li>
            <li>
              <strong>Dados financeiros do app</strong> — suas despesas,
              receitas e lançamentos, copiados do banco local para o servidor
              remoto para permitir sincronização e backup.
            </li>
            <li>
              <strong>Identificador de workspace</strong> — código único do
              espaço de trabalho compartilhado, caso você compartilhe com
              outra pessoa.
            </li>
            <li>
              <strong>Metadados técnicos básicos</strong> — data/hora do último
              sync, número da versão do app. Não coletamos seu IMEI, número de
              telefone, contatos, localização ou histórico de navegação.
            </li>
          </ol>

          <h3 className="mb-2 text-lg font-semibold">Onde os dados ficam</h3>
          <ul className="mb-4 list-disc space-y-1 pl-6">
            <li>
              Os dados são armazenados na plataforma{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Supabase
              </a>
              , em servidores localizados em <strong>São Paulo, Brasil</strong>.
            </li>
            <li>
              Pagamentos são processados pelo <strong>Google Play Billing</strong>;
              o ContaLeve <strong>não recebe nem armazena dados de cartão de
              crédito</strong>.
            </li>
          </ul>

          <h3 className="mb-2 text-lg font-semibold">Para que usamos</h3>
          <ul className="mb-4 list-disc space-y-1 pl-6">
            <li>Sincronização entre seus dispositivos.</li>
            <li>
              Compartilhamento do workspace com pessoas que você convidou.
            </li>
            <li>Backup dos seus lançamentos.</li>
          </ul>

          <p>
            <strong>
              Não vendemos nem compartilhamos esses dados com terceiros
            </strong>{" "}
            para fins publicitários, marketing ou qualquer outra finalidade.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-xl font-semibold">Seus direitos</h2>
          <p className="mb-2">Você pode, a qualquer momento:</p>
          <ul className="mb-3 list-disc space-y-1 pl-6">
            <li>
              <strong>Exportar</strong> os seus dados — disponível em{" "}
              <em>Ajustes &gt; Sincronização</em>.
            </li>
            <li>
              <strong>Apagar todos os dados remotos</strong> — disponível em{" "}
              <em>Ajustes &gt; Sair da conta</em> (apaga a sessão; para deletar
              os dados associados ao seu e-mail, escreva para{" "}
              <a
                href="mailto:sjoel99@gmail.com"
                className="underline underline-offset-2"
              >
                sjoel99@gmail.com
              </a>
              ).
            </li>
            <li>
              <strong>Desinstalar o app</strong> — apaga automaticamente todos
              os dados locais.
            </li>
          </ul>
          <p>
            Atendimento de solicitações de exclusão: até <strong>30 dias</strong>{" "}
            a partir do recebimento do pedido por e-mail.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-xl font-semibold">Crianças</h2>
          <p>
            O ContaLeve não é destinado a crianças menores de 13 anos. Não
            coletamos intencionalmente dados de menores de 13 anos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-xl font-semibold">Mudanças nesta política</h2>
          <p>
            Atualizações desta política serão publicadas neste mesmo endereço,
            com a data de &ldquo;Última atualização&rdquo; no topo. Mudanças
            relevantes serão sinalizadas dentro do app na próxima abertura.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Contato</h2>
          <p>
            Dúvidas, pedidos de exclusão, qualquer assunto relacionado a dados:
          </p>
          <p className="mt-2 text-lg font-medium">
            <a
              href="mailto:sjoel99@gmail.com"
              className="underline underline-offset-2"
            >
              sjoel99@gmail.com
            </a>
          </p>
        </section>
      </article>
    </main>
  );
}
