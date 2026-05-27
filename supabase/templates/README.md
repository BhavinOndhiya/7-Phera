# Saath Phere — Supabase auth email templates

These six HTML files are the branded versions of every email Supabase Auth can
send on our behalf. They share the same rose / gold look as the in-app UI and
the Resend-based emails in [`lib/emails/`](../../lib/emails).

| File | When Supabase sends it | Key variables |
| --- | --- | --- |
| `confirmation.html` | Right after `supabase.auth.signUp` if email confirmation is enabled | `{{ .ConfirmationURL }}`, `{{ .Email }}` |
| `recovery.html` | When a user requests a password reset via `resetPasswordForEmail` | `{{ .ConfirmationURL }}`, `{{ .Token }}` |
| `magic_link.html` | When a user calls `signInWithOtp({ email })` | `{{ .ConfirmationURL }}`, `{{ .Token }}` |
| `invite.html` | When the service role calls `admin.inviteUserByEmail` (see [`app/api/collaborators/invite`](../../app/api/collaborators/invite/route.ts)) | `{{ .ConfirmationURL }}`, `{{ .Email }}` |
| `email_change.html` | When a user changes their email via `updateUser({ email })` | `{{ .ConfirmationURL }}`, `{{ .NewEmail }}` |
| `reauthentication.html` | When a sensitive action needs re-verification | `{{ .Token }}` |

> Workspace collaborator invitations are sent via Resend, **not** Supabase. That
> template lives in [`lib/emails/templates/workspaceInvitation.ts`](../../lib/emails/templates/workspaceInvitation.ts).
> The same is true of guest wedding invitations.

## Local development

`supabase/config.toml` already references each file under
`[auth.email.template.*]`. Whenever you run:

```bash
supabase start
# or
supabase stop && supabase start
```

the CLI picks up the templates, and every email triggered locally is captured
by Inbucket at <http://127.0.0.1:54324>. Open that URL, trigger a signup or
"forgot password" from `http://localhost:3000`, and the branded email will
appear there.

If you edit a template while Supabase is running, restart it for the change to
take effect.

## Production: auth emails use Resend (not Supabase SMTP)

Signup confirmation and password reset are sent by the **Next.js app via Resend**
(`lib/emails/sendAuthEmail.ts`), using the same branded layout as guest invitations.
Supabase only generates the secure link; it does **not** need to send those emails.

In the Supabase Dashboard:

1. **Authentication → Providers → Email** — keep **Confirm email** **ON** so users must verify before signing in.
2. You do **not** need to paste templates below for signup/reset if the app handles mail (optional fallback only).
3. **Authentication → URL configuration** — set Site URL + Redirect URLs (see below).

## Hosted / production Supabase (optional template paste)

Hosted projects ignore `config.toml`. To deploy these templates as a fallback:

1. Open the project at <https://supabase.com/dashboard>.
2. Go to **Authentication → Email Templates**.
3. For each template type (Confirm signup, Reset password, Magic link, Invite
   user, Change email address, Reauthentication), paste the corresponding HTML
   file's contents into the template body.
4. Set the subject to match `config.toml` (e.g. *Reset your Saath Phere
   password*).
5. Save.

You should also set **Site URL** and **Redirect URLs** in
**Authentication → URL Configuration** so the `{{ .ConfirmationURL }}` points
back to your deployment (e.g. `https://saathphere.com/auth/callback`).

## Editing tips

- These are plain HTML with **inline styles only** — Tailwind classes and
  external CSS won't apply once an email client (Gmail, Outlook, Apple Mail)
  strips `<style>` blocks or `<link>` tags.
- Web fonts are intentionally avoided. We fall back to `Georgia` for headings
  and system sans-serif for buttons.
- The colour tokens come from [`lib/emails/theme.ts`](../../lib/emails/theme.ts).
  Keep both in sync when rebranding.
- Supabase's Go template engine uses `{{ .Variable }}`. Don't escape the dot —
  it's part of the syntax.

## Variable reference

Supabase auth templates have access to:

| Variable | Notes |
| --- | --- |
| `{{ .ConfirmationURL }}` | The full link the user should click. Already includes the token & redirect path. |
| `{{ .Token }}` | 6-digit OTP, useful for "type a code instead" copy. |
| `{{ .TokenHash }}` | Hashed token; rarely used in templates. |
| `{{ .SiteURL }}` | The Site URL set in Supabase. |
| `{{ .Email }}` | The recipient's email. |
| `{{ .NewEmail }}` | Only present on `email_change.html`. |
| `{{ .Data.full_name }}` | Custom metadata passed at signup, if any. |

See <https://supabase.com/docs/guides/auth/auth-email-templates> for the full
reference.
