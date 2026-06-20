import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ChartColumnBig,
  HeartPulse,
  ShieldCheck,
  TrendingUp,
  Users,
  WifiOff,
} from "lucide-react";
import { DeviceFrame } from "@/components/landing/device-frame";
import { StoreBadges } from "@/components/landing/store-badges";

const SITE_URL = "https://contaleve.sjoel99.com";
const OG_DESC =
  "App de controle de gastos e finanças da família: despesas, receitas e saldo. Funciona offline, sem login e de graça. Para iPhone e Android.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ContaLeve — Controle de gastos da família, sem peso",
  description: OG_DESC,
  keywords: [
    "controle de gastos",
    "controle financeiro",
    "finanças pessoais",
    "organizar contas",
    "despesas e receitas",
    "orçamento familiar",
    "app de finanças",
    "planilha de gastos",
    "controle de despesas",
    "saúde financeira",
    "inflação pessoal",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "ContaLeve — Controle de gastos da família, sem peso",
    description: OG_DESC,
    url: SITE_URL,
    siteName: "ContaLeve",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContaLeve — Controle de gastos da família, sem peso",
    description: OG_DESC,
  },
};

/** Telas reais do app — usadas no hero e na galeria. */
const screens = [
  { key: "1-mes", title: "Visão do mês", text: "Total, pago e o que falta — num relance." },
  { key: "2-anual", title: "Visão anual", text: "Gastos do ano em barras, com a receita por cima." },
  { key: "3-saude", title: "Saúde financeira", text: "Uma nota de 0 a 100 sobre suas finanças." },
  { key: "4-inflacao", title: "Inflação Pessoal", text: "A sua inflação real, não a média do país." },
  { key: "5-lancamentos", title: "Lançamentos", text: "Cadastre uma vez; repete todo mês." },
  { key: "6-calendario", title: "Calendário", text: "Todos os vencimentos em um calendário." },
] as const;

const features = [
  {
    icon: CalendarDays,
    title: "Mês a mês, sem esforço",
    text: "Veja o total, o que já foi pago e o que falta. Despesas recorrentes se repetem sozinhas — você só confirma.",
  },
  {
    icon: ChartColumnBig,
    title: "Visão anual",
    text: "Gráfico de barras com pago, pendente e cartão; receitas e saldo do ano em um relance.",
  },
  {
    icon: HeartPulse,
    title: "Saúde financeira",
    text: "Um score de 0 a 100 sobre poupança, comprometimento da renda e consistência dos últimos meses.",
  },
  {
    icon: TrendingUp,
    title: "Inflação Pessoal",
    text: "Sua inflação real, ponderando o IPCA pelos seus próprios gastos — não a média do país.",
  },
  {
    icon: WifiOff,
    title: "Funciona offline",
    text: "Os dados vivem no seu aparelho. O app abre direto, sem login e sem internet. De graça.",
  },
  {
    icon: Users,
    title: "Compartilhe com a família",
    text: "Um código de convite junta dois aparelhos no mesmo espaço — Android e iPhone, no mesmo orçamento.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "ContaLeve",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Android, iOS",
            description: OG_DESC,
            url: SITE_URL,
            inLanguage: "pt-BR",
            offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
            downloadUrl:
              "https://play.google.com/store/apps/details?id=com.sjoel99.contaleve",
          }),
        }}
      />
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="size-7" />
            <span className="text-lg">ContaLeve</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#recursos" className="hidden hover:text-foreground sm:block">
              Recursos
            </a>
            <a href="#baixar" className="hover:text-foreground">
              Baixar
            </a>
            <Link href="/privacy" className="hover:text-foreground">
              Privacidade
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--primary-soft),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Sem coleta de dados · 100% local
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Suas contas,
              <br />
              <span className="text-primary">sem peso.</span>
            </h1>
            <p className="mt-5 max-w-md text-pretty text-lg text-muted-foreground">
              O controle financeiro da família — despesas, receitas e saldo — num
              app que abre direto, funciona offline e é de graça.
            </p>
            <div className="mt-8" id="baixar">
              <StoreBadges />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Grátis no Android e iPhone. Backup e sync na nuvem com o ContaLeve
              Premium.
            </p>
          </div>
          <div className="relative flex h-[420px] items-center justify-center md:h-[560px] md:justify-end">
            {/* Android atrás, iPhone à frente — mostra as duas plataformas */}
            <DeviceFrame
              platform="android"
              src="/shots/android/1-mes.png"
              alt="ContaLeve no Android — tela do mês"
              className="absolute left-2 top-6 w-[150px] -rotate-6 md:left-4 md:w-[210px]"
            />
            <DeviceFrame
              platform="ios"
              src="/shots/ios/1-mes.png"
              alt="ContaLeve no iPhone — tela do mês"
              priority
              className="relative w-[180px] translate-x-6 rotate-3 md:w-[250px]"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Tudo o que a planilha fazia — e o que ela nunca fez
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Pensado para o orçamento de casa: simples no dia a dia, esperto quando
            você precisa entender para onde vai o dinheiro.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-sm"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery — telas reais do app */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            O app por dentro
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            As mesmas telas no iPhone e no Android — os dados ficam no aparelho e
            sincronizam quando você quiser.
          </p>
          <div className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {screens.map((s, i) => {
              const platform = i % 2 === 0 ? "ios" : "android";
              return (
                <figure
                  key={s.key}
                  className="flex shrink-0 snap-center flex-col items-center"
                >
                  <DeviceFrame
                    platform={platform}
                    src={`/shots/${platform}/${s.key}.png`}
                    alt={`${s.title} — ContaLeve no ${platform === "ios" ? "iPhone" : "Android"}`}
                    className="w-[210px]"
                  />
                  <figcaption className="mt-4 max-w-[210px] text-center">
                    <span className="block font-semibold">{s.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {s.text}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* Privacy emphasis */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-8 md:p-12">
          <ShieldCheck className="size-9 text-primary" />
          <h2 className="mt-4 max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
            Seus dados são seus. Ponto.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            O ContaLeve guarda tudo no seu próprio aparelho. Não há login
            obrigatório, não há rastreamento e nada é enviado para servidores no
            modo grátis. Se quiser backup e compartilhamento entre aparelhos, o
            ContaLeve Premium sincroniza com a nuvem — e só então, com o seu aval.
          </p>
          <Link
            href="/privacy"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            Ler a política de privacidade →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="size-5" />
            <span>ContaLeve · {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacidade
            </Link>
            <a href="mailto:sjoel99@gmail.com" className="hover:text-foreground">
              Contato
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="cl-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.55 0.22 305)" />
          <stop offset="1" stopColor="oklch(0.42 0.21 305)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#cl-logo)" />
      <path
        d="M11 19.5a5 5 0 1 0 0-7"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 21.5q6 4 12 0"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}
