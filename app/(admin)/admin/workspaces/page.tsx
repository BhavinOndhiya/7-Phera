import { Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminWorkspacesTable } from './AdminWorkspacesTable';

export const dynamic = 'force-dynamic';

export default async function AdminWorkspacesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const admin = createServiceRoleClient();
  const q = (searchParams.q ?? '').trim();

  let query = admin
    .from('workspaces')
    .select('id, name, slug, created_at, created_by')
    .order('created_at', { ascending: false })
    .limit(200);

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data: workspaces } = await query;

  const wsIds = (workspaces ?? []).map((w) => w.id);
  const ownerIds = (workspaces ?? [])
    .map((w) => w.created_by)
    .filter(Boolean) as string[];
  const [membersResult, ownersResult] = await Promise.all([
    wsIds.length
      ? admin
          .from('workspace_members')
          .select('workspace_id, user_id, role')
          .in('workspace_id', wsIds)
      : { data: [] },
    ownerIds.length
      ? admin.from('users').select('id, full_name, email').in('id', ownerIds)
      : { data: [] },
  ]);

  const memberCountById = new Map<string, number>();
  for (const m of membersResult.data ?? []) {
    memberCountById.set(
      m.workspace_id,
      (memberCountById.get(m.workspace_id) ?? 0) + 1
    );
  }
  const ownerById = new Map(
    (ownersResult.data ?? []).map((u) => [u.id, u])
  );

  const rows = (workspaces ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    createdAt: w.created_at,
    memberCount: memberCountById.get(w.id) ?? 0,
    ownerName: w.created_by ? ownerById.get(w.created_by)?.full_name ?? '—' : '—',
    ownerEmail: w.created_by ? ownerById.get(w.created_by)?.email ?? '' : '',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold flex items-center gap-2">
          <Building2 className="h-7 w-7 text-rose-500" /> Workspaces
        </h1>
        <p className="text-muted-foreground">
          Every wedding workspace on the platform. Enter god-mode on any one.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <AdminWorkspacesTable initial={rows} initialQuery={q} />
        </CardContent>
      </Card>
    </div>
  );
}
