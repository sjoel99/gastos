/* eslint-disable @next/next/no-img-element */

const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.sjoel99.contaleve";

/**
 * Badges das lojas usando o ARTWORK OFICIAL (não recriar — exigência das
 * diretrizes de marca da Google e da Apple).
 * - Google Play: badge oficial pt-BR, já no ar e linkado.
 * - App Store: badge oficial pt-BR, porém DESABILITADO ("Em breve") até o
 *   app iOS publicar. A diretriz da Apple só permite linkar o badge para a
 *   página do app na App Store; quando publicar, é só envolver num <a> com a
 *   URL e remover o selo "Em breve".
 *
 * Assets: public/badges/. Altura do Google um tico maior porque o PNG do
 * Google traz mais "clear space" embutido que o SVG da Apple.
 */
export function StoreBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Disponível no Google Play"
        className="inline-block transition-opacity hover:opacity-85"
      >
        <img
          src="/badges/google-play-pt-br.png"
          alt="Disponível no Google Play"
          className="h-[54px] w-auto"
        />
      </a>

      <div className="relative inline-block" aria-label="Em breve na App Store">
        <img
          src="/badges/app-store-pt-br.svg"
          alt="Em breve na App Store"
          className="h-[40px] w-auto opacity-50 grayscale"
        />
        <span className="absolute -right-1 -top-2 rounded-full bg-foreground px-2 py-0.5 text-[0.6rem] font-semibold text-background shadow-sm">
          Em breve
        </span>
      </div>
    </div>
  );
}
