import {
  Building2,
  CalendarDays,
  ScrollText,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

async function getStats() {
  const admin = createServiceRoleClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

  const [
    usersResult,
    workspacesResult,
    eventsResult,
    signupsResult,
    recentUsers,
    recentWorkspaces,
  ] = await Promise.all([
    admin.from('users').select('id', { count: 'exact', head: true }),
    admin.from('workspaces').select('id', { count: 'exact', head: true }),
    admin.from('events').select('id', { count: 'exact', head: true }),
    admin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo),
    admin
      .from('users')
      .select('id, full_name, email, created_at, is_superadmin')
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('workspaces')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
    totalUsers: usersResult.count ?? 0,
    totalWorkspaces: workspacesResult.count ?? 0,
    totalEvents: eventsResult.count ?? 0,
    signups30d: signupsResult.count ?? 0,
    recentUsers: recentUsers.data ?? [],
    recentWorkspaces: recentWorkspaces.data ?? [],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const tiles = [
    { label: 'Users', value: stats.totalUsers, icon: Users, color: 'rose' },
    { label: 'Workspaces', value: stats.totalWorkspaces, icon: Building2, color: 'amber' },
    { label: 'Events planned', value: stats.totalEvents, icon: CalendarDays, color: 'emerald' },
    { label: 'New signups (30d)', value: stats.signups30d, icon: TrendingUp, color: 'sky' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Platform overview</h1>
        <p className="text-muted-foreground">Live numbers from your Supabase database.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {tile.label}
                </p>
                <tile.icon className={`h-5 w-5 text-${tile.color}-500`} />
              </div>
              <p className="text-3xl font-semibold mt-2">{tile.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Recent signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <ul className="divide-y -m-6">
                {stats.recentUsers.map((u) => (
                  <li key={u.id} className="px-6 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {u.full_name}
                        {u.is_superadmin && (
                          <span className="ml-2 text-[10px] uppercase bg-rose-100 text-rose-700 rounded px-1.5 py-0.5">
                            admin
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/users" className="text-xs text-rose-600 hover:underline">
              View all users →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Recent workspaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentWorkspaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">No workspaces yet.</p>
            ) : (
              <ul className="divide-y -m-6">
                {stats.recentWorkspaces.map((w) => (
                  <li key={w.id} className="px-6 py-3 flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{w.name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(w.created_at), { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/workspaces" className="text-xs text-rose-600 hover:underline">
              View all workspaces →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4" /> Audit log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All admin-level mutations are logged. <Link href="/admin/audit" className="text-rose-600 hover:underline">View →</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
