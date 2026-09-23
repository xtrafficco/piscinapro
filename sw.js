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

const VERSAO = 'piscinapro-v11';

const CASCO = [
  './',
  './index.html',
  './css/app.css',
  './js/vendor/supabase.min.js',
  './js/core.js',
  './js/jornal.js',
  './js/seed.js',
  './js/auth.js',
  './js/whats.js',
  './js/vendas.js',
  './js/orcamentos.js',
  './js/erp.js',
  './js/agenda.js',
  './js/servicos.js',
  './js/pdv.js',
  './js/nuvem.js',
  './js/dados.js',
  './js/saas.js',
  './js/financeiro.js',
  './js/relatorios.js',
  './js/main.js',
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

  /* Fontes do Google: tenta a rede, guarda o que vier, cai no cache se faltar. */
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    ev.respondWith(
      fetch(req).then(res => {
        const copia = res.clone();
        caches.open(VERSAO).then(c => c.put(req, copia));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  /* chamadas à nuvem nunca passam pelo cache */
  if (url.hostname.endsWith('supabase.co')) return;

  if (url.origin !== self.location.origin) return;

  /* Casco do app: REDE PRIMEIRO, cache como rede de segurança.
     Cache primeiro seria mais rápido, mas num ERP servir um .js velho significa
     cálculo errado em silêncio — e, em desenvolvimento, editar um arquivo e não
     ver a mudança. A diferença de velocidade aqui é desprezível; a de correção,
     não. Offline continua funcionando: se a rede falha, responde do cache. */
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
