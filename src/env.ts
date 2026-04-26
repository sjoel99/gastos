import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.string().optional(),
  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().min(1),
  ALLOWED_EMAILS: z.string().min(1),
  VAPID_PUBLIC_KEY: z.string().default(""),
  VAPID_PRIVATE_KEY: z.string().default(""),
  VAPID_SUBJECT: z.string().default(""),
  CRON_SECRET: z.string().default(""),
});

export const env = schema.parse(process.env);

export const allowedEmailsFromEnv = env.ALLOWED_EMAILS.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
