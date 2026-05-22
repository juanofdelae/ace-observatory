import "server-only";

import { Resend } from "resend";

import { env } from "@/lib/env";

export type MailMessage = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  /** Optional override; defaults to env.EMAIL_FROM. */
  from?: string;
  replyTo?: string;
};

export type MailResult =
  | { ok: true; mode: "live" | "dry-run"; id?: string }
  | { ok: false; mode: "live" | "dry-run"; reason: string };

let cachedClient: Resend | null = null;

function isLive(): boolean {
  return !!env.RESEND_API_KEY && env.RESEND_API_KEY !== "re_dev_placeholder";
}

function client(): Resend {
  if (!cachedClient) {
    cachedClient = new Resend(env.RESEND_API_KEY!);
  }
  return cachedClient;
}

/**
 * Send transactional mail with automatic dry-run fallback when RESEND_API_KEY
 * is missing. Dry-run logs the attempt to stdout so the rest of the pipeline
 * (cron, scheduling, status tracking) is exercisable in dev without burning
 * real sends.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  const from = message.from ?? env.EMAIL_FROM;
  if (!isLive()) {
    console.log(
      `[mail:dry-run] to=${message.to.join(",")} subject="${message.subject}" from="${from}"`,
    );
    return { ok: true, mode: "dry-run" };
  }
  try {
    const { data, error } = await client().emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo ?? env.EMAIL_REPLY_TO ?? undefined,
    });
    if (error) return { ok: false, mode: "live", reason: error.message };
    return { ok: true, mode: "live", id: data?.id };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, mode: "live", reason };
  }
}
