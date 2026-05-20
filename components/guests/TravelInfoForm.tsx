'use client';

import { useState, useTransition } from 'react';
import { Plane, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import type { Guest } from '@/lib/types/database.types';

export function TravelInfoForm({ guest }: { guest: Guest }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [arrivalDate, setArrivalDate] = useState(guest.arrival_date ?? '');
  const [hotelName, setHotelName] = useState(guest.hotel_name ?? '');
  const [hotelAddress, setHotelAddress] = useState(guest.hotel_address ?? '');
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const { error } = await supabase
        .from('guests')
        .update({
          arrival_date: arrivalDate || null,
          hotel_name: hotelName || null,
          hotel_address: hotelAddress || null,
        })
        .eq('id', guest.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Travel info saved');
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plane className="h-3 w-3 mr-1.5" /> Travel
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Travel & accommodation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              For {guest.full_name}
            </p>
            <div className="space-y-2">
              <Label>Arrival date</Label>
              <Input
                type="date"
                value={arrivalDate ? arrivalDate.split('T')[0] : ''}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hotel name</Label>
              <Input
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="The Taj Mahal Palace"
              />
            </div>
            <div className="space-y-2">
              <Label>Hotel address</Label>
              <Input
                value={hotelAddress}
                onChange={(e) => setHotelAddress(e.target.value)}
                placeholder="Apollo Bunder, Mumbai"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={isPending}
                className="bg-rose-500 hover:bg-rose-600"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
