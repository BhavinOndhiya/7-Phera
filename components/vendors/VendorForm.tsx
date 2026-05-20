'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Star } from 'lucide-react';
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
import { vendorSchema } from '@/lib/utils/validation';
import { VENDOR_CATEGORIES } from '@/lib/constants';
import type { Vendor } from '@/lib/types/database.types';

interface VendorFormProps {
  initial?: Vendor;
  onDone?: (vendor: Vendor | null) => void;
}

export function VendorForm({ initial, onDone }: VendorFormProps) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    category: initial?.category ?? 'Photographer',
    contact_person: initial?.contact_person ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    address: initial?.address ?? '',
    website: initial?.website ?? '',
    rating: initial?.rating ?? 0,
    price_range: initial?.price_range ?? '',
    notes: initial?.notes ?? '',
    contract_signed: initial?.contract_signed ?? false,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = vendorSchema.safeParse({
      ...form,
      rating: form.rating || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid form');
      return;
    }

    startTransition(async () => {
      const payload = {
        ...parsed.data,
        email: parsed.data.email || null,
        website: parsed.data.website || null,
        contact_person: parsed.data.contact_person || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        price_range: parsed.data.price_range || null,
        notes: parsed.data.notes || null,
      };

      if (initial) {
        const { data, error } = await supabase
          .from('vendors')
          .update(payload)
          .eq('id', initial.id)
          .select()
          .single();
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success('Vendor updated');
        onDone?.(data);
      } else {
        const { data, error } = await supabase
          .from('vendors')
          .insert(payload)
          .select()
          .single();
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(`${data!.name} added`);
        onDone?.(data);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">
            Vendor name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Royal Pixels Studio"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VENDOR_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact person</Label>
          <Input
            id="contact_person"
            value={form.contact_person}
            onChange={(e) =>
              setForm({ ...form, contact_person: e.target.value })
            }
          />
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
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://"
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
          <Label htmlFor="price_range">Price range</Label>
          <Input
            id="price_range"
            value={form.price_range}
            onChange={(e) => setForm({ ...form, price_range: e.target.value })}
            placeholder="e.g. Rs 50,000 - Rs 1,50,000"
          />
        </div>

        <div className="space-y-2">
          <Label>Rating</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() =>
                  setForm({ ...form, rating: form.rating === n ? 0 : n })
                }
                className="hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-6 w-6 ${
                    n <= (form.rating ?? 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
            {(form.rating ?? 0) > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {form.rating}/5
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox
            id="contract"
            checked={form.contract_signed}
            onCheckedChange={(c) =>
              setForm({ ...form, contract_signed: c === true })
            }
          />
          <Label htmlFor="contract" className="cursor-pointer">
            Contract signed
          </Label>
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
          {initial ? 'Save vendor' : 'Add vendor'}
        </Button>
      </div>
    </form>
  );
}
