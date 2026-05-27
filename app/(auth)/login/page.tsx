import Link from 'next/link';
import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string; redirectedFrom?: string };
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Welcome back</h1>
        <p className="text-muted-foreground mt-1">
          Sign in to continue planning your special day.
        </p>
      </div>

      {searchParams.message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {searchParams.message}
        </div>
      )}

      <LoginForm redirectedFrom={searchParams.redirectedFrom} />

      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
        <p>
          Invited to a wedding workspace?{' '}
          <Link
            href="/invite/accept"
            className="text-primary hover:underline font-medium"
          >
            Enter invitation link
          </Link>
        </p>
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
