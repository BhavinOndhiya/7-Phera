'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Plus, Trash2, Loader2, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import type { Guest } from '@/lib/types/database.types';

interface SeatingTable {
  id: string;
  label: string;
  capacity: number;
  guestIds: string[];
}

interface SeatingLayout {
  tables: SeatingTable[];
}

const DEFAULT_LAYOUT: SeatingLayout = { tables: [] };
const UNASSIGNED = 'unassigned';

function safeParse(input: unknown): SeatingLayout {
  if (!input || typeof input !== 'object') return DEFAULT_LAYOUT;
  const data = input as Partial<SeatingLayout>;
  if (!Array.isArray(data.tables)) return DEFAULT_LAYOUT;
  return {
    tables: data.tables.map((t) => ({
      id: String(t.id),
      label: String(t.label ?? 'Table'),
      capacity: Number(t.capacity ?? 8),
      guestIds: Array.isArray(t.guestIds) ? t.guestIds.map(String) : [],
    })),
  };
}

export function SeatingPlanner({ eventId }: { eventId: string }) {
  const supabase = createClient();
  const [layout, setLayout] = useState<SeatingLayout>(DEFAULT_LAYOUT);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: event }, { data: eventGuests }] = await Promise.all([
        supabase
          .from('events')
          .select('seating_layout')
          .eq('id', eventId)
          .maybeSingle(),
        supabase
          .from('event_guests')
          .select('guest_id')
          .eq('event_id', eventId),
      ]);
      if (!mounted) return;
      setLayout(safeParse(event?.seating_layout));

      const ids = (eventGuests ?? []).map((r) => r.guest_id);
      if (ids.length > 0) {
        const { data } = await supabase
          .from('guests')
          .select('*')
          .in('id', ids)
          .order('full_name');
        if (mounted) setGuests(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [eventId, supabase]);

  const assignedSet = new Set(layout.tables.flatMap((t) => t.guestIds));
  const unassigned = guests.filter((g) => !assignedSet.has(g.id));
  const filteredUnassigned = search
    ? unassigned.filter((g) =>
        g.full_name.toLowerCase().includes(search.toLowerCase())
      )
    : unassigned;

  function addTable() {
    const newTable: SeatingTable = {
      id: `t-${Date.now()}`,
      label: `Table ${layout.tables.length + 1}`,
      capacity: 8,
      guestIds: [],
    };
    setLayout({ tables: [...layout.tables, newTable] });
    setDirty(true);
  }

  function removeTable(tableId: string) {
    setLayout({ tables: layout.tables.filter((t) => t.id !== tableId) });
    setDirty(true);
  }

  function updateTable(
    tableId: string,
    updates: Partial<Pick<SeatingTable, 'label' | 'capacity'>>
  ) {
    setLayout({
      tables: layout.tables.map((t) =>
        t.id === tableId ? { ...t, ...updates } : t
      ),
    });
    setDirty(true);
  }

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const guestId = String(event.active.id);
      const targetId = event.over ? String(event.over.id) : null;
      if (!targetId) return;

      const next: SeatingLayout = {
        tables: layout.tables.map((t) => ({
          ...t,
          guestIds: t.guestIds.filter((id) => id !== guestId),
        })),
      };

      if (targetId !== UNASSIGNED) {
        const tableIdx = next.tables.findIndex((t) => t.id === targetId);
        if (tableIdx >= 0) {
          const table = next.tables[tableIdx];
          if (table.guestIds.length >= table.capacity) {
            toast.error(`${table.label} is full`);
            return;
          }
          next.tables[tableIdx] = {
            ...table,
            guestIds: [...table.guestIds, guestId],
          };
        }
      }

      setLayout(next);
      setDirty(true);
    },
    [layout]
  );

  function save() {
    startTransition(async () => {
      const { error } = await supabase
        .from('events')
        .update({ seating_layout: layout as unknown as never })
        .eq('id', eventId);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Seating layout saved');
      setDirty(false);
    });
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Drag guests onto tables. {assignedSet.size} of {guests.length} seated.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addTable}>
            <Plus className="h-4 w-4 mr-2" /> Add table
          </Button>
          <Button
            onClick={save}
            disabled={!dirty || isPending}
            className="bg-rose-500 hover:bg-rose-600"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save layout
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <UnassignedColumn
          guests={filteredUnassigned}
          allGuests={guests}
          search={search}
          onSearch={setSearch}
        />

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          {layout.tables.length === 0 && (
            <Card className="sm:col-span-2 xl:col-span-3">
              <CardContent className="py-10 text-center text-muted-foreground">
                Add your first table to start assigning seats.
              </CardContent>
            </Card>
          )}
          {layout.tables.map((table) => (
            <TableDroppable
              key={table.id}
              table={table}
              guests={guests}
              onRemove={removeTable}
              onUpdate={updateTable}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

function UnassignedColumn({
  guests,
  allGuests,
  search,
  onSearch,
}: {
  guests: Guest[];
  allGuests: Guest[];
  search: string;
  onSearch: (v: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search guests…"
          className="pl-9"
        />
      </div>
      <Card
        ref={setNodeRef}
        className={`min-h-[60vh] ${isOver ? 'border-rose-500 ring-2 ring-rose-200' : ''}`}
      >
        <CardContent className="p-3 space-y-1.5">
          <p className="text-xs text-muted-foreground px-2 py-1">
            Unassigned ({guests.length} of {allGuests.length})
          </p>
          {guests.map((g) => (
            <DraggableGuest key={g.id} guest={g} />
          ))}
          {guests.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {allGuests.length === 0
                ? 'No guests added to this event yet.'
                : 'Everyone is seated!'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TableDroppable({
  table,
  guests,
  onRemove,
  onUpdate,
}: {
  table: SeatingTable;
  guests: Guest[];
  onRemove: (id: string) => void;
  onUpdate: (
    id: string,
    updates: Partial<Pick<SeatingTable, 'label' | 'capacity'>>
  ) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: table.id });
  const tableGuests = table.guestIds
    .map((id) => guests.find((g) => g.id === id))
    .filter(Boolean) as Guest[];
  const isFull = tableGuests.length >= table.capacity;

  return (
    <Card
      ref={setNodeRef}
      className={`${isOver ? 'border-rose-500 ring-2 ring-rose-200' : ''}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={table.label}
            onChange={(e) => onUpdate(table.id, { label: e.target.value })}
            className="h-8 text-sm font-medium"
          />
          <Input
            type="number"
            min="1"
            value={table.capacity}
            onChange={(e) =>
              onUpdate(table.id, { capacity: Number(e.target.value) || 1 })
            }
            className="h-8 w-16 text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onRemove(table.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-xs">
          <Badge variant={isFull ? 'default' : 'secondary'}>
            {tableGuests.length}/{table.capacity}
          </Badge>
        </div>
        <div className="space-y-1 min-h-[80px]">
          {tableGuests.map((g) => (
            <DraggableGuest key={g.id} guest={g} compact />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DraggableGuest({ guest, compact }: { guest: Guest; compact?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: guest.id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${compact ? 'text-xs' : 'text-sm'}`}
    >
      <span className="truncate flex-1">{guest.full_name}</span>
      {!compact && (
        <Badge variant="secondary" className="text-xs capitalize">
          {guest.side}
        </Badge>
      )}
    </div>
  );
}
