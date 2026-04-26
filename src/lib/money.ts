const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlSigned = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  signDisplay: "exceptZero",
});

export function formatBRL(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return brl.format(cents / 100);
}

export function formatBRLSigned(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return brlSigned.format(cents / 100);
}

/** Converte string com vírgula ou ponto para centavos. Aceita negativo. */
export function parseBRLToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const negative = /^-/.test(trimmed) || /\(.*\)/.test(trimmed);
  // Remove R$, espaços, parênteses
  const clean = trimmed
    .replace(/R\$\s?/gi, "")
    .replace(/[()\s]/g, "")
    .replace(/^-/, "");
  // Se tem vírgula, é decimal pt-BR. Senão, ponto pode ser decimal.
  let normalized: string;
  if (clean.includes(",")) {
    normalized = clean.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = clean;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  const cents = Math.round(value * 100);
  return negative ? -cents : cents;
}

export function centsToInputString(
  cents: number | null | undefined,
): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}
