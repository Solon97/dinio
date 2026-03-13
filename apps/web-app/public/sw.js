const CACHE_NAME = "dinio-v1";
const STATIC_CACHE = "dinio-static-v1";

// Flag para identificar se está rodando como PWA instalado
let isStandaloneMode = false;

// Apenas páginas essenciais do PWA
const STATIC_ASSETS = [
  "/dashboard",
  "/signin",
  "/subscribe",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Rotas bloqueadas apenas no PWA instalado
const PWA_BLOCKED_ROUTES = ["/", "/blog", "/privacy-policy", "/tos"];

// Receber mensagens do cliente
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_STANDALONE_MODE") {
    isStandaloneMode = event.data.isStandalone;
  }
});

// Instalar service worker e fazer cache dos assets estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error("Failed to cache static assets:", error);
      });
    })
  );
  self.skipWaiting();
});

// Ativar service worker e limpar caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Apenas interceptar requisições do mesmo domínio
  if (url.origin !== location.origin) {
    return;
  }

  // Bloquear rotas não essenciais APENAS quando instalado como PWA
  if (isStandaloneMode) {
    const isBlockedRoute = PWA_BLOCKED_ROUTES.some(
      (route) => url.pathname === route || url.pathname.startsWith("/blog/")
    );
    
    if (isBlockedRoute) {
      event.respondWith(Response.redirect("/dashboard", 302));
      return;
    }
  }

  // Estratégia: Network First para páginas dinâmicas
  if (
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/api/")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone da resposta para armazenar no cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Se falhar, tenta buscar do cache
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response("Offline", { status: 503 });
          });
        })
    );
    return;
  }

  // Estratégia: Cache First para assets estáticos
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      });
    })
  );
});
