'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { resetPasswordAction } from '../actions';

export function ResetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Password updated!');
      router.push(result.redirectTo || '/dashboard');
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={6}
          placeholder="6+ characters"
          autoComplete="new-password"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-rose-500 hover:bg-rose-600"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…
          </>
        ) : (
          'Update password'
        )}
      </Button>
    </form>
  );
}
