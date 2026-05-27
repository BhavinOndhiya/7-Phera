import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AcceptInviteClient } from './AcceptInviteClient';

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
          <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
        </div>
      }
    >
      <AcceptInviteClient />
    </Suspense>
  );
}
