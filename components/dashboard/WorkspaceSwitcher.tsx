'use client';

import Link from 'next/link';
import { Building2, Check, ChevronDown, Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import { roleLabel } from '@/lib/utils/permissions';

export function WorkspaceSwitcher() {
  const ctx = useOptionalWorkspace();
  if (!ctx) return null;

  const {
    activeWorkspace,
    activeRole,
    memberships,
    isSuperadmin,
    switchWorkspace,
    loading,
  } = ctx;

  if (loading) {
    return (
      <div className="h-9 w-36 rounded-md bg-muted animate-pulse hidden md:block" />
    );
  }

  if (!activeWorkspace && memberships.length === 0 && !isSuperadmin) {
    return (
      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link href="/onboarding">
          <Plus className="h-4 w-4" /> Create wedding
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 gap-2 max-w-[14rem] md:max-w-[18rem]"
        >
          <Building2 className="h-4 w-4 text-rose-500 shrink-0" />
          <span className="truncate text-sm font-medium">
            {activeWorkspace?.name ?? 'Select workspace'}
          </span>
          {activeRole && (
            <Badge variant="secondary" className="text-[10px] uppercase">
              {activeRole}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Your workspaces
        </DropdownMenuLabel>
        {memberships.map(({ workspace, role }) => {
          const isActive = workspace.id === activeWorkspace?.id;
          return (
            <DropdownMenuItem
              key={workspace.id}
              onSelect={() => {
                if (!isActive) switchWorkspace(workspace.id);
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isActive ? (
                    <Check className="h-4 w-4 text-rose-500 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate">{workspace.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {roleLabel(role)}
                </Badge>
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" /> New wedding workspace
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/collaborators" className="cursor-pointer">
            <Building2 className="h-4 w-4 mr-2" /> Manage members
          </Link>
        </DropdownMenuItem>
        {isSuperadmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer text-rose-600">
                <Shield className="h-4 w-4 mr-2" /> Open admin panel
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
