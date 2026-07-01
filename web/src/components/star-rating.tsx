export function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-xs";

  return (
    <span className={`inline-flex gap-0.5 ${sizeClass}`} aria-label={`${rating} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? "text-amber-400" : "text-border-subtle"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <span className="inline-flex gap-1 text-2xl">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`transition hover:scale-110 ${
            star <= value ? "text-amber-400" : "text-border-subtle hover:text-amber-200"
          }`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
