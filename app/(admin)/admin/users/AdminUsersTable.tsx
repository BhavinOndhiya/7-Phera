'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Search, Shield, ShieldOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_superadmin: boolean;
  is_suspended: boolean;
  created_at: string;
}

export function AdminUsersTable({
  initialUsers,
  initialQuery,
}: {
  initialUsers: AdminUser[];
  initialQuery: string;
}) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [q, setQ] = useState(initialQuery);
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [isPending, startTransition] = useTransition();

  function search() {
    router.push(`/admin/users?q=${encodeURIComponent(q)}`);
  }

  async function toggleSuperadmin(u: AdminUser) {
    startTransition(async () => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_superadmin',
          userId: u.id,
          value: !u.is_superadmin,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? 'Failed');
        return;
      }
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, is_superadmin: !x.is_superadmin } : x
        )
      );
      toast.success(`Superadmin ${!u.is_superadmin ? 'granted' : 'revoked'}`);
    });
  }

  async function toggleSuspend(u: AdminUser) {
    if (!u.is_suspended) {
      const ok = await confirm({
        title: 'Suspend user',
        description: `Suspend ${u.full_name}? They will be unable to log in.`,
        confirmLabel: 'Suspend',
        variant: 'destructive',
      });
      if (!ok) return;
    }
    startTransition(async () => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_suspend',
          userId: u.id,
          value: !u.is_suspended,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? 'Failed');
        return;
      }
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, is_suspended: !x.is_suspended } : x
        )
      );
      toast.success(u.is_suspended ? 'Unsuspended' : 'Suspended');
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
            placeholder="Search by name or email…"
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
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Email</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Role</th>
              <th className="text-left p-3 font-medium">Flags</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{u.full_name}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{u.email}</div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="p-3 hidden lg:table-cell capitalize">{u.role}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u.is_superadmin && (
                        <Badge className="bg-rose-100 text-rose-700 text-[10px] uppercase">
                          superadmin
                        </Badge>
                      )}
                      {u.is_suspended && (
                        <Badge className="bg-amber-100 text-amber-800 text-[10px] uppercase">
                          suspended
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => toggleSuperadmin(u)}
                        title="Toggle superadmin"
                      >
                        {u.is_superadmin ? (
                          <ShieldOff className="h-3.5 w-3.5" />
                        ) : (
                          <Shield className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={u.is_suspended ? 'outline' : 'destructive'}
                        disabled={isPending}
                        onClick={() => toggleSuspend(u)}
                      >
                        {u.is_suspended ? 'Unsuspend' : 'Suspend'}
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
