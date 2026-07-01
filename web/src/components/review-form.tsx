"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StarRatingInput } from "./star-rating";

export function ReviewForm({
  gameId,
  userId,
  hasOrdered,
  existingReview,
}: {
  gameId: string;
  userId: string | null;
  hasOrdered: boolean;
  existingReview: { id: string; rating: number; comment: string | null } | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!userId) {
    return (
      <div className="bg-surface rounded-xl border border-border-subtle p-4 text-center">
        <p className="text-sm text-muted">
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Masuk
          </Link>{" "}
          untuk memberikan review.
        </p>
      </div>
    );
  }

  if (!hasOrdered) {
    return (
      <div className="bg-surface rounded-xl border border-border-subtle p-4 text-center">
        <p className="text-sm text-muted">
          Kamu harus membeli game ini dulu sebelum bisa kasih review.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pilih rating bintang dulu.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const payload = {
      game_id: gameId,
      user_id: userId!,
      rating,
      comment: comment.trim() || null,
    };

    const { error: dbError } = existingReview
      ? await supabase.from("reviews").update(payload).eq("id", existingReview.id)
      : await supabase.from("reviews").insert(payload);

    setSubmitting(false);

    if (dbError) {
      setError("Gagal menyimpan review. Coba lagi.");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border-subtle p-4">
      <p className="text-xs font-bold text-muted uppercase mb-3">
        {existingReview ? "Edit Review Kamu" : "Tulis Review"}
      </p>
      <div className="mb-3">
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Ceritain pengalaman lu main game ini... (opsional)"
        className="w-full bg-background border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition mb-3"
      />
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      {success && (
        <p className="text-emerald-500 text-xs mb-2">Review berhasil disimpan!</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="bg-accent text-accent-foreground text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : existingReview ? "Update Review" : "Kirim Review"}
      </button>
    </form>
  );
}
