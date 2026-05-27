'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LogIn, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface Row {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
  ownerName: string;
  ownerEmail: string;
}

export function AdminWorkspacesTable({
  initial,
  initialQuery,
}: {
  initial: Row[];
  initialQuery: string;
}) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [q, setQ] = useState(initialQuery);
  const [rows, setRows] = useState<Row[]>(initial);
  const [isPending, startTransition] = useTransition();

  function search() {
    router.push(`/admin/workspaces?q=${encodeURIComponent(q)}`);
  }

  function enterWorkspace(id: string, name: string) {
    document.cookie = `active_workspace_id=${id}; path=/; max-age=${365 * 86400}; SameSite=Lax`;
    toast.success(`Entering "${name}" in god-mode`);
    router.push('/dashboard');
  }

  async function deleteWorkspace(row: Row) {
    const ok = await confirm({
      title: 'Delete workspace',
      description: `Delete workspace "${row.name}"? This permanently removes all events, guests, budgets, vendors and members. There is no undo.`,
      confirmLabel: 'Delete workspace',
      variant: 'destructive',
    });
    if (!ok) return;

    startTransition(async () => {
      const res = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', workspaceId: row.id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? 'Failed');
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.success('Workspace deleted');
    });
  }

  return (
    <div>
      <div className="p-4 border-b flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search workspaces by name…"
            className="pl-9"
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
        </div>
        <Button onClick={search}>Search</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Workspace</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Owner</th>
              <th className="text-left p-3 font-medium">Members</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Created</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No workspaces found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground md:hidden">
                      {r.ownerName} · {r.memberCount} member(s)
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div className="text-sm">{r.ownerName}</div>
                    <div className="text-xs text-muted-foreground">{r.ownerEmail}</div>
                  </td>
                  <td className="p-3">{r.memberCount}</td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enterWorkspace(r.id, r.name)}
                      >
                        <LogIn className="h-3.5 w-3.5 mr-1" /> Enter
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWorkspace(r)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
