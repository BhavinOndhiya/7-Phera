'use client';

import Link from 'next/link';
import {
  Phone,
  Mail,
  Globe,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Vendor } from '@/lib/types/database.types';

interface VendorCardProps {
  vendor: Vendor;
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
  onCompareToggle?: (vendor: Vendor) => void;
  isComparing?: boolean;
}

export function VendorCard({
  vendor,
  onEdit,
  onDelete,
  onCompareToggle,
  isComparing,
}: VendorCardProps) {
  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md ${
        isComparing ? 'ring-2 ring-rose-500 border-rose-500' : ''
      }`}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium leading-tight truncate">{vendor.name}</h3>
            <Badge variant="secondary" className="mt-1 capitalize">
              {vendor.category}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onCompareToggle && (
                <DropdownMenuItem onClick={() => onCompareToggle(vendor)}>
                  {isComparing ? 'Remove from compare' : 'Add to compare'}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(vendor)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(vendor)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {vendor.rating ? (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-3.5 w-3.5 ${
                  n <= Number(vendor.rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/40'
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              {Number(vendor.rating).toFixed(1)}
            </span>
          </div>
        ) : null}

        <div className="space-y-1.5 text-sm">
          {vendor.contact_person && (
            <p className="text-muted-foreground">{vendor.contact_person}</p>
          )}
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
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground truncate"
            >
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{vendor.email}</span>
            </a>
          )}
          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-rose-600 hover:text-rose-700 truncate"
            >
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{vendor.website}</span>
            </a>
          )}
        </div>

        {vendor.price_range && (
          <div className="text-sm font-medium text-foreground">
            {vendor.price_range}
          </div>
        )}

        {vendor.contract_signed && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 pt-2 border-t">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Contract signed
            {vendor.contract_url && (
              <a
                href={vendor.contract_url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1 hover:underline"
              >
                <FileText className="h-3 w-3" /> View
              </a>
            )}
          </div>
        )}

        <Button asChild variant="ghost" size="sm" className="w-full -mb-1 text-xs">
          <Link href={`/vendors/${vendor.id}`}>
            <MessageSquare className="h-3 w-3 mr-1.5" /> View details & reviews
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
