const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlSigned = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  signDisplay: "exceptZero",
});

// O ICU do Node usa NARROW NO-BREAK SPACE (U+202F) entre "R$" e o valor;
// alguns ambientes do browser usam outro caractere — daí hydration mismatch.
// Normaliza para um espaço comum.
function normalize(s: string): string {
  return s.replace(/[  ]/g, " ");
}

export function formatBRL(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return normalize(brl.format(cents / 100));
}

export function formatBRLSigned(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return normalize(brlSigned.format(cents / 100));
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
