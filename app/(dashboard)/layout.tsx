import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { AppFooter } from '@/components/dashboard/AppFooter';
import { WorkspaceProvider } from '@/lib/hooks/useWorkspace';
import { AdminImpersonationBanner } from '@/components/admin/AdminImpersonationBanner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (profile?.is_suspended) {
    redirect('/login?message=Your+account+has+been+suspended');
  }

  const { count: membershipCount } = await supabase
    .from('workspace_members')
    .select('workspace_id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const path = headers().get('x-pathname') ?? '';
  const onOnboarding = path.startsWith('/onboarding');

  if (
    !profile?.is_superadmin &&
    (membershipCount ?? 0) === 0 &&
    !onOnboarding
  ) {
    redirect('/onboarding');
  }

  return (
    <WorkspaceProvider>
      <div className="grid min-h-screen lg:grid-cols-[18rem_1fr] bg-muted/30">
        <div className="hidden lg:block border-r">
          <div className="sticky top-0 h-screen">
            <Sidebar />
          </div>
        </div>
        <div className="flex flex-col min-w-0 min-h-screen">
          <Header profile={profile} email={user.email ?? null} />
          <AdminImpersonationBanner />
          <main className="flex-1 p-4 md:p-8">{children}</main>
          <AppFooter />
        </div>
      </div>
    </WorkspaceProvider>
  );
}
