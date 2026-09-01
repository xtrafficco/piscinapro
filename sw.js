/* ============================================================
   PiscinaPro — Service Worker (PWA instalável + offline)
   - App shell (JS/CSS/HTML da app): NETWORK-FIRST — sempre pega a
     versão mais nova quando online; cai pro cache só offline. Evita
     servir código velho após um deploy (nada de "recarregar 2x").
   - Navegação: network-first com fallback ao index em cache
   - CDN (esm.sh / Google Fonts): cache-first em runtime (permite
     abrir o app offline com a lib do Supabase já baixada)
   - API do Supabase: SEMPRE rede (nunca cacheia dados dinâmicos)
   ============================================================ */
const VERSION = 'piscinapro-v3';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './orcamentos.js',
  './supabase.js',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL).then(c => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

function isSupabaseApi(url) {
  return url.hostname.endsWith('.supabase.co');
}
function isCdn(url) {
  return url.hostname === 'esm.sh' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return; // escritas nunca são interceptadas
  const url = new URL(req.url);

  // Dados do Supabase (REST/Realtime/Auth): sempre rede, nunca cache
  if (isSupabaseApi(url)) return;

  // Navegação (abrir o app): rede primeiro, cai pro index em cache offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // CDN da lib e fontes: cache-first (permite carregar offline)
  if (isCdn(url)) {
    event.respondWith(
      caches.open(RUNTIME).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Assets do próprio app (mesma origem): network-first, cache como
  // fallback offline. Garante que uma atualização de código apareça
  // já na próxima carga (sem duplo reload).
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(SHELL).then(async cache => {
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          const hit = await cache.match(req);
          return hit || Response.error();
        }
      })
    );
  }
});

/* Web Push (pronto para push do servidor, quando houver VAPID + edge function).
   Hoje as notificações locais chamam registration.showNotification direto. */
self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = { title: 'PiscinaPro', body: event.data && event.data.text() }; }
  const title = payload.title || 'PiscinaPro';
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || '', icon: 'icon.svg', badge: 'icon.svg',
    tag: payload.tag || 'piscinapro', data: payload.data || {},
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('./index.html');
  })());
});
