"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { importFromXlsxBuffer, type ImportSummary } from "@/lib/xlsx-import";

export type ImportFormState =
  | { ok: true; summary: ImportSummary }
  | { ok: false; error: string }
  | undefined;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function importXlsxAction(
  _prev: ImportFormState,
  formData: FormData,
): Promise<ImportFormState> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Não autenticado." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo .xlsx." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Arquivo maior que 10 MB." };
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return { ok: false, error: "Formato inválido — esperado .xlsx." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const summary = await importFromXlsxBuffer(buffer);
    revalidatePath("/matriz", "layout");
    revalidatePath("/despesas");
    return { ok: true, summary };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao importar.";
    return { ok: false, error: msg };
  }
}
