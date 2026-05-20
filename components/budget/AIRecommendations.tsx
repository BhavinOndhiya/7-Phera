'use client';

import { useState, useTransition } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatINR } from '@/lib/utils/formatting';
import type { Event } from '@/lib/types/database.types';

interface Recommendation {
  category: string;
  percent: number;
  amount: number;
  rationale: string;
}

export function AIRecommendations({ event }: { event: Event }) {
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState<string>('1500000');
  const [guestCount, setGuestCount] = useState<string>(
    event.estimated_guests?.toString() ?? '150'
  );
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [source, setSource] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      const res = await fetch('/api/ai/budget-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: event.event_type,
          totalBudget: Number(budget),
          guestCount: Number(guestCount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to generate');
        return;
      }
      setRecommendations(data.recommendations);
      setSource(data.source);
    });
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-amber-200 text-amber-700 hover:bg-amber-50"
      >
        <Sparkles className="h-4 w-4 mr-2" /> AI suggestions
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI budget recommendations</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="budget">Total budget (₹)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={isPending}
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate breakdown
            </Button>

            {recommendations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Suggested allocation</p>
                  {source && (
                    <Badge
                      variant="secondary"
                      className={
                        source === 'openai'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }
                    >
                      {source === 'openai' ? 'AI generated' : 'Template'}
                    </Badge>
                  )}
                </div>
                <div className="max-h-[40vh] overflow-y-auto space-y-2">
                  {recommendations.map((r, i) => (
                    <div key={i} className="rounded-lg border p-3 bg-card">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-sm">{r.category}</p>
                        <div className="text-right">
                          <p className="font-medium">{formatINR(r.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.percent.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.rationale}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Use these as a starting point — add items in the budget table to
                  track actual spending.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
