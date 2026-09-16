/* ============================================================
   PiscinaPro — Service Worker (PWA instalável + offline)
   - arquivos do próprio site: network-first (sempre a versão nova
     online; cache só como reserva offline)
   - fontes do Google: cache-first
   - API do Supabase: nunca passa pelo cache
   ============================================================ */
const VERSAO = 'piscinapro-v5';
const SHELL = `${VERSAO}-shell`;
const RUNTIME = `${VERSAO}-runtime`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './portal.html',
  './styles.css',
  './styles-v2.css',
  './manifest.json',
  './icon.svg',
  './vendor/supabase.umd.js',
  './src/tema-inicial.js',
  './src/main.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL).then(c => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const ehFonte = url => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname.endsWith('.supabase.co')) return;           // dados: sempre rede
  if (url.pathname.startsWith('/_vercel/')) return;             // analytics

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match(req)) || caches.match(url.pathname.endsWith('portal.html') ? './portal.html' : './index.html'))
    );
    return;
  }

  if (ehFonte(url)) {
    event.respondWith(
      caches.open(RUNTIME).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(SHELL).then(async cache => {
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return (await cache.match(req)) || Response.error();
        }
      })
    );
  }
});

/* Web Push (lembretes de follow-up enviados pela Edge Function send-reminders) */
self.addEventListener('push', event => {
  let dados;
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { title: 'PiscinaPro', body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(self.registration.showNotification(dados.title || 'PiscinaPro', {
    body: dados.body || '', icon: 'icon.svg', badge: 'icon.svg',
    tag: dados.tag || 'piscinapro', data: dados.data || {},
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const leadId = event.notification.data?.leadId || null;
  event.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of janelas) {
      if ('focus' in c) {
        if (leadId) c.postMessage({ tipo: 'abrir-lead', leadId });
        return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow('./index.html#/funil');
  })());
});
