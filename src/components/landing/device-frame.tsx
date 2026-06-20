import Image from "next/image";

/**
 * Mostra um screenshot REAL do app dentro de uma moldura de celular.
 * Os screenshots já incluem a status bar do device (ilha/notch no iOS),
 * então a moldura é só o bezel arredondado em volta.
 */
const DIMS = {
  ios: { w: 1206, h: 2622, radius: "rounded-[2.6rem]", border: "border-[12px]" },
  android: { w: 1080, h: 2400, radius: "rounded-[2.2rem]", border: "border-[11px]" },
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
  // Dimensiona pela LARGURA (className passa w-*). Pra manter o TAMANHO ORIGINAL
  // (mesma escala) entre as plataformas, use larguras na razão das capturas:
  // Android = iOS × 1080/1206 ≈ 0,896. Assim cada aparelho fica na sua proporção
  // real — iPhone mais alto, Android mais baixo/estreito.
  return (
    <div
      className={`overflow-hidden border-neutral-900 bg-neutral-900 shadow-2xl ring-1 ring-black/10 ${d.radius} ${d.border} ${className ?? ""}`}
    >
      <Image
        src={src}
        alt={alt}
        width={d.w}
        height={d.h}
        priority={priority}
        sizes="(max-width: 768px) 60vw, 260px"
        className="block h-auto w-full"
      />
    </div>
  );
}
