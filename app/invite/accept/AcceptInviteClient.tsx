'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Heart, KeyRound, Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { parseWorkspaceInviteToken } from '@/lib/utils/inviteToken';

interface InviteDetails {
  email: string;
  role: string;
  workspaceName: string;
  workspaceId: string;
  expiresAt: string;
  accepted: boolean;
}

function InviteTokenForm({
  initialValue = '',
  submitLabel = 'Continue',
  onSubmit,
  busy,
}: {
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (token: string) => void;
  busy?: boolean;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseWorkspaceInviteToken(value);
    if (!parsed) {
      toast.error('Paste your invitation link or token');
      return;
    }
    onSubmit(parsed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left w-full">
      <div className="space-y-2">
        <Label htmlFor="invite-token">Invitation link or token</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="invite-token"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste full link or token from your invite"
            className="pl-9"
            autoComplete="off"
            disabled={busy}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Example:{' '}
          <span className="font-mono text-[10px] break-all">
            …/invite/accept?token=abc123
          </span>
        </p>
      </div>
      <Button
        type="submit"
        disabled={busy}
        className="w-full bg-rose-500 hover:bg-rose-600"
      >
        {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}

export function AcceptInviteClient() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = createClient();
  const urlToken = parseWorkspaceInviteToken(search.get('token') ?? '');

  const [activeToken, setActiveToken] = useState(urlToken);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(urlToken));
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [lookupPending, startLookupTransition] = useTransition();

  const loadInvite = useCallback(
    async (token: string) => {
      if (!token) {
        setInvite(null);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setInvite(null);
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
    },
    [supabase]
  );

  useEffect(() => {
    setActiveToken(urlToken);
  }, [urlToken]);

  useEffect(() => {
    loadInvite(activeToken);
  }, [activeToken, loadInvite]);

  function applyToken(raw: string) {
    const parsed = parseWorkspaceInviteToken(raw);
    if (!parsed) {
      toast.error('Invalid invitation link or token');
      return;
    }
    setActiveToken(parsed);
    router.replace(`/invite/accept?token=${encodeURIComponent(parsed)}`);
  }

  function accept() {
    if (!activeToken) return;
    startTransition(async () => {
      const res = await fetch('/api/workspaces/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: activeToken }),
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

  if (!activeToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 space-y-5 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
              <KeyRound className="h-7 w-7 text-rose-500" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold">Join a wedding</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Paste the invitation link or token shared with you to access the
                planner workspace.
              </p>
            </div>
            <InviteTokenForm
              busy={lookupPending}
              onSubmit={(t) =>
                startLookupTransition(() => applyToken(t))
              }
            />
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-rose-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
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
                <p className="text-muted-foreground mt-2 text-sm">{error}</p>
              </div>
              <InviteTokenForm
                initialValue={activeToken}
                submitLabel="Try again"
                busy={lookupPending}
                onSubmit={(t) =>
                  startLookupTransition(() => applyToken(t))
                }
              />
              <Button asChild variant="ghost" size="sm">
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
                <div className="space-y-3 w-full">
                  <p className="text-sm text-muted-foreground">
                    You need an account to join.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                      <Link
                        href={`/login?invite=${encodeURIComponent(activeToken)}&redirectedFrom=${encodeURIComponent('/invite/accept?token=' + activeToken)}`}
                      >
                        Sign in
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-rose-500 hover:bg-rose-600"
                    >
                      <Link
                        href={`/signup?invite=${encodeURIComponent(activeToken)}&email=${encodeURIComponent(invite.email)}`}
                      >
                        Sign up
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : userEmail.toLowerCase() !== invite.email.toLowerCase() ? (
                <div className="space-y-3 w-full">
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

              <details className="text-left w-full text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Wrong link? Enter a different token
                </summary>
                <div className="mt-3 pt-3 border-t">
                  <InviteTokenForm
                    busy={lookupPending}
                    submitLabel="Load invitation"
                    onSubmit={(t) =>
                      startLookupTransition(() => applyToken(t))
                    }
                  />
                </div>
              </details>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
