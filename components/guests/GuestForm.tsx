'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import { guestSchema } from '@/lib/utils/validation';
import { DIETARY_OPTIONS, RELATIONS } from '@/lib/constants';
import type { Guest, Side, AgeGroup, RsvpStatus } from '@/lib/types/database.types';

interface GuestFormProps {
  initial?: Guest;
  eventId?: string;
  onDone?: (guest: Guest | null) => void;
}

export function GuestForm({ initial, eventId, onDone }: GuestFormProps) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [isPending, startTransition] = useTransition();

  const initialPartySize = initial?.party_size ?? 1;
  const [isGroup, setIsGroup] = useState(initialPartySize > 1);

  const [form, setForm] = useState({
    full_name: initial?.full_name ?? '',
    side: (initial?.side ?? 'bride') as Side,
    relation: initial?.relation ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    address: initial?.address ?? '',
    age_group: (initial?.age_group ?? 'adult') as AgeGroup,
    dietary_restrictions: initial?.dietary_restrictions ?? [],
    plus_one: initial?.plus_one ?? false,
    party_size: initialPartySize,
    rsvp_status: (initial?.rsvp_status ?? 'pending') as RsvpStatus,
    notes: initial?.notes ?? '',
  });

  function switchMode(group: boolean) {
    setIsGroup(group);
    setForm((f) => ({
      ...f,
      party_size: group ? Math.max(f.party_size, 2) : 1,
      plus_one: group ? false : f.plus_one,
    }));
  }

  function toggleDietary(option: string) {
    const has = form.dietary_restrictions.includes(option);
    setForm({
      ...form,
      dietary_restrictions: has
        ? form.dietary_restrictions.filter((d) => d !== option)
        : [...form.dietary_restrictions, option],
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = guestSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid form');
      return;
    }

    startTransition(async () => {
      const payload = {
        ...parsed.data,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null,
        dietary_restrictions: parsed.data.dietary_restrictions ?? null,
      };
      if (initial) {
        const { data, error } = await supabase
          .from('guests')
          .update(payload)
          .eq('id', initial.id)
          .select()
          .single();
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Guest updated');
        onDone?.(data);
      } else {
        if (!workspaceId) {
          toast.error('Pick a workspace first');
          return;
        }
        const { data, error } = await supabase
          .from('guests')
          .insert({ ...payload, workspace_id: workspaceId })
          .select()
          .single();
        if (error) {
          toast.error(error.message);
          return;
        }
        if (eventId && data) {
          await supabase
            .from('event_guests')
            .insert({ event_id: eventId, guest_id: data.id });
        }
        toast.success(`${data!.full_name} added`);
        onDone?.(data);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => switchMode(false)}
          className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
            !isGroup
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="h-4 w-4" /> Individual
        </button>
        <button
          type="button"
          onClick={() => switchMode(true)}
          className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
            isGroup
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" /> Family / Group
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="full_name">
            {isGroup ? 'Family / group name' : 'Full name'}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder={
              isGroup ? 'e.g. The Sharma Family' : 'e.g. Priya Sharma'
            }
            required
          />
          {isGroup && (
            <p className="text-xs text-muted-foreground">
              Use one row per family. Set the head count below.
            </p>
          )}
        </div>

        {isGroup && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="party_size">
              Number of people <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setForm({
                    ...form,
                    party_size: Math.max(2, form.party_size - 1),
                  })
                }
              >
                −
              </Button>
              <Input
                id="party_size"
                type="number"
                min={2}
                max={50}
                value={form.party_size}
                onChange={(e) =>
                  setForm({
                    ...form,
                    party_size: Math.max(2, Math.min(50, Number(e.target.value) || 2)),
                  })
                }
                className="text-center w-20"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setForm({
                    ...form,
                    party_size: Math.min(50, form.party_size + 1),
                  })
                }
              >
                +
              </Button>
              <span className="text-sm text-muted-foreground ml-1">
                people in this group
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>
            Side <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.side}
            onValueChange={(v) => setForm({ ...form, side: v as Side })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bride">Bride&apos;s side</SelectItem>
              <SelectItem value="groom">Groom&apos;s side</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="relation">
            Relation <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.relation}
            onValueChange={(v) => setForm({ ...form, relation: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose relation" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="guest@example.com"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Age group</Label>
          <Select
            value={form.age_group}
            onValueChange={(v) =>
              setForm({ ...form, age_group: v as AgeGroup })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="adult">Adult</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>RSVP status</Label>
          <Select
            value={form.rsvp_status}
            onValueChange={(v) =>
              setForm({ ...form, rsvp_status: v as RsvpStatus })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="tentative">Tentative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Dietary restrictions</Label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((option) => {
              const checked = form.dietary_restrictions.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleDietary(option)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                    checked
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-border hover:border-rose-200'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {!isGroup && (
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="plus_one"
              checked={form.plus_one}
              onCheckedChange={(c) => setForm({ ...form, plus_one: c === true })}
            />
            <Label htmlFor="plus_one" className="cursor-pointer">
              Plus one allowed
            </Label>
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        {onDone && (
          <Button type="button" variant="outline" onClick={() => onDone(null)}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="bg-rose-500 hover:bg-rose-600"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Save guest' : 'Add guest'}
        </Button>
      </div>
    </form>
  );
}
