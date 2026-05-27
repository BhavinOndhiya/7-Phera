/**
 * Extract workspace invitation token from a raw code or full invite URL.
 */
export function parseWorkspaceInviteToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('token=')) {
    try {
      const url = trimmed.startsWith('http')
        ? new URL(trimmed)
        : new URL(trimmed, 'https://invite.local');
      const fromQuery = url.searchParams.get('token');
      if (fromQuery) return fromQuery.trim();
      const pathMatch = url.pathname.match(/\/invite\/accept\/?$/i);
      if (pathMatch && url.searchParams.get('token')) {
        return url.searchParams.get('token')!.trim();
      }
    } catch {
      // fall through to raw token
    }
  }

  return trimmed;
}
