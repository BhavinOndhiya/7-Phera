import { Resend } from 'resend';
import { brand } from './theme';
import { accountConfirmation } from './templates/accountConfirmation';
import { passwordRecovery } from './templates/passwordRecovery';

export type AuthEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function resendFromAddress(): string {
  return process.env.RESEND_FROM ?? `${brand.name} <onboarding@resend.dev>`;
}

function resendReplyTo(): string | undefined {
  const v = process.env.RESEND_REPLY_TO?.trim();
  return v || undefined;
}

export async function sendAccountConfirmationEmail(opts: {
  to: string;
  fullName: string;
  confirmUrl: string;
  isResend?: boolean;
}): Promise<AuthEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      error:
        'RESEND_API_KEY is not set. Add it in Vercel env to send signup confirmation emails.',
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const replyTo = resendReplyTo();
    const { data, error } = await resend.emails.send({
      from: resendFromAddress(),
      to: opts.to,
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: opts.isResend
        ? `New confirmation link · ${brand.name}`
        : `Confirm your ${brand.name} account`,
      html: accountConfirmation({
        fullName: opts.fullName,
        email: opts.to,
        confirmUrl: opts.confirmUrl,
        isResend: opts.isResend,
      }),
    });

    if (error) {
      console.error('[sendAuthEmail] confirmation rejected', {
        to: opts.to,
        error,
      });
      return { ok: false, error: `${error.name}: ${error.message}` };
    }

    console.log('[sendAuthEmail] confirmation sent', {
      to: opts.to,
      resendId: data?.id,
    });
    return { ok: true, id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to send email';
    console.error('[sendAuthEmail] confirmation failed', e);
    return { ok: false, error: message };
  }
}

export async function sendPasswordRecoveryEmail(opts: {
  to: string;
  resetUrl: string;
}): Promise<AuthEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      error: 'RESEND_API_KEY is not set. Cannot send password reset emails.',
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const replyTo = resendReplyTo();
    const { data, error } = await resend.emails.send({
      from: resendFromAddress(),
      to: opts.to,
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: `Reset your ${brand.name} password`,
      html: passwordRecovery({
        email: opts.to,
        resetUrl: opts.resetUrl,
      }),
    });

    if (error) {
      console.error('[sendAuthEmail] recovery rejected', { to: opts.to, error });
      return { ok: false, error: `${error.name}: ${error.message}` };
    }

    return { ok: true, id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to send email';
    return { ok: false, error: message };
  }
}
