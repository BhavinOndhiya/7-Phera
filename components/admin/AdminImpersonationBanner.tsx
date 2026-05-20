'use client';

import { ShieldAlert } from 'lucide-react';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';

export function AdminImpersonationBanner() {
  const ctx = useOptionalWorkspace();
  if (!ctx) return null;

  const { isSuperadmin, activeWorkspace, activeRole } = ctx;
  if (!isSuperadmin) return null;
  if (!activeWorkspace) return null;

  const isOwnWorkspace = activeRole === 'owner';
  if (isOwnWorkspace) return null;

  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 md:px-8 py-2 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span className="truncate">
          <strong>Admin god-mode</strong> active in workspace
          <span className="font-semibold ml-1">
            &quot;{activeWorkspace.name}&quot;
          </span>
          . Every action is logged.
        </span>
      </div>
    </div>
  );
}
