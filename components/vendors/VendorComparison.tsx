'use client';

import { Star, X, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Vendor } from '@/lib/types/database.types';

interface VendorComparisonProps {
  vendors: Vendor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (vendor: Vendor) => void;
}

export function VendorComparison({
  vendors,
  open,
  onOpenChange,
  onRemove,
}: VendorComparisonProps) {
  if (vendors.length === 0) return null;

  const rows: { label: string; render: (v: Vendor) => React.ReactNode }[] = [
    {
      label: 'Category',
      render: (v) => (
        <Badge variant="secondary" className="capitalize">
          {v.category}
        </Badge>
      ),
    },
    {
      label: 'Rating',
      render: (v) =>
        v.rating ? (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-3.5 w-3.5 ${
                  n <= Number(v.rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/30'
                }`}
              />
            ))}
            <span className="ml-1 text-xs">{Number(v.rating).toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      label: 'Price range',
      render: (v) =>
        v.price_range || <span className="text-muted-foreground">—</span>,
    },
    {
      label: 'Contact',
      render: (v) =>
        v.contact_person || <span className="text-muted-foreground">—</span>,
    },
    {
      label: 'Phone',
      render: (v) => v.phone || <span className="text-muted-foreground">—</span>,
    },
    {
      label: 'Email',
      render: (v) => v.email || <span className="text-muted-foreground">—</span>,
    },
    {
      label: 'Website',
      render: (v) =>
        v.website ? (
          <a
            href={v.website}
            target="_blank"
            rel="noreferrer"
            className="text-rose-600 hover:underline"
          >
            Visit
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      label: 'Contract signed',
      render: (v) =>
        v.contract_signed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        ),
    },
    {
      label: 'Notes',
      render: (v) => (
        <p className="text-xs whitespace-pre-wrap">
          {v.notes || <span className="text-muted-foreground">—</span>}
        </p>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Compare vendors ({vendors.length})</DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 border-b font-medium text-muted-foreground bg-muted/30 w-40">
                  &nbsp;
                </th>
                {vendors.map((v) => (
                  <th
                    key={v.id}
                    className="text-left p-3 border-b min-w-[180px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{v.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mt-1"
                        onClick={() => onRemove(v)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b last:border-b-0">
                  <td className="p-2 font-medium text-muted-foreground bg-muted/30 align-top">
                    {row.label}
                  </td>
                  {vendors.map((v) => (
                    <td key={v.id} className="p-3 align-top">
                      {row.render(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
