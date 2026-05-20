'use client';

import { useEffect, useState, useTransition } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { timeAgo, getInitials } from '@/lib/utils/formatting';
import type { VendorReview, UserProfile } from '@/lib/types/database.types';

interface ReviewWithProfile extends VendorReview {
  profile: UserProfile | null;
}

export function VendorReviews({ vendorId }: { vendorId: string }) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();

  async function load() {
    const { data, error } = await supabase
      .from('vendor_reviews')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const reviewerIds = Array.from(
      new Set((data ?? []).map((r) => r.reviewer_id).filter(Boolean))
    ) as string[];
    let profiles: UserProfile[] = [];
    if (reviewerIds.length > 0) {
      const { data: p } = await supabase
        .from('users')
        .select('*')
        .in('id', reviewerIds);
      profiles = p ?? [];
    }
    const rows: ReviewWithProfile[] = (data ?? []).map((r) => ({
      ...r,
      profile: profiles.find((p) => p.id === r.reviewer_id) ?? null,
    }));
    setReviews(rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  function submit() {
    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from('vendor_reviews').insert({
        vendor_id: vendorId,
        reviewer_id: user?.id ?? null,
        rating,
        comment: comment.trim(),
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Review posted');
      setComment('');
      setRating(5);
      await load();
    });
  }

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="font-serif text-lg font-semibold">Reviews</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-medium">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-sm font-medium mb-1.5">Your rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => setRating(r)}
                  className="focus:outline-none"
                  aria-label={`${r} star${r > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      r <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this vendor…"
            rows={3}
          />
          <Button
            onClick={submit}
            disabled={isPending}
            className="bg-rose-500 hover:bg-rose-600"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Post review
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <p className="text-center text-muted-foreground text-sm py-4">Loading…</p>
      )}

      {!loading && reviews.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-4">
          No reviews yet — be the first.
        </p>
      )}

      <div className="space-y-2">
        {reviews.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {getInitials(r.profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">
                      {r.profile?.full_name ?? 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(r.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i <= r.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-sm mt-2 whitespace-pre-line">
                      {r.comment}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
