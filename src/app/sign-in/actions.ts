"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isEmailAllowed } from "@/lib/allowed-emails";

export type SignInState = { error?: string } | undefined;

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) return { error: "Informe um e-mail." };
  if (!(await isEmailAllowed(email))) {
    return { error: "E-mail não autorizado." };
  }

  try {
    await signIn("resend", { email, redirectTo: "/matriz" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Falha ao enviar o link. Tente novamente." };
    }
    throw err;
  }
}
