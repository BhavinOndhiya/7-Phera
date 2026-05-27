'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { loginAction, resendConfirmationAction } from '../actions';

export function LoginForm({
  redirectedFrom,
  showConfirmationBanner,
}: {
  redirectedFrom?: string;
  showConfirmationBanner?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isPending, startLoginTransition] = useTransition();
  const [isResendPending, startResendTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(showConfirmationBanner ?? false);

  function onSubmit(formData: FormData) {
    setError(null);
    const submittedEmail = String(formData.get('email') ?? '');
    setEmail(submittedEmail);
    startLoginTransition(async () => {
      const result = await loginAction(formData);
      if (!result.ok) {
        setError(result.error);
        if (result.hint === 'resend_confirmation') {
          setShowResend(true);
        }
        toast.error(result.error);
        return;
      }
      toast.success('Welcome back!');
      router.push(redirectedFrom || result.redirectTo || '/dashboard');
      router.refresh();
    });
  }

  function onResend() {
    if (!email.trim()) {
      toast.error('Enter your email above first');
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set('email', email.trim());
    startResendTransition(async () => {
      const result = await resendConfirmationAction(fd);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(
        result.message ?? 'Confirmation email sent — check your inbox'
      );
    });
  }

  return (
    <div className="space-y-4">
      <form action={onSubmit} className="space-y-4">
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
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
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
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 space-y-2">
        <button
          type="button"
          onClick={() => setShowResend((v) => !v)}
          className="text-sm font-medium text-amber-900 w-full text-left"
        >
          {showResend ? '▼' : '▶'} Didn&apos;t get the confirmation email?
        </button>
        {showResend && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-amber-800/90 leading-relaxed">
              Confirmation links expire. Use the email you signed up with and we&apos;ll
              send a fresh link via Resend.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-amber-300 bg-white hover:bg-amber-50"
              disabled={isResendPending || !email.trim()}
              onClick={onResend}
            >
              {isResendPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Resend confirmation email
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
