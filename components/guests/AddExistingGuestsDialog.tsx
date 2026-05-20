'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Users, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import { useGuests } from '@/lib/hooks/useGuests';
import type { Guest } from '@/lib/types/database.types';

interface AddExistingGuestsDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
}

export function AddExistingGuestsDialog({
  eventId,
  open,
  onOpenChange,
  onAdded,
}: AddExistingGuestsDialogProps) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const { inviteManyToEvent } = useGuests({ eventId });

  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [alreadyInvited, setAlreadyInvited] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !workspaceId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: guestRows, error: gErr }, { data: linkRows, error: lErr }] =
        await Promise.all([
          supabase
            .from('guests')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('full_name'),
          supabase.from('event_guests').select('guest_id').eq('event_id', eventId),
        ]);
      if (cancelled) return;
      if (gErr) toast.error(gErr.message);
      if (lErr) toast.error(lErr.message);
      setAllGuests(guestRows ?? []);
      setAlreadyInvited(new Set((linkRows ?? []).map((r) => r.guest_id)));
      setSelected(new Set());
      setSearch('');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, workspaceId, eventId, supabase]);

  const availableGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allGuests
      .filter((g) => !alreadyInvited.has(g.id))
      .filter(
        (g) =>
          !q ||
          g.full_name.toLowerCase().includes(q) ||
          g.relation.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q) ||
          g.phone?.toLowerCase().includes(q)
      );
  }, [allGuests, alreadyInvited, search]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === availableGuests.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(availableGuests.map((g) => g.id)));
    }
  }

  async function save() {
    if (selected.size === 0) {
      toast.message('Pick at least one guest');
      return;
    }
    setSaving(true);
    const ok = await inviteManyToEvent(Array.from(selected), eventId);
    setSaving(false);
    if (ok) {
      onAdded?.();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite existing guests</DialogTitle>
          <DialogDescription>
            Pick guests from your workspace to add to this event. Already-invited
            guests are hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, relation, contact…"
              className="pl-9"
            />
          </div>

          {availableGuests.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={toggleAll}
                className="font-medium text-rose-600 hover:underline"
              >
                {selected.size === availableGuests.length
                  ? 'Clear all'
                  : `Select all (${availableGuests.length})`}
              </button>
              <span>
                {selected.size} of {availableGuests.length} selected
              </span>
            </div>
          )}

          <div className="max-h-[50vh] overflow-y-auto rounded-lg border divide-y">
            {loading && (
              <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            )}
            {!loading && availableGuests.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {allGuests.length === 0
                  ? 'No guests in this workspace yet. Add some from the All guests page first.'
                  : alreadyInvited.size === allGuests.length
                    ? 'All workspace guests are already invited to this event.'
                    : 'No guests match your search.'}
              </div>
            )}
            {!loading &&
              availableGuests.map((g) => {
                const isSelected = selected.has(g.id);
                return (
                  <label
                    key={g.id}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-rose-50' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(g.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        {g.full_name}
                        {g.party_size > 1 && (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-[10px]">
                            <Users className="h-3 w-3 mr-1" />
                            {g.party_size}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {g.relation} · {g.side === 'bride' ? "Bride's side" : "Groom's side"}
                        {g.phone ? ` · ${g.phone}` : ''}
                      </div>
                    </div>
                  </label>
                );
              })}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={saving || selected.size === 0}
            className="bg-rose-500 hover:bg-rose-600"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Invite {selected.size > 0 ? `${selected.size} ` : ''}
            {selected.size === 1 ? 'guest' : 'guests'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
