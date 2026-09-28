/* ==========================================================================
   PiscinaPro — service worker

   Os DADOS vivem no Postgres, então sem rede não há sistema — este service
   worker não muda isso. O que ele faz é guardar o casco do app (HTML, CSS,
   JS) para a abertura ser instantânea e o PWA continuar instalável.

   Estratégia: rede primeiro para o casco, com o cache como rede de
   segurança. Num ERP, código velho servido do cache já custou caro aqui.
   Ao mudar arquivos, suba a VERSAO — o cache velho é apagado na ativação.
   ========================================================================== */
'use strict';

const VERSAO = 'piscinapro-v12';

const CASCO = [
  './',
  './index.html',
  './css/app.7ead8e1b.css',
  './css/fontes.e11546cf.css',
  './css/fonts/manrope-400-normal-latin.a30ddcd3.woff2',
  './css/fonts/manrope-400-normal-latin-ext.3911b66d.woff2',
  './css/fonts/fraunces-400-normal-latin.7234ed86.woff2',
  './css/fonts/fraunces-400-normal-latin-ext.a2930b27.woff2',
  /* só a BASE (todos os papéis). Os módulos de operação são lazy (por papel) e
     entram no cache sob demanda pela regra cache-first dos assets hasheados. */
  './js/vendor/supabase.min.fbde52aa.js',
  './js/core.14bf2bea.js',
  './js/jornal.858ffa4b.js',
  './js/nuvem.e14cde99.js',
  './js/auth.23932763.js',
  './js/saas.b36ea393.js',
  './js/dados.a1ac3007.js',
  './js/main.cc4d5fdf.js',
  './icone.svg',
  './manifest.webmanifest'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(VERSAO)
      /* um arquivo que falhe não pode derrubar a instalação inteira */
      .then(c => Promise.allSettled(CASCO.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Na Vercel o Supabase passa por /sb/ no mesmo dominio. Essas respostas
     podem conter dados da empresa e nunca entram no cache do app. */
  if (url.origin === self.location.origin && url.pathname.startsWith('/sb/')) return;

  /* chamadas à nuvem nunca passam pelo cache */
  if (url.hostname.endsWith('supabase.co')) return;

  if (url.origin !== self.location.origin) return;

  /* Assets com content-hash no nome (….a1b2c3d4.js/.css/.woff2) são IMUTÁVEIS:
     mudou o conteúdo, mudou o nome. Aí CACHE PRIMEIRO é seguro e rápido — nunca
     serve algo "velho", porque um deploy novo pede nomes novos. Em produção o
     preparar-publicacao.js gera esses nomes; em desenvolvimento os arquivos não
     têm hash e caem na regra de baixo (rede primeiro), preservando o F5. */
  if (/\.[0-9a-f]{8}\.(?:js|css|woff2)$/.test(url.pathname)) {
    ev.respondWith(
      caches.match(req).then(cacheado => cacheado || fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copia = res.clone();
          caches.open(VERSAO).then(c => c.put(req, copia));
        }
        return res;
      }))
    );
    return;
  }

  /* Resto do casco (index.html, sw, ícones): REDE PRIMEIRO, cache como rede de
     segurança. O index.html é quem aponta para os hashes, então tem de vir
     sempre fresco. Servir um index velho manteria hashes antigos — e, em
     desenvolvimento, editar um arquivo e não ver a mudança. Offline segue: se a
     rede falha, responde do cache. */
  ev.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copia = res.clone();
          caches.open(VERSAO).then(c => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then(cacheado =>
        cacheado || caches.match('./index.html')))
  );
});

/* Permite que a página peça a troca imediata depois de um deploy. */
self.addEventListener('message', ev => {
  if (ev.data === 'atualizar') self.skipWaiting();
});
