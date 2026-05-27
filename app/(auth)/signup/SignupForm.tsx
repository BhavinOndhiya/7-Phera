'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { signupAction } from '../actions';

const ROLES = [
  { value: 'bride', label: 'Bride', emoji: 'B' },
  { value: 'groom', label: 'Groom', emoji: 'G' },
  { value: 'family', label: 'Family', emoji: 'F' },
  { value: 'planner', label: 'Planner', emoji: 'P' },
] as const;

export function SignupForm() {
  const router = useRouter();
  const search = useSearchParams();
  const inviteToken = search.get('invite');
  const prefilledEmail = search.get('email');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>('bride');

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set('role', role);
    if (inviteToken) formData.set('invite_token', inviteToken);
    startTransition(async () => {
      const result = await signupAction(formData);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      if (result.needsEmailConfirmation) {
        toast.success('Confirmation email sent', {
          description:
            'Check your inbox (and spam) for an email from Saath Phere with a confirm button.',
          duration: 8000,
        });
      } else {
        toast.success('Account created!');
      }
      router.push(result.redirectTo || '/dashboard');
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {inviteToken && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-900">
          You&apos;re signing up to accept an invitation. You&apos;ll be added to the
          workspace after creating your account.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="full_name"
            name="full_name"
            placeholder="Bhavin Ondhiya"
            required
            minLength={2}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            defaultValue={prefilledEmail ?? undefined}
            readOnly={!!prefilledEmail}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="6+ characters"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
              autoComplete="tel"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>I am the…</Label>
        <div className="grid grid-cols-4 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors ${
                role === r.value
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-border bg-background hover:border-rose-200'
              }`}
            >
              <span className="text-xl font-bold">{r.emoji}</span>
              <span className="text-xs font-medium">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full bg-rose-500 hover:bg-rose-600"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account…
          </>
        ) : (
          'Create account'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By signing up, you agree to our terms and privacy policy.
      </p>
    </form>
  );
}
