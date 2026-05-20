'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Heart, Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface InviteDetails {
  email: string;
  role: string;
  workspaceName: string;
  workspaceId: string;
  expiresAt: string;
  accepted: boolean;
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = createClient();
  const token = search.get('token') ?? '';
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token');
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data }, inviteRes] = await Promise.all([
        supabase.auth.getUser(),
        fetch(`/api/workspaces/accept?token=${encodeURIComponent(token)}`),
      ]);
      setUserEmail(data.user?.email ?? null);
      if (!inviteRes.ok) {
        const j = await inviteRes.json().catch(() => ({ error: 'Not found' }));
        setError(j.error ?? 'Invitation not found');
      } else {
        setInvite(await inviteRes.json());
      }
      setLoading(false);
    })();
  }, [token, supabase]);

  function accept() {
    startTransition(async () => {
      const res = await fetch('/api/workspaces/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Could not join workspace');
        return;
      }
      toast.success(`Joined ${invite?.workspaceName ?? 'workspace'}`);
      document.cookie = `active_workspace_id=${json.workspaceId}; path=/; max-age=${365 * 86400}; SameSite=Lax`;
      router.replace('/dashboard');
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 space-y-5 text-center">
          {error || !invite ? (
            <>
              <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                <ShieldX className="h-7 w-7 text-rose-500" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-semibold">
                  Invitation problem
                </h1>
                <p className="text-muted-foreground mt-2">
                  {error ?? 'This invitation could not be loaded.'}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/">Go home</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                <Heart className="h-7 w-7 text-rose-500" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-semibold">
                  Join {invite.workspaceName}
                </h1>
                <p className="text-muted-foreground mt-2">
                  You&apos;ve been invited as a{' '}
                  <strong className="capitalize">{invite.role}</strong>.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invitation sent to <strong>{invite.email}</strong>
                </p>
              </div>

              {!userEmail ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You need an account to join.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                      <Link
                        href={`/login?invite=${encodeURIComponent(token)}&redirectedFrom=${encodeURIComponent('/invite/accept?token=' + token)}`}
                      >
                        Sign in
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-rose-500 hover:bg-rose-600"
                    >
                      <Link
                        href={`/signup?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invite.email)}`}
                      >
                        Sign up
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : userEmail.toLowerCase() !== invite.email.toLowerCase() ? (
                <div className="space-y-3">
                  <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                    You&apos;re signed in as <strong>{userEmail}</strong>, but this
                    invite is for <strong>{invite.email}</strong>. Please sign out
                    and sign in with the correct email.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/login">Switch account</Link>
                  </Button>
                </div>
              ) : invite.accepted ? (
                <div>
                  <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                    This invitation has already been used.
                  </p>
                  <Button asChild className="mt-3 bg-rose-500 hover:bg-rose-600">
                    <Link href="/dashboard">Go to dashboard</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={accept}
                  disabled={isPending}
                  className="w-full bg-rose-500 hover:bg-rose-600"
                >
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Accept invitation
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
