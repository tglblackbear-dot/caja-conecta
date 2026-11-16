function getConfig() {
  const { supabaseUrl = "", supabaseAnonKey = "" } = window.CAJA_CONECTA_CONFIG ?? {};
  const url = supabaseUrl.trim().replace(/\/+$/, "");
  const key = supabaseAnonKey.trim();
  if (!url && !key) {
    throw new Error("Supabase não configurado. Adicione a URL e a chave pública anon/publishable no ambiente.");
  }
  if (!url || !key) {
    throw new Error("Configure a URL e a chave pública anon/publishable do Supabase.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("A URL configurada para o Supabase é inválida.");
  }
  if (!["https:", "http:"].includes(parsedUrl.protocol) ||
      (parsedUrl.protocol === "http:" && !["localhost", "127.0.0.1"].includes(parsedUrl.hostname))) {
    throw new Error("A URL do Supabase precisa usar HTTPS (HTTP só é permitido em localhost).");
  }
  return { url, key };
}

let clientPromise;

export async function getSupabaseClient() {
  const { url, key } = getConfig();
  if (!clientPromise) {
    clientPromise = import("https://esm.sh/@supabase/supabase-js@2")
      .then(({ createClient }) => createClient(url, key))
      .catch((error) => {
        clientPromise = undefined;
        throw new Error("Não foi possível carregar o cliente do Supabase. Verifique a conexão e tente novamente.", { cause: error });
      });
  }
  return clientPromise;
}

export async function testSupabaseConnection() {
  const { url, key } = getConfig();
  let response;
  try {
    response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store"
    });
  } catch (error) {
    throw new Error("Não foi possível alcançar o Supabase. Verifique a URL, a conexão e as regras de rede.", { cause: error });
  }
  if (!response.ok) {
    throw new Error(`O endpoint Supabase Auth respondeu com HTTP ${response.status}. Confira o projeto e a chave pública.`);
  }
  return "Conexão com o Supabase Auth confirmada.";
}
