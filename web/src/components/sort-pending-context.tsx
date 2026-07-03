"use client";

import { createContext, useContext, useState } from "react";

type SortPendingCtx = { isPending: boolean; notify: (v: boolean) => void };

export const SortPendingContext = createContext<SortPendingCtx>({
  isPending: false,
  notify: () => {},
});

export function SortPendingProvider({ children }: { children: React.ReactNode }) {
  const [isPending, setIsPending] = useState(false);
  return (
    <SortPendingContext.Provider value={{ isPending, notify: setIsPending }}>
      {children}
    </SortPendingContext.Provider>
  );
}

export function useSortPending() {
  return useContext(SortPendingContext);
}
