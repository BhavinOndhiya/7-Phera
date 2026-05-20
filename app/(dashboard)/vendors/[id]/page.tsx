'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, Globe, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VendorReviews } from '@/components/vendors/VendorReviews';
import { createClient } from '@/lib/supabase/client';
import type { Vendor } from '@/lib/types/database.types';

export default function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const supabase = createClient();
  const resolved = params instanceof Promise ? use(params) : params;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', resolved.id)
        .maybeSingle();
      setVendor(data);
      setLoading(false);
    })();
  }, [supabase, resolved.id]);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!vendor) return <p className="text-muted-foreground">Vendor not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
          <Link href="/vendors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to vendors
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="secondary" className="mb-2 capitalize">
              {vendor.category}
            </Badge>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              {vendor.name}
            </h1>
            {vendor.contact_person && (
              <p className="text-muted-foreground mt-1">
                Contact: {vendor.contact_person}
              </p>
            )}
          </div>
          {vendor.contract_signed && (
            <Badge className="bg-emerald-500">
              <CheckCircle className="h-3 w-3 mr-1" /> Contracted
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          {vendor.rating != null && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i <= (vendor.rating ?? 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
              <span className="text-sm font-medium ml-1">{vendor.rating}/5</span>
            </div>
          )}
          {vendor.price_range && (
            <p className="text-sm">
              <span className="text-muted-foreground">Price range:</span>{' '}
              {vendor.price_range}
            </p>
          )}
          <div className="space-y-1 text-sm">
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" /> {vendor.phone}
              </a>
            )}
            {vendor.email && (
              <a
                href={`mailto:${vendor.email}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" /> {vendor.email}
              </a>
            )}
            {vendor.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-3.5 w-3.5" /> {vendor.website}
              </a>
            )}
          </div>
          {vendor.notes && (
            <p className="text-sm text-muted-foreground border-t pt-3 whitespace-pre-line">
              {vendor.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <VendorReviews vendorId={vendor.id} />
    </div>
  );
}
