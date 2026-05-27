'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Phone,
  Mail,
  Edit,
  Trash2,
  MoreVertical,
  Filter,
  Users,
  UserMinus,
  UserPlus,
  CalendarDays,
  Send,
  X,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GuestForm } from './GuestForm';
import { GuestQRCard } from './GuestQRCard';
import { AddExistingGuestsDialog } from './AddExistingGuestsDialog';
import { InvitationActions } from './InvitationActions';
import { useGuests } from '@/lib/hooks/useGuests';
import { useEvents, useEvent } from '@/lib/hooks/useEvents';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { emitDataChanged } from '@/lib/utils/dataEvents';
import { RSVP_STATUSES, SIDES } from '@/lib/constants';
import type { Guest, Side, RsvpStatus } from '@/lib/types/database.types';
import { GuestImport } from './GuestImport';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface GuestTableProps {
  eventId?: string;
  eventName?: string;
  hideTitle?: boolean;
}

export function GuestTable({ eventId, eventName, hideTitle }: GuestTableProps) {
  const {
    guests,
    guestEvents,
    attendance,
    loading,
    updateRsvp,
    deleteGuest,
    deleteManyGuests,
    removeFromEvent,
    removeManyFromEvent,
  } = useGuests({ eventId });
  const { events } = useEvents();
  const { event: scopedEvent } = useEvent(eventId ?? null);
  const { can } = useWorkspace();
  const canEdit = can('edit_guest');
  const canDelete = can('delete_guest');
  const canCreate = can('create_guest');
  const canInvite = canEdit;
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<Side | 'all'>('all');
  const [rsvpFilter, setRsvpFilter] = useState<RsvpStatus | 'all'>('all');
  const [checkinFilter, setCheckinFilter] = useState<'all' | 'in' | 'out'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendingSingleId, setSendingSingleId] = useState<string | null>(null);
  const [, startSingleSendTransition] = useTransition();
  const [isBulkPending, startBulkTransition] = useTransition();
  const { confirm } = useConfirm();

  const canSelect = canInvite || canDelete;

  const eventsById = useMemo(() => {
    const m: Record<string, { id: string; name: string }> = {};
    for (const e of events) m[e.id] = { id: e.id, name: e.name };
    return m;
  }, [events]);

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const matchesSearch =
        !search ||
        g.full_name.toLowerCase().includes(search.toLowerCase()) ||
        g.relation.toLowerCase().includes(search.toLowerCase()) ||
        g.phone?.toLowerCase().includes(search.toLowerCase()) ||
        g.email?.toLowerCase().includes(search.toLowerCase());
      const matchesSide = sideFilter === 'all' || g.side === sideFilter;
      const matchesRsvp = rsvpFilter === 'all' || g.rsvp_status === rsvpFilter;
      const isIn = Boolean(attendance[g.id]?.attended);
      const matchesCheckin =
        !eventId ||
        checkinFilter === 'all' ||
        (checkinFilter === 'in' ? isIn : !isIn);
      const matchesEvent =
        eventId ||
        eventFilter === 'all' ||
        (eventFilter === 'none'
          ? !(guestEvents[g.id] && guestEvents[g.id].length > 0)
          : (guestEvents[g.id] ?? []).includes(eventFilter));
      return (
        matchesSearch &&
        matchesSide &&
        matchesRsvp &&
        matchesCheckin &&
        matchesEvent
      );
    });
  }, [
    guests,
    search,
    sideFilter,
    rsvpFilter,
    checkinFilter,
    eventFilter,
    eventId,
    guestEvents,
    attendance,
  ]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const validIds = new Set(filtered.map((g) => g.id));
      const next = new Set<string>();
      let changed = false;
      for (const id of prev) {
        if (validIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [filtered]);

  const filteredIds = useMemo(() => filtered.map((g) => g.id), [filtered]);
  const selectedFilteredCount = useMemo(
    () => filteredIds.reduce((n, id) => (selectedIds.has(id) ? n + 1 : n), 0),
    [filteredIds, selectedIds]
  );
  const allFilteredSelected =
    filteredIds.length > 0 && selectedFilteredCount === filteredIds.length;
  const someFilteredSelected =
    selectedFilteredCount > 0 && !allFilteredSelected;

  const selectedGuests = useMemo(
    () => guests.filter((g) => selectedIds.has(g.id)),
    [guests, selectedIds]
  );
  const selectedWithEmailCount = selectedGuests.filter((g) => g.email).length;

  function toggleSelectAllFiltered(value: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (value) {
        for (const id of filteredIds) next.add(id);
      } else {
        for (const id of filteredIds) next.delete(id);
      }
      return next;
    });
  }

  function toggleSelectOne(id: string, value: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function bulkDeleteSelected() {
    const ids = [...selectedIds];
    const count = ids.length;
    const description = eventId
      ? `Delete ${count} selected guest${count === 1 ? '' : 's'} from your workspace? They will be removed from every event. This cannot be undone.`
      : `Delete ${count} selected guest${count === 1 ? '' : 's'} from your workspace? This cannot be undone.`;
    const ok = await confirm({
      title: count === 1 ? 'Delete guest' : `Delete ${count} guests`,
      description,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (!ok) return;
    startBulkTransition(async () => {
      const deleted = await deleteManyGuests(ids);
      if (deleted) clearSelection();
    });
  }

  async function bulkRemoveFromEvent() {
    if (!eventId) return;
    const ids = [...selectedIds];
    const count = ids.length;
    const ok = await confirm({
      title: count === 1 ? 'Remove from event' : `Remove ${count} guests`,
      description: `Remove ${count} selected guest${count === 1 ? '' : 's'} from this event only? They will stay in your guest list.`,
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (!ok) return;
    startBulkTransition(async () => {
      const removed = await removeManyFromEvent(ids, eventId);
      if (removed) clearSelection();
    });
  }

  function sendSingleInvitation(guest: Guest) {
    if (!eventId) {
      toast.error('Open this guest list from an event to send invitations');
      return;
    }
    if (!guest.email) {
      toast.error('Guest has no email address');
      return;
    }
    setSendingSingleId(guest.id);
    startSingleSendTransition(async () => {
      try {
        const res = await fetch('/api/invitations/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, guestIds: [guest.id] }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? 'Failed to send invitation');
          return;
        }
        if (data.sent?.length > 0) {
          emitDataChanged('guests:changed');
          toast.success(`Invitation sent to ${guest.full_name}`);
        } else {
          const reason = data.failed?.[0]?.reason ?? 'unknown error';
          toast.error(`Could not send: ${reason}`);
        }
      } finally {
        setSendingSingleId(null);
      }
    });
  }

  async function onRsvpChange(id: string, value: RsvpStatus) {
    const ok = await updateRsvp(id, value);
    if (ok) toast.success('RSVP updated');
  }

  const showEventsColumn = !eventId && events.length > 0;
  const showCheckinColumn = Boolean(eventId);
  const columnCount =
    (showEventsColumn ? 7 : 6) + (showCheckinColumn ? 1 : 0) + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!hideTitle && (
          <div>
            <h2 className="font-serif text-xl font-semibold">
              {filtered.length} of {guests.length} entries
            </h2>
            {(() => {
              const totalPeople = guests.reduce(
                (s, g) => s + Math.max(1, g.party_size ?? 1),
                0
              );
              const families = guests.filter(
                (g) => (g.party_size ?? 1) > 1
              ).length;
              return (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalPeople} total people
                  {families > 0 ? ` · ${families} family group${families === 1 ? '' : 's'}` : ''}
                </p>
              );
            })()}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {eventId && canCreate && (
            <Button
              variant="outline"
              onClick={() => setAddExistingOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" /> Invite existing
            </Button>
          )}
          {canCreate && (
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              Import CSV / Excel
            </Button>
          )}
          {canCreate && (
            <Button
              className="bg-rose-500 hover:bg-rose-600"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add guest
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, relation, contact…"
            className="pl-9"
          />
        </div>
        <Select value={sideFilter} onValueChange={(v) => setSideFilter(v as Side | 'all')}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-3 w-3 mr-1.5 opacity-50" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sides</SelectItem>
            {SIDES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={rsvpFilter}
          onValueChange={(v) => setRsvpFilter(v as RsvpStatus | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RSVPs</SelectItem>
            {RSVP_STATUSES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {eventId && (
          <Select
            value={checkinFilter}
            onValueChange={(v) =>
              setCheckinFilter(v as 'all' | 'in' | 'out')
            }
          >
            <SelectTrigger className="w-[160px]">
              <UserCheck className="h-3 w-3 mr-1.5 opacity-50" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All check-ins</SelectItem>
              <SelectItem value="in">Checked in</SelectItem>
              <SelectItem value="out">Not checked in</SelectItem>
            </SelectContent>
          </Select>
        )}
        {!eventId && events.length > 0 && (
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[200px]">
              <CalendarDays className="h-3 w-3 mr-1.5 opacity-50" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="none">Not invited to any</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {canSelect && selectedIds.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/95 backdrop-blur px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Badge className="bg-rose-500 text-white hover:bg-rose-500">
              {selectedIds.size}
            </Badge>
            <span className="text-sm font-medium">selected</span>
            {canInvite && (
              <span className="text-xs text-muted-foreground">
                · {selectedWithEmailCount} have email
              </span>
            )}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={isBulkPending}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
            {canDelete && eventId && (
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkPending}
                onClick={bulkRemoveFromEvent}
              >
                <UserMinus className="h-3.5 w-3.5 mr-1.5" />
                Remove from event
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkPending}
                onClick={bulkDeleteSelected}
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                {isBulkPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                Delete selected
              </Button>
            )}
            {canInvite && (
              <Button
                size="sm"
                className="bg-rose-500 hover:bg-rose-600"
                onClick={() => setSendDialogOpen(true)}
                disabled={
                  isBulkPending || (selectedWithEmailCount === 0 && !eventId)
                }
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Send invitations
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {canSelect && (
                <TableHead className="w-[44px]">
                  <Checkbox
                    aria-label="Select all filtered guests"
                    checked={
                      allFilteredSelected
                        ? true
                        : someFilteredSelected
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={(v) => toggleSelectAllFiltered(v === true)}
                    disabled={filteredIds.length === 0}
                  />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="hidden md:table-cell">Relation</TableHead>
              {showEventsColumn && (
                <TableHead className="hidden md:table-cell">Invited to</TableHead>
              )}
              <TableHead className="hidden lg:table-cell">Contact</TableHead>
              <TableHead>RSVP</TableHead>
              {showCheckinColumn && <TableHead>Check-in</TableHead>}
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={canSelect ? columnCount : columnCount - 1}
                  className="text-center py-12 text-muted-foreground"
                >
                  Loading guests…
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canSelect ? columnCount : columnCount - 1}
                  className="text-center py-12 text-muted-foreground"
                >
                  {guests.length === 0
                    ? eventId
                      ? 'No one invited yet. Add a new guest or invite from your existing list.'
                      : 'No guests yet. Add your first guest or import a CSV.'
                    : 'No guests match your filters.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((guest) => {
              const invitedEventIds = guestEvents[guest.id] ?? [];
              const isSelected = selectedIds.has(guest.id);
              return (
                <TableRow
                  key={guest.id}
                  data-state={isSelected ? 'selected' : undefined}
                >
                  {canSelect && (
                    <TableCell>
                      <Checkbox
                        aria-label={`Select ${guest.full_name}`}
                        checked={isSelected}
                        onCheckedChange={(v) =>
                          toggleSelectOne(guest.id, v === true)
                        }
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="font-medium flex items-center gap-1.5">
                      {guest.full_name}
                      {guest.party_size > 1 && (
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-xs">
                          <Users className="h-3 w-3 mr-1" /> {guest.party_size}
                        </Badge>
                      )}
                      {guest.invitation_status === 'sent' && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-emerald-200 text-emerald-700"
                        >
                          Invited
                        </Badge>
                      )}
                    </div>
                    {guest.plus_one && (
                      <span className="text-xs text-muted-foreground">+1</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {guest.side}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {guest.relation}
                  </TableCell>
                  {showEventsColumn && (
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {invitedEventIds.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">
                            Not invited yet
                          </span>
                        )}
                        {invitedEventIds.map((eid) => {
                          const evt = eventsById[eid];
                          if (!evt) return null;
                          return (
                            <Link
                              key={eid}
                              href={`/events/${eid}/guests`}
                              className="inline-flex items-center"
                            >
                              <Badge
                                variant="outline"
                                className="text-[10px] hover:bg-rose-50 hover:border-rose-200 cursor-pointer"
                              >
                                {evt.name}
                              </Badge>
                            </Link>
                          );
                        })}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="hidden lg:table-cell">
                    <div className="space-y-0.5 text-xs">
                      {guest.phone && (
                        <a
                          href={`tel:${guest.phone}`}
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          {guest.phone}
                        </a>
                      )}
                      {guest.email && (
                        <a
                          href={`mailto:${guest.email}`}
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">{guest.email}</span>
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={guest.rsvp_status}
                      onValueChange={(v) => onRsvpChange(guest.id, v as RsvpStatus)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RSVP_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {showCheckinColumn && (
                    <TableCell>
                      {attendance[guest.id]?.attended ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-500">
                          In
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          —
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <GuestQRCard
                        guest={guest}
                        eventId={eventId}
                        eventName={eventName}
                        workspaceEvents={!eventId ? events : undefined}
                      />
                      {(canEdit || canDelete || (canInvite && eventId)) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canInvite && eventId && (
                              <DropdownMenuItem
                                onClick={() => sendSingleInvitation(guest)}
                                disabled={
                                  !guest.email ||
                                  sendingSingleId === guest.id
                                }
                              >
                                {sendingSingleId === guest.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4 mr-2" />
                                )}
                                Send invitation
                                {!guest.email && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    no email
                                  </span>
                                )}
                              </DropdownMenuItem>
                            )}
                            {canInvite && eventId && (canEdit || canDelete) && (
                              <DropdownMenuSeparator />
                            )}
                            {canEdit && (
                              <DropdownMenuItem onClick={() => setEditingGuest(guest)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && eventId && (
                              <>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    await removeFromEvent(guest.id, eventId);
                                  }}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" /> Remove from
                                  this event
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: 'Delete guest',
                                    description: `Delete ${guest.full_name} from your workspace? This removes them from every event.`,
                                    confirmLabel: 'Delete',
                                    variant: 'destructive',
                                  });
                                  if (ok) await deleteGuest(guest.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete from
                                workspace
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add new guest</DialogTitle>
          </DialogHeader>
          <GuestForm
            eventId={eventId}
            onDone={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingGuest)}
        onOpenChange={(open) => !open && setEditingGuest(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit guest</DialogTitle>
          </DialogHeader>
          {editingGuest && (
            <GuestForm
              initial={editingGuest}
              onDone={() => setEditingGuest(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import guests from CSV or Excel</DialogTitle>
          </DialogHeader>
          <GuestImport eventId={eventId} onDone={() => setImportOpen(false)} />
        </DialogContent>
      </Dialog>

      {eventId && (
        <AddExistingGuestsDialog
          eventId={eventId}
          open={addExistingOpen}
          onOpenChange={setAddExistingOpen}
        />
      )}

      {canInvite && (
        <InvitationActions
          event={eventId ? scopedEvent ?? undefined : undefined}
          guests={selectedGuests}
          workspaceEvents={eventId ? undefined : events}
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          onSent={clearSelection}
        />
      )}
    </div>
  );
}
