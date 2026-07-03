"use client";

import { useWishlist } from "./wishlist-context";

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className="h-4 w-4 flex-none"
    fill={filled ? "currentColor" : "none"}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

type Props = {
  gameId: string;
  /** compact = small icon overlay on cover; full = text button */
  variant?: "compact" | "full";
};

export function WishlistButton({ gameId, variant = "full" }: Props) {
  const { ids, toggle } = useWishlist();
  const isIn = ids.has(gameId);

  if (variant === "compact") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(gameId);
        }}
        aria-label={isIn ? "Hapus dari wishlist" : "Simpan ke wishlist"}
        className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg backdrop-blur-sm transition-all duration-150
          ${
            isIn
              ? "bg-red-500/90 text-white"
              : "bg-black/40 text-white opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-red-500/80"
          }`}
      >
        <svg
          className="h-3.5 w-3.5"
          fill={isIn ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={() => toggle(gameId)}
      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm border transition-all duration-150
        ${
          isIn
            ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/15"
            : "bg-background border-border-subtle text-muted hover:text-foreground hover:bg-border-subtle"
        }`}
    >
      <HeartIcon filled={isIn} />
      {isIn ? "Tersimpan di Wishlist" : "Simpan ke Wishlist"}
    </button>
  );
}
