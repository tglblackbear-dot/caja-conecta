const CACHE_NAME = "caja-conecta-static-v13";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./assets/caja.svg",
  "./js/app.js",
  "./js/merchant-auth.js",
  "./js/catalog.js",
  "./js/runtime-config.js",
  "./js/services/listings.js",
  "./js/services/supabase-client.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("caja-conecta-static-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.includes("/rest/v1/") || url.pathname.includes("/auth/")) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch (error) {
      if (request.mode === "navigate") {
        const home = await caches.match("./index.html");
        if (home) return home;
      }
      throw error;
    }
  })());
});
