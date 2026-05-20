import { ScrollText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const admin = createServiceRoleClient();
  const { data: logs } = await admin
    .from('admin_audit_log')
    .select('id, actor_id, action, target_type, target_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const actorIds = Array.from(new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean) as string[]));
  const { data: actors } = actorIds.length
    ? await admin.from('users').select('id, full_name, email').in('id', actorIds)
    : { data: [] };
  const actorById = new Map((actors ?? []).map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold flex items-center gap-2">
          <ScrollText className="h-7 w-7 text-rose-500" /> Audit log
        </h1>
        <p className="text-muted-foreground">
          Recent admin-level actions across the platform. Shows last 200 entries.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">When</th>
                  <th className="text-left p-3 font-medium">Actor</th>
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Target</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(logs ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No audit entries yet.
                    </td>
                  </tr>
                ) : (
                  (logs ?? []).map((l) => {
                    const actor = l.actor_id ? actorById.get(l.actor_id) : null;
                    return (
                      <tr key={l.id} className="hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                        </td>
                        <td className="p-3">
                          {actor ? (
                            <div>
                              <div className="font-medium text-sm">{actor.full_name}</div>
                              <div className="text-xs text-muted-foreground">{actor.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {l.action}
                          </code>
                        </td>
                        <td className="p-3 hidden md:table-cell text-xs">
                          {l.target_type ? `${l.target_type}:${l.target_id}` : '—'}
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {l.metadata ? (
                            <pre className="max-w-xs truncate">
                              {JSON.stringify(l.metadata)}
                            </pre>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
