import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  ScrollText,
  Shield,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { AppFooter } from '@/components/dashboard/AppFooter';

const NAV = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/workspaces', label: 'Workspaces', icon: Building2 },
  { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectedFrom=/admin');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, is_superadmin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_superadmin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="sticky top-0 z-30 bg-rose-700 text-white">
        <div className="bg-rose-800/40 text-xs px-4 py-1.5 text-center font-medium tracking-wide">
          You&apos;re in <strong>Superadmin mode</strong>. Actions you take are
          logged.
        </div>
        <header className="flex items-center justify-between gap-4 px-4 md:px-8 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Shield className="h-5 w-5 shrink-0" />
            <h1 className="font-serif text-lg font-semibold truncate">
              7-Phera Admin
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-white hover:bg-rose-800"
            >
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to app
              </Link>
            </Button>
            <form action={logoutAction}>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-rose-800"
                type="submit"
              >
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <nav className="px-4 md:px-8 pb-2 flex gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-rose-800 transition-colors"
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        <div className="text-xs text-muted-foreground mb-3">
          Signed in as <strong>{profile?.full_name}</strong> ({profile?.email})
        </div>
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
