'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VendorCard } from '@/components/vendors/VendorCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { useVendors } from '@/lib/hooks/useVendors';
import { useBudget } from '@/lib/hooks/useBudget';
import { useEvent } from '@/lib/hooks/useEvents';

export default function EventVendorsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = params instanceof Promise ? use(params) : params;
  const { event } = useEvent(resolved.id);
  const { vendors } = useVendors();
  const { budgetItems } = useBudget(resolved.id);

  const linkedVendorIds = useMemo(
    () => new Set(budgetItems.map((i) => i.vendor_id).filter(Boolean)),
    [budgetItems]
  );
  const linkedVendors = vendors.filter((v) => linkedVendorIds.has(v.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
          <Link href={`/events/${resolved.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to event
          </Link>
        </Button>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold">
          Vendors {event ? `· ${event.name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Vendors linked through your budget items.
        </p>
      </div>

      {linkedVendors.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={Store}
              title="No vendors linked"
              description="Add budget items and link them to vendors from your directory."
              action={
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/events/${resolved.id}/budget`}>
                      Open budget
                    </Link>
                  </Button>
                  <Button asChild className="bg-rose-500 hover:bg-rose-600">
                    <Link href="/vendors">Browse vendor directory</Link>
                  </Button>
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {linkedVendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}
