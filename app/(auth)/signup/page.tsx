import Link from 'next/link';
import type { Metadata } from 'next';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = { title: 'Create your account' };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Create your account</h1>
        <p className="text-muted-foreground mt-1">
          Start planning your dream wedding in minutes.
        </p>
      </div>

      <SignupForm />

      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
