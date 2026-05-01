import { z } from "zod";

/** FormData boolean: aceita "on" (checkbox) ou "true". */
export const boolField = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");
