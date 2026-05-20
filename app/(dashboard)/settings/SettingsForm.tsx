'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile, Role } from '@/lib/types/database.types';

export function SettingsForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [full_name, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [role, setRole] = useState<Role>(profile.role);

  function save() {
    startTransition(async () => {
      const { error } = await supabase
        .from('users')
        .update({ full_name, phone: phone || null, role })
        .eq('id', profile.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Profile updated');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={full_name}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
        />
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bride">Bride</SelectItem>
            <SelectItem value="groom">Groom</SelectItem>
            <SelectItem value="family">Family</SelectItem>
            <SelectItem value="planner">Planner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={save} disabled={isPending} className="bg-rose-500 hover:bg-rose-600">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </div>
  );
}
