import { DEMO_LISTINGS } from "../catalog.js";
import { getSupabaseClient } from "./supabase-client.js";

const PUBLIC_LISTING_FIELDS = "id,title,business_name,description,category,neighborhood,whatsapp";

export async function loadListings() {
  const config = window.CAJA_CONECTA_CONFIG ?? {};
  const { supabaseUrl, supabaseAnonKey } = config;

  if (!supabaseUrl && !supabaseAnonKey) {
    return { listings: DEMO_LISTINGS, demo: true };
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configure a URL e a chave pública do Supabase para carregar anúncios publicados.");
  }

  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("listings")
    .select(PUBLIC_LISTING_FIELDS)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Não foi possível carregar os anúncios: ${error.message}`);
  }

  return {
    listings: data.map((listing) => ({
      ...listing,
      businessName: listing.business_name,
      neighborhood: listing.neighborhood,
      icon: "✳",
      color: "#e8f4eb"
    })),
    demo: false
  };
}
