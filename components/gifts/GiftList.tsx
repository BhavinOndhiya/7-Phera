'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Gift as GiftIcon,
  ExternalLink,
  Check,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { GiftForm } from './GiftForm';
import { useGifts } from '@/lib/hooks/useGifts';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { formatINR } from '@/lib/utils/formatting';
import type { Gift } from '@/lib/types/database.types';

export function GiftList({ eventId }: { eventId: string }) {
  const { gifts, loading, deleteGift, toggleClaim } = useGifts(eventId);
  const { confirm } = useConfirm();
  const { can } = useWorkspace();
  const canEdit = can('edit_budget');
  const canDelete = can('delete_budget');
  const canCreate = can('create_budget');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">
          {gifts.length} {gifts.length === 1 ? 'item' : 'items'}
        </h2>
        {canCreate && (
          <Button
            className="bg-rose-500 hover:bg-rose-600"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add gift
          </Button>
        )}
      </div>

      {loading && (
        <p className="text-center text-muted-foreground py-8">Loading…</p>
      )}

      {!loading && gifts.length === 0 && (
        <EmptyState
          icon={GiftIcon}
          title="No gift suggestions yet"
          description="Help guests pick the perfect present by adding wishlist items."
          action={
            <Button
              className="bg-rose-500 hover:bg-rose-600"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add gift
            </Button>
          }
        />
      )}

      {gifts.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gifts.map((gift) => {
            const claimed = Boolean(gift.claimed_by);
            return (
              <Card key={gift.id} className={claimed ? 'opacity-75' : ''}>
                {gift.image_url && (
                  <div className="aspect-video relative bg-muted">
                    <Image
                      src={gift.image_url}
                      alt={gift.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover rounded-t-xl"
                    />
                    {claimed && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-emerald-500">
                          <Check className="h-3 w-3 mr-1" /> Claimed
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{gift.name}</p>
                      {gift.price && (
                        <p className="text-sm text-rose-600 font-medium">
                          {formatINR(gift.price)}
                        </p>
                      )}
                    </div>
                    {!gift.image_url && claimed && (
                      <Badge className="bg-emerald-500">
                        <Check className="h-3 w-3 mr-1" /> Claimed
                      </Badge>
                    )}
                  </div>
                  {gift.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {gift.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-1 pt-2 border-t">
                    {gift.url && (
                      <Button asChild variant="ghost" size="sm" className="text-xs">
                        <a href={gift.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" /> View
                        </a>
                      </Button>
                    )}
                    <Button
                      variant={claimed ? 'outline' : 'default'}
                      size="sm"
                      className={`text-xs ${
                        claimed ? '' : 'bg-rose-500 hover:bg-rose-600'
                      }`}
                      onClick={() => toggleClaim(gift)}
                    >
                      {claimed ? 'Unclaim' : 'Claim'}
                    </Button>
                    <div className="flex-1" />
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditing(gift)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Remove gift',
                            description: `Remove ${gift.name} from the registry?`,
                            confirmLabel: 'Remove',
                            variant: 'destructive',
                          });
                          if (ok) await deleteGift(gift.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add gift suggestion</DialogTitle>
          </DialogHeader>
          <GiftForm eventId={eventId} onDone={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit gift</DialogTitle>
          </DialogHeader>
          {editing && (
            <GiftForm
              eventId={eventId}
              initial={editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
