"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

type WishlistCtx = {
  ids: Set<string>;
  toggle: (gameId: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistCtx>({
  ids: new Set(),
  toggle: async () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const idsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  async function loadWishlist(userId: string) {
    try {
      const { data } = await supabase
        .from("wishlists")
        .select("game_id")
        .eq("user_id", userId);
      setIds(new Set((data ?? []).map((r: { game_id: string }) => r.game_id)));
    } catch {
      // table may not exist yet
    }
  }

  useEffect(() => {
    // onAuthStateChange dengan INITIAL_SESSION membaca dari localStorage (no network)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        if (session?.user) {
          setUser(session.user);
          loadWishlist(session.user.id);
        }
      } else if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        loadWishlist(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIds(new Set());
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const toggle = useCallback(async (gameId: string) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const isIn = idsRef.current.has(gameId);

    // Optimistic update
    setIds((prev) => {
      const next = new Set(prev);
      if (isIn) { next.delete(gameId); } else { next.add(gameId); }
      return next;
    });

    try {
      if (isIn) {
        await supabase.from("wishlists").delete().eq("game_id", gameId).eq("user_id", user.id);
      } else {
        await supabase.from("wishlists").insert({ game_id: gameId, user_id: user.id });
      }
    } catch {
      // Revert on error
      setIds((prev) => {
        const next = new Set(prev);
        if (isIn) { next.add(gameId); } else { next.delete(gameId); }
        return next;
      });
    }
  }, [user]);

  return (
    <WishlistContext.Provider value={{ ids, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
