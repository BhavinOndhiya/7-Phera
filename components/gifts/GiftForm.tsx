'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGifts } from '@/lib/hooks/useGifts';
import type { Gift } from '@/lib/types/database.types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z
    .union([z.coerce.number().nonnegative(), z.literal('')])
    .optional()
    .transform((v) => (v === '' || v == null ? null : Number(v))),
  url: z.string().url().optional().or(z.literal('')),
  image_url: z.string().url().optional().or(z.literal('')),
});

type GiftValues = z.infer<typeof schema>;

interface GiftFormProps {
  eventId: string;
  initial?: Gift;
  onDone?: () => void;
}

export function GiftForm({ eventId, initial, onDone }: GiftFormProps) {
  const { createGift, updateGift } = useGifts(eventId);
  const [isPending, startTransition] = useTransition();

  const form = useForm<GiftValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      price: initial?.price ?? undefined,
      url: initial?.url ?? '',
      image_url: initial?.image_url ?? '',
    },
  });

  function onSubmit(values: GiftValues) {
    startTransition(async () => {
      const payload = {
        event_id: eventId,
        name: values.name,
        description: values.description || null,
        price: values.price ?? null,
        url: values.url || null,
        image_url: values.image_url || null,
      };
      if (initial) {
        const ok = await updateGift(initial.id, payload);
        if (ok) onDone?.();
      } else {
        const ok = await createGift(payload);
        if (ok) onDone?.();
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...form.register('name')} placeholder="Espresso machine" />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          rows={3}
          placeholder="Why we want it"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="price">Price (Rs.)</Label>
          <Input id="price" type="number" min="0" {...form.register('price')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="url">Link</Label>
          <Input
            id="url"
            placeholder="https://store.example.com/..."
            {...form.register('url')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          placeholder="https://..."
          {...form.register('image_url')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" type="button" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-rose-500 hover:bg-rose-600"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? 'Save changes' : 'Add gift'}
        </Button>
      </div>
    </form>
  );
}
