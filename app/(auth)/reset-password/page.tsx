import type { Metadata } from 'next';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata: Metadata = { title: 'New password' };

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Set a new password</h1>
        <p className="text-muted-foreground mt-1">
          Choose a strong password for your account.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
