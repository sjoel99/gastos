import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { Resend as ResendClient } from "resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/client";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { env } from "@/env";
import { isEmailAllowed } from "@/lib/allowed-emails";

const isDevAuth = !env.RESEND_API_KEY;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY || "dev-mode-no-send",
      from: env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        // Sempre loga (útil pra debug; o token só vale 1 hora e single-use).
        console.log("\n────────── MAGIC LINK ──────────");
        console.log(`para: ${identifier}`);
        console.log(`link: ${url}`);
        console.log("───────────────────────────────────────\n");
        if (isDevAuth) return;
        const resend = new ResendClient(env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
          from: env.EMAIL_FROM,
          to: identifier,
          subject: "Acesse Gastos",
          text: `Clique para entrar:\n${url}\n\nO link expira em 1 hora.`,
          html: `<p>Clique para entrar:</p><p><a href="${url}">${url}</a></p><p>O link expira em 1 hora.</p>`,
        });
        if (error) throw new Error(`Resend: ${error.message}`);
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      return await isEmailAllowed(user.email);
    },
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = (token?.sub ?? user?.id) as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/verify",
  },
  session: { strategy: "jwt" },
  trustHost: true,
});
