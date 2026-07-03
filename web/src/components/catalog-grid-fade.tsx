"use client";

import { useSortPending } from "./sort-pending-context";

export function CatalogGridFade({ children }: { children: React.ReactNode }) {
  const { isPending } = useSortPending();
  return (
    <div
      className={`transition-opacity duration-200 ${
        isPending ? "opacity-40 pointer-events-none select-none" : ""
      }`}
    >
      {children}
    </div>
  );
}
