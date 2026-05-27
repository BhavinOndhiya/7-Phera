import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils/formatting';
import { SettingsForm } from './SettingsForm';
import { SettingsTeamCard } from './SettingsTeamCard';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Your account, language, and who can access this wedding workspace.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Workspace
        </h2>
        <SettingsTeamCard />
        <p className="text-xs text-muted-foreground px-1">
          Invite your partner, family, or planner. Each person gets their own login
          with Owner, Editor, or Viewer permissions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Your account
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-rose-500 text-white text-xl">
                  {getInitials(profile?.full_name ?? user.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-lg">
                  {profile?.full_name ?? user.email ?? 'Your account'}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {profile?.role && (
                  <Badge className="mt-1 capitalize" variant="secondary">
                    {profile.role}
                  </Badge>
                )}
              </div>
            </div>

            {profile ? (
              <SettingsForm profile={profile} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Your profile record is still loading. Try refreshing, or{' '}
                <Link href="/onboarding" className="text-rose-600 hover:underline">
                  complete onboarding
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
