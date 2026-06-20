import Image from "next/image";

/**
 * Mostra um screenshot REAL do app dentro de uma moldura de celular.
 * Os screenshots já incluem a status bar do device (ilha/notch no iOS),
 * então a moldura é só o bezel arredondado em volta.
 */
const DIMS = {
  ios: { w: 1206, h: 2622, radius: "rounded-[2.6rem]", border: "border-[12px]" },
  android: { w: 1080, h: 1920, radius: "rounded-[1.9rem]", border: "border-[11px]" },
} as const;

export function DeviceFrame({
  src,
  alt,
  platform = "ios",
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  platform?: keyof typeof DIMS;
  priority?: boolean;
  className?: string;
}) {
  const d = DIMS[platform];
  // Dimensiona pela ALTURA (className deve passar h-*): assim iPhone e Android
  // — que têm proporções diferentes — aparecem do mesmo tamanho, como dois
  // celulares reais lado a lado. A largura segue a proporção de cada aparelho.
  return (
    <div
      className={`inline-block overflow-hidden border-neutral-900 bg-neutral-900 shadow-2xl ring-1 ring-black/10 ${d.radius} ${d.border} ${className ?? ""}`}
    >
      <Image
        src={src}
        alt={alt}
        width={d.w}
        height={d.h}
        priority={priority}
        sizes="(max-width: 768px) 60vw, 260px"
        className="block h-full w-auto"
      />
    </div>
  );
}
