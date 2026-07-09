// Hand-written types mirroring supabase/schema.sql (run `supabase gen types
// typescript` once the project is linked, and replace this file with the
// generated output to stay in sync automatically).
//
// NOTE: these must stay `type` aliases, not `interface` declarations --
// interfaces break generic inference in supabase-js's `.rpc()` typing
// (the Database['public'] schema fails its structural `extends GenericSchema`
// check, silently collapsing every RPC call's args to `undefined`).

export type GameStatus = "draft" | "active" | "archived";
export type CoverSource = "steamgriddb" | "rawg" | "manual" | "placeholder";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "processing"
  | "completed"
  | "cancelled";

export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type Genre = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
};

export type GameGenre = {
  game_id: string;
  genre_id: string;
  created_at: string;
};

export type Game = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  size_label: string | null;
  size_gb: number | null;
  category_id: string | null;
  price: number;
  original_price: number;
  cover_url: string | null;
  cover_source: CoverSource | null;
  source_id: string | null;
  rating: number | null;
  status: GameStatus;
  is_featured: boolean;
  is_new: boolean;
  view_count: number;
  min_ram_gb: number | null;
  min_cpu_tier: number | null;
  min_gpu_tier: number | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
};

export type GameMedia = {
  id: string;
  game_id: string;
  media_type: "image" | "video";
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_name: string | null;
  guest_whatsapp: string | null;
  player_id: string;
  status: OrderStatus;
  payment_method: string;
  subtotal: number;
  total: number;
  notes: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  game_id: string | null;
  game_name_snapshot: string;
  price: number;
};

export type ProfileRole = "customer" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  whatsapp_number: string | null;
  role: ProfileRole;
  created_at: string;
};

export type Review = {
  id: string;
  game_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type Wishlist = {
  id: string;
  user_id: string;
  game_id: string;
  created_at: string;
};

export type GameRequestStatus = "pending" | "fulfilled" | "rejected";

export type GameRequest = {
  id: string;
  game_name: string;
  platform: string | null;
  notes: string | null;
  requester_name: string;
  requester_wa: string;
  status: GameRequestStatus;
  admin_notes: string | null;
  created_at: string;
};

export type StoreSettings = {
  id: number;
  wa_admin_number: string;
  default_price: number;
  default_original_price: number;
  banner_text: string | null;
  updated_at: string;
};

export type PromoCard = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Partial<Category>;
        Update: Partial<Category>;
        Relationships: [];
      };
      genres: {
        Row: Genre;
        Insert: Partial<Genre>;
        Update: Partial<Genre>;
        Relationships: [];
      };
      game_genres: {
        Row: GameGenre;
        Insert: Partial<GameGenre>;
        Update: Partial<GameGenre>;
        Relationships: [
          {
            foreignKeyName: "game_genres_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_genres_genre_id_fkey";
            columns: ["genre_id"];
            isOneToOne: false;
            referencedRelation: "genres";
            referencedColumns: ["id"];
          }
        ];
      };
      games: {
        Row: Game;
        Insert: Partial<Game>;
        Update: Partial<Game>;
        Relationships: [
          {
            foreignKeyName: "games_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      cart_items: {
        Row: { id: string; user_id: string; game_id: string; created_at: string };
        Insert: { user_id: string; game_id: string; id?: string; created_at?: string };
        Update: Partial<{ user_id: string; game_id: string }>;
        Relationships: [
          { foreignKeyName: "cart_items_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "cart_items_game_id_fkey"; columns: ["game_id"]; isOneToOne: false; referencedRelation: "games"; referencedColumns: ["id"] },
        ];
      };
      game_media: {
        Row: GameMedia;
        Insert: Partial<GameMedia>;
        Update: Partial<GameMedia>;
        Relationships: [
          {
            foreignKeyName: "game_media_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order>; Relationships: [] };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem>;
        Update: Partial<OrderItem>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: Review;
        Insert: Partial<Review>;
        Update: Partial<Review>;
        Relationships: [
          {
            foreignKeyName: "reviews_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      store_settings: {
        Row: StoreSettings;
        Insert: Partial<StoreSettings>;
        Update: Partial<StoreSettings>;
        Relationships: [];
      };
      promo_cards: {
        Row: PromoCard;
        Insert: Partial<PromoCard>;
        Update: Partial<PromoCard>;
        Relationships: [];
      };
      game_requests: {
        Row: GameRequest;
        Insert: Partial<GameRequest>;
        Update: Partial<GameRequest>;
        Relationships: [];
      };
      wishlists: {
        Row: Wishlist;
        Insert: Partial<Wishlist>;
        Update: Partial<Wishlist>;
        Relationships: [
          {
            foreignKeyName: "wishlists_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_order: {
        Args: {
          p_player_id: string;
          p_guest_name: string | null;
          p_guest_whatsapp: string | null;
          p_items: { game_id: string; name: string; price: number }[];
        };
        Returns: Order;
      };
      submit_game_request: {
        Args: {
          p_game_name: string;
          p_platform: string | null;
          p_notes: string | null;
          p_requester_name: string;
          p_requester_wa: string;
        };
        Returns: { success?: boolean; error?: string };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
