'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';

export function SignOutMenuItem() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      try {
        document.cookie =
          'active_workspace_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } catch {
        // ignore
      }
      router.replace('/login');
      router.refresh();
    });
  }

  return (
    <DropdownMenuItem
      className="text-destructive cursor-pointer focus:text-destructive"
      disabled={isPending}
      onSelect={(e) => {
        e.preventDefault();
        signOut();
      }}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4 mr-2" />
      )}
      {isPending ? 'Signing out…' : 'Sign out'}
    </DropdownMenuItem>
  );
}
