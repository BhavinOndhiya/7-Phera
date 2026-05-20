'use client';

import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-gold-50 p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center">
          <TriangleAlert className="h-8 w-8 text-rose-600" />
        </div>
        <h1 className="font-serif text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          We hit an unexpected snag. Try again — if the problem persists, please
          refresh the page.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-2">
          <Button onClick={reset} className="bg-rose-500 hover:bg-rose-600">
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh page
          </Button>
        </div>
      </div>
    </div>
  );
}
