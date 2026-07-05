"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface CartItem {
  gameId: string;
  slug: string;
  name: string;
  price: number;
  coverUrl: string | null;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (gameId: string) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "linkyu-cart";

function readLocalCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function clearLocalCart() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const supabase = useRef(createClient()).current;

  const fetchSupabaseCart = useCallback(async (userId: string): Promise<CartItem[]> => {
    const { data } = await supabase
      .from("cart_items")
      .select("game_id, game:games(id, slug, name, price, cover_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!data) return [];
    return data
      .filter((row) => row.game && !Array.isArray(row.game))
      .map((row) => {
        const g = row.game as { id: string; slug: string; name: string; price: number; cover_url: string | null };
        return { gameId: g.id, slug: g.slug, name: g.name, price: g.price, coverUrl: g.cover_url };
      });
  }, [supabase]);

  const migrateLocalCart = useCallback(async (userId: string) => {
    const local = readLocalCart();
    if (local.length === 0) return;
    await supabase.from("cart_items").upsert(
      local.map((item) => ({ user_id: userId, game_id: item.gameId })),
      { onConflict: "user_id,game_id" }
    );
    clearLocalCart();
  }, [supabase]);

  // Hydration: baca localStorage dulu (instant), lalu sync Supabase di background
  useEffect(() => {
    // Render instant dari localStorage
    setItems(readLocalCart());
    setHydrated(true);
  }, []);

  // Auth listener — INITIAL_SESSION baca dari localStorage (no network), SIGNED_IN/OUT react ke perubahan
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") {
        if (session?.user) {
          setUser(session.user);
          // Sync cart dari Supabase di background, tidak block render
          migrateLocalCart(session.user.id).then(() =>
            fetchSupabaseCart(session.user.id).then(setItems)
          );
        }
      } else if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        await migrateLocalCart(session.user.id);
        const cartItems = await fetchSupabaseCart(session.user.id);
        setItems(cartItems);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setItems([]);
        clearLocalCart();
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchSupabaseCart, migrateLocalCart, supabase]);

  // Persist to localStorage when guest
  useEffect(() => {
    if (!hydrated || user) return;
    writeLocalCart(items);
  }, [items, hydrated, user]);

  const addItem = useCallback(async (item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.gameId === item.gameId)) return prev;
      return [...prev, item];
    });
    if (user) {
      await supabase.from("cart_items").upsert(
        { user_id: user.id, game_id: item.gameId },
        { onConflict: "user_id,game_id" }
      );
    }
  }, [user, supabase]);

  const removeItem = useCallback(async (gameId: string) => {
    setItems((prev) => prev.filter((i) => i.gameId !== gameId));
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id).eq("game_id", gameId);
    }
  }, [user, supabase]);

  const clear = useCallback(async () => {
    setItems([]);
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
    } else {
      clearLocalCart();
    }
  }, [user, supabase]);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, total, count: items.length }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
