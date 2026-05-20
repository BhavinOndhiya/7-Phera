import { createServiceRoleClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { AdminUsersTable } from './AdminUsersTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const admin = createServiceRoleClient();
  const q = (searchParams.q ?? '').trim();

  let query = admin
    .from('users')
    .select('id, full_name, email, role, is_superadmin, is_suspended, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: users } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold flex items-center gap-2">
          <Users className="h-7 w-7 text-rose-500" /> Users
        </h1>
        <p className="text-muted-foreground">
          Manage accounts across the platform.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <AdminUsersTable initialUsers={users ?? []} initialQuery={q} />
        </CardContent>
      </Card>
    </div>
  );
}
