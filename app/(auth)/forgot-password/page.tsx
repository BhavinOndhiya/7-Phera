import Link from 'next/link';
import type { Metadata } from 'next';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Reset your password</h1>
        <p className="text-muted-foreground mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-sm">
        <Link href="/login" className="text-primary hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
