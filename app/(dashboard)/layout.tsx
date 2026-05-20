import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

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

  return (
    <div className="grid min-h-screen lg:grid-cols-[18rem_1fr] bg-muted/30">
      <div className="hidden lg:block border-r">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>
      <div className="flex flex-col min-w-0">
        <Header profile={profile} email={user.email ?? null} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
