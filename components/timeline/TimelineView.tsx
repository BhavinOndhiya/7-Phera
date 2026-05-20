'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TimelineItem } from './TimelineItem';
import { useTimeline } from '@/lib/hooks/useTimeline';
import { createClient } from '@/lib/supabase/client';
import { formatDateLong } from '@/lib/utils/formatting';
import type { TimelineItem as TimelineItemType } from '@/lib/types/database.types';

export function TimelineView({ eventId }: { eventId: string }) {
  const { items, loading, deleteItem } = useTimeline(eventId);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineItemType | null>(null);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, TimelineItemType[]> = {};
    for (const item of items) {
      const dateKey = item.start_time.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    }
    return groups;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-xl font-semibold">Schedule</h2>
        <Button
          className="bg-rose-500 hover:bg-rose-600"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Add to timeline
        </Button>
      </div>

      {loading && (
        <p className="text-center text-muted-foreground py-8">Loading…</p>
      )}

      {!loading && items.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-medium mt-3">Timeline is empty</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add ceremony, arrival, photoshoot, and other timed items.
            </p>
            <Button
              className="mt-4 bg-rose-500 hover:bg-rose-600"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add first item
            </Button>
          </CardContent>
        </Card>
      )}

      {Object.entries(groupedByDate).map(([dateKey, dateItems]) => (
        <div key={dateKey}>
          <h3 className="font-serif text-sm font-semibold text-muted-foreground mb-3">
            {formatDateLong(dateKey)}
          </h3>
          <div>
            {dateItems.map((item) => (
              <TimelineItem
                key={item.id}
                item={item}
                onEdit={() => setEditing(item)}
                onDelete={async () => {
                  if (confirm(`Delete "${item.title}"?`)) {
                    await deleteItem(item.id);
                  }
                }}
              />
            ))}
          </div>
        </div>
      ))}

      <TimelineItemForm
        eventId={eventId}
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <TimelineItemForm
        eventId={eventId}
        initial={editing ?? undefined}
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}

function TimelineItemForm({
  eventId,
  initial,
  open,
  onOpenChange,
}: {
  eventId: string;
  initial?: TimelineItemType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    start_time: initial?.start_time?.slice(0, 16) ?? '',
    end_time: initial?.end_time?.slice(0, 16) ?? '',
    location: initial?.location ?? '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.start_time) {
      toast.error('Title and start time required');
      return;
    }
    startTransition(async () => {
      const payload = {
        event_id: eventId,
        title: form.title,
        description: form.description || null,
        start_time: new Date(form.start_time).toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        location: form.location || null,
      };
      if (initial) {
        const { error } = await supabase
          .from('timeline_items')
          .update(payload)
          .eq('id', initial.id);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Updated');
      } else {
        const { error } = await supabase
          .from('timeline_items')
          .insert(payload);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Added to timeline');
        setForm({
          title: '',
          description: '',
          start_time: '',
          end_time: '',
          location: '',
        });
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initial ? 'Edit timeline item' : 'Add timeline item'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Baraat arrival"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">
                Start <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={form.end_time}
                onChange={(e) =>
                  setForm({ ...form, end_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Main hall"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initial ? 'Save' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
