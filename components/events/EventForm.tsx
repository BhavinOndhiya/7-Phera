'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemePicker } from './ThemePicker';
import { createClient } from '@/lib/supabase/client';
import { EVENT_TYPES } from '@/lib/constants';
import { eventSchema } from '@/lib/utils/validation';
import type { Event, EventType } from '@/lib/types/database.types';

interface EventFormProps {
  initial?: Event;
  onCancel?: () => void;
}

export function EventForm({ initial, onCancel }: EventFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    event_type: (initial?.event_type ?? 'wedding') as EventType,
    event_date: initial?.event_date ?? '',
    venue: initial?.venue ?? '',
    venue_address: initial?.venue_address ?? '',
    estimated_guests: initial?.estimated_guests?.toString() ?? '',
    notes: initial?.notes ?? '',
    theme_name: initial?.theme_name ?? null,
    theme_colors: initial?.theme_colors ?? null,
    theme_description: initial?.theme_description ?? null,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = eventSchema.safeParse({
      ...form,
      estimated_guests: form.estimated_guests
        ? Number(form.estimated_guests)
        : null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid form');
      return;
    }

    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const payload = {
        name: parsed.data.name,
        event_type: parsed.data.event_type,
        event_date: parsed.data.event_date,
        venue: parsed.data.venue || null,
        venue_address: parsed.data.venue_address || null,
        estimated_guests: parsed.data.estimated_guests ?? null,
        notes: parsed.data.notes || null,
        theme_name: form.theme_name,
        theme_colors: form.theme_colors,
        theme_description: form.theme_description,
        created_by: user?.id ?? null,
      };

      if (initial) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', initial.id);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Event updated');
        router.push(`/events/${initial.id}`);
        router.refresh();
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert(payload)
          .select()
          .single();
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Event created');
        router.push(`/events/${data!.id}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="font-serif text-lg font-semibold">Event details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">
              Event name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Priya & Arjun's Sangeet"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.event_type}
              onValueChange={(v) =>
                setForm({ ...form, event_type: v as EventType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="event_date"
              type="date"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g. The Leela Palace"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_guests">Estimated guests</Label>
            <Input
              id="estimated_guests"
              type="number"
              min="0"
              value={form.estimated_guests}
              onChange={(e) =>
                setForm({ ...form, estimated_guests: e.target.value })
              }
              placeholder="500"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="venue_address">Venue address</Label>
            <Input
              id="venue_address"
              value={form.venue_address}
              onChange={(e) =>
                setForm({ ...form, venue_address: e.target.value })
              }
              placeholder="Full address"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any special instructions or details…"
              rows={3}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-serif text-lg font-semibold">Theme & decor</h3>
        <ThemePicker
          value={{
            theme_name: form.theme_name,
            theme_colors: form.theme_colors,
            theme_description: form.theme_description,
          }}
          onChange={(v) => setForm({ ...form, ...v })}
        />
      </section>

      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-rose-500 hover:bg-rose-600"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Save changes' : 'Create event'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
