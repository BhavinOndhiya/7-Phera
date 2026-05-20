'use client';

import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
import { Mail, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useEvents } from '@/lib/hooks/useEvents';
import { EmptyState } from '@/components/shared/EmptyState';
import type { UserProfile, CollaboratorRole } from '@/lib/types/database.types';

interface CollaboratorRow {
  id: string;
  event_id: string;
  user_id: string;
  role: CollaboratorRole;
  profile: UserProfile | null;
  event_name: string;
}

export default function CollaboratorsPage() {
  const supabase = createClient();
  const { events } = useEvents();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('editor');
  const [eventId, setEventId] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [collaborators, setCollaborators] = useState<CollaboratorRow[]>([]);

  useEffect(() => {
    if (events.length > 0 && !eventId) setEventId(events[0].id);
  }, [events, eventId]);

  useEffect(() => {
    (async () => {
      const { data: collab } = await supabase
        .from('event_collaborators')
        .select('*');
      if (!collab || collab.length === 0) {
        setCollaborators([]);
        return;
      }
      const userIds = Array.from(new Set(collab.map((c) => c.user_id)));
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);
      const rows = collab.map((c) => ({
        id: c.id,
        event_id: c.event_id,
        user_id: c.user_id,
        role: c.role,
        profile: users?.find((u) => u.id === c.user_id) ?? null,
        event_name: events.find((e) => e.id === c.event_id)?.name ?? '—',
      }));
      setCollaborators(rows);
    })();
  }, [supabase, events]);

  function invite() {
    if (!email) {
      toast.error('Email required');
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/collaborators/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, eventId: eventId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Invite failed');
        return;
      }
      toast.success(`Invitation sent to ${email}`);
      setEmail('');
    });
  }

  async function remove(id: string) {
    if (!confirm('Remove this collaborator?')) return;
    const { error } = await supabase
      .from('event_collaborators')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
    toast.success('Removed');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Collaborators</h1>
        <p className="text-muted-foreground mt-1">
          Invite family members or planners to help with your events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite someone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="family@example.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as CollaboratorRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Event (optional)</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={invite}
            disabled={isPending}
            className="bg-rose-500 hover:bg-rose-600"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send invitation
          </Button>
          <p className="text-xs text-muted-foreground">
            Requires SUPABASE_SERVICE_ROLE_KEY in .env.local. The invited user
            receives an email with a Supabase magic link to set up their account.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current collaborators</CardTitle>
        </CardHeader>
        <CardContent>
          {collaborators.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No collaborators yet"
              description="Invite someone above to share planning duties."
            />
          ) : (
            <div className="divide-y -m-6">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="font-medium">
                      {c.profile?.full_name ?? c.profile?.email ?? c.user_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.event_name} · {c.profile?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {c.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => remove(c.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
