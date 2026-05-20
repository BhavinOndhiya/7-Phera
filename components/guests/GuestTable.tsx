'use client';

import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GuestForm } from './GuestForm';
import { GuestQRCard } from './GuestQRCard';
import { useGuests } from '@/lib/hooks/useGuests';
import { RSVP_STATUSES, SIDES } from '@/lib/constants';
import type { Guest, Side, RsvpStatus } from '@/lib/types/database.types';
import { GuestImport } from './GuestImport';

interface GuestTableProps {
  eventId?: string;
  eventName?: string;
  hideTitle?: boolean;
}

export function GuestTable({ eventId, eventName, hideTitle }: GuestTableProps) {
  const { guests, loading, updateRsvp, deleteGuest } = useGuests({ eventId });
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<Side | 'all'>('all');
  const [rsvpFilter, setRsvpFilter] = useState<RsvpStatus | 'all'>('all');
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

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
      return matchesSearch && matchesSide && matchesRsvp;
    });
  }, [guests, search, sideFilter, rsvpFilter]);

  async function onRsvpChange(id: string, value: RsvpStatus) {
    const ok = await updateRsvp(id, value);
    if (ok) toast.success('RSVP updated');
  }

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
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
          <Button
            className="bg-rose-500 hover:bg-rose-600"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add guest
          </Button>
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
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="hidden md:table-cell">Relation</TableHead>
              <TableHead className="hidden lg:table-cell">Contact</TableHead>
              <TableHead>RSVP</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Loading guests…
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {guests.length === 0
                    ? 'No guests yet. Add your first guest or import a CSV.'
                    : 'No guests match your filters.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>
                  <div className="font-medium flex items-center gap-1.5">
                    {guest.full_name}
                    {guest.party_size > 1 && (
                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-xs">
                        <Users className="h-3 w-3 mr-1" /> {guest.party_size}
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
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    {eventId && (
                      <GuestQRCard
                        guest={guest}
                        eventId={eventId}
                        eventName={eventName}
                      />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingGuest(guest)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            if (
                              confirm(
                                `Remove ${guest.full_name} from your guest list?`
                              )
                            ) {
                              await deleteGuest(guest.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
            <DialogTitle>Import guests from CSV</DialogTitle>
          </DialogHeader>
          <GuestImport eventId={eventId} onDone={() => setImportOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
