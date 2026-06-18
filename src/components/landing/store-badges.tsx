import { Apple, Play } from "lucide-react";

const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.sjoel99.contaleve";

/**
 * Botões de download. A Play Store já está no ar; a App Store fica como "em
 * breve" até a versão iOS publicar (troca a `div` por um `a` com a URL quando
 * sair).
 */
export function StoreBadges() {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl bg-foreground px-5 py-3 text-background transition-opacity hover:opacity-90"
      >
        <Play className="size-6 shrink-0 fill-current" />
        <span className="flex flex-col leading-tight">
          <span className="text-[0.65rem] opacity-70">Disponível no</span>
          <span className="text-base font-semibold">Google Play</span>
        </span>
      </a>

      <div
        className="flex cursor-default items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-muted-foreground"
        aria-disabled
      >
        <Apple className="size-6 shrink-0" />
        <span className="flex flex-col leading-tight">
          <span className="text-[0.65rem] opacity-70">Em breve na</span>
          <span className="text-base font-semibold">App Store</span>
        </span>
      </div>
    </div>
  );
}
