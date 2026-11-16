const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Defina SUPABASE_URL e SUPABASE_ANON_KEY no ambiente para verificar a conexão.");
  process.exitCode = 1;
} else {
  let url;
  try {
    url = new URL(`${supabaseUrl}/auth/v1/health`);
    if (!["https:", "http:"].includes(url.protocol) ||
        (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname))) {
      throw new Error();
    }
  } catch {
    console.error("SUPABASE_URL precisa ser HTTPS (HTTP só é permitido em localhost).");
    process.exitCode = 1;
  }

  if (url) {
    try {
      const response = await fetch(url, {
        headers: { apikey: supabaseAnonKey },
        cache: "no-store"
      });
      if (!response.ok) {
        console.error(`Supabase Auth respondeu com HTTP ${response.status}. Verifique a URL e a chave pública.`);
        process.exitCode = 1;
      } else {
        console.log("Conexão com o endpoint Supabase Auth confirmada.");
      }
    } catch {
      console.error("Não foi possível alcançar o Supabase Auth. Verifique a URL e a conexão.");
      process.exitCode = 1;
    }
  }
}
