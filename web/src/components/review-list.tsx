"use client";

import { useEffect, useState } from "react";
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

          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", row.user_id)
            .single();

          const newReview: ReviewRow = {
            ...row,
            displayName: profile?.full_name || emailToUsername(row.user_id.slice(0, 8)),
          };

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
      <div className="flex items-center gap-2 mb-4">
        {reviews.length > 0 ? (
          <>
            <StarRating rating={avgRating} size="md" />
            <span className="text-sm font-bold text-gray-700">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({reviews.length} review)
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400">Belum ada review</span>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Jadilah yang pertama kasih review!
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {review.displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {review.displayName}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(review.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <StarRating rating={review.rating} />
              {review.comment && (
                <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
