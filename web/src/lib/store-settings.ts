import { unstable_cache } from "next/cache";
import { createClient as createPublicClient } from "@/lib/supabase/public";
import { WA_ADMIN_NUMBER } from "@/lib/constants";

// Storefront-wide settings barely ever change -- cache instead of
// round-tripping to Supabase on every checkout-confirmation page view.
export const getStoreSettings = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("store_settings").select("*").eq("id", 1).single();
    return {
      waAdminNumber: data?.wa_admin_number || WA_ADMIN_NUMBER,
      bannerText: data?.banner_text ?? null,
    };
  },
  ["store-settings"],
  { revalidate: 300 }
);
