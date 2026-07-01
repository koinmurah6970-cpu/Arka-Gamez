"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "./star-rating";
import { emailToUsername } from "@/lib/auth-helpers";

type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  displayName: string;
};

export function ReviewList({
  gameId,
  initialReviews,
}: {
  gameId: string;
  initialReviews: ReviewRow[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const reviewsRef = useRef(reviews);

  useEffect(() => {
    reviewsRef.current = reviews;
  }, [reviews]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`reviews:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            setReviews((prev) => prev.filter((r) => r.id !== payload.old.id));
            return;
          }

          const row = payload.new as {
            id: string;
            user_id: string;
            rating: number;
            comment: string | null;
            created_at: string;
          };

          // Reuse the name we already have (e.g. a user editing their own
          // review fires UPDATE events) instead of re-querying profiles for
          // every realtime event.
          const known = reviewsRef.current.find((r) => r.user_id === row.user_id);
          let displayName = known?.displayName;
          if (!displayName) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", row.user_id)
              .single();
            displayName = profile?.full_name || emailToUsername(row.user_id.slice(0, 8));
          }

          const newReview: ReviewRow = { ...row, displayName };

          setReviews((prev) => {
            const existing = prev.findIndex((r) => r.id === row.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = newReview;
              return updated;
            }
            return [newReview, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return (
    <div>
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <StarRating rating={avgRating} size="md" />
          <span className="text-sm font-bold text-foreground">
            {avgRating.toFixed(1)}
          </span>
          <span className="text-xs text-muted">
            ({reviews.length} review)
          </span>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border-subtle p-4 text-center">
          <p className="text-sm text-muted">
            Belum ada review. Jadilah yang pertama kasih review!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-surface border border-border-subtle rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {review.displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {review.displayName}
                  </span>
                </div>
                <span className="text-[10px] text-muted">
                  {new Date(review.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <StarRating rating={review.rating} />
              {review.comment && (
                <p className="text-sm text-muted mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
