import { createClient } from '@/lib/supabase/server';

/** Returns true if the user can edit the workspace that owns this event. */
export async function canStaffManageEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  const supabase = createClient();

  const { data: event } = await supabase
    .from('events')
    .select('workspace_id')
    .eq('id', eventId)
    .maybeSingle();

  if (!event?.workspace_id) return false;

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', event.workspace_id)
    .eq('user_id', userId)
    .maybeSingle();

  return Boolean(member);
}

export async function requireStaffSession(): Promise<
  { userId: string } | { error: string; status: number }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Sign in required for staff actions', status: 401 };
  }

  return { userId: user.id };
}
