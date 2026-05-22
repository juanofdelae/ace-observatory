import { z } from "zod";

/**
 * Server-side env contract. Validated at module load — importing this file
 * with a missing or malformed variable crashes the app immediately, rather
 * than failing later with a confusing runtime error.
 */
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid Postgres URL"),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z
    .string()
    .min(16, "NEXTAUTH_SECRET must be >= 16 chars (use `openssl rand -base64 32`)"),
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().min(1),
  EMAIL_REPLY_TO: optionalString.pipe(z.string().email().optional()),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_URL: optionalString.pipe(z.string().url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPABASE_STORAGE_BUCKET: optionalString.pipe(z.string().default("agreements").optional()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  · ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
