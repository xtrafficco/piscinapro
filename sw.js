/* ============================================================
   PiscinaPro — Service Worker (PWA instalável + offline)
   - App shell: stale-while-revalidate (rápido e atualiza sozinho)
   - Navegação: network-first com fallback ao index em cache
   - CDN (esm.sh / Google Fonts): cache-first em runtime (permite
     abrir o app offline com a lib do Supabase já baixada)
   - API do Supabase: SEMPRE rede (nunca cacheia dados dinâmicos)
   ============================================================ */
const VERSION = 'piscinapro-v1';
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

  // Assets do próprio app (mesma origem): stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(SHELL).then(async cache => {
        const hit = await cache.match(req);
        const fetching = fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || fetching;
      })
    );
  }
});
