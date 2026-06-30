"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StarRatingInput } from "./star-rating";

export function ReviewForm({
  gameId,
  userId,
  existingReview,
}: {
  gameId: string;
  userId: string | null;
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
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Masuk
          </Link>{" "}
          untuk memberikan review.
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
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-bold text-gray-500 uppercase mb-3">
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
        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition mb-3"
      />
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      {success && (
        <p className="text-emerald-600 text-xs mb-2">Review berhasil disimpan!</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : existingReview ? "Update Review" : "Kirim Review"}
      </button>
    </form>
  );
}
