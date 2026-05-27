'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPasswordAction } from '../actions';

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      toast.success(result.message ?? 'Check your inbox!');
    });
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 space-y-2">
        <p>
          If an account exists for that email, we sent a password reset link.
          Check your inbox and spam folder.
        </p>
        <p className="text-emerald-700/90">
          The link goes to <strong>7-phera.vercel.app</strong> (not localhost).
          Use only the newest email — older links expire.
        </p>
      </div>
    );
  }

  return (
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
            className="pl-9"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-rose-500 hover:bg-rose-600"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          'Send reset link'
        )}
      </Button>
    </form>
  );
}
