/* Service worker: guarda o sistema no aparelho para funcionar sem internet */
var CACHE = 'festa-sbj-v3';
var ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icone.svg',
  './assets/css/style.css',
  './assets/js/db.js',
  './assets/js/logo.js',
  './assets/js/impressora.js',
  './assets/js/cupom.js',
  './assets/js/produtos.js',
  './assets/js/caixa.js',
  './assets/js/vendas.js',
  './assets/js/ajustes.js',
  './assets/js/app.js'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(ARQUIVOS);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.map(function (n) {
      if (n !== CACHE) return caches.delete(n);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (ev) {
  if (ev.request.method !== 'GET') return;

  /* Rede primeiro, cache como reserva.
     Antes era o contrário, e quem já tinha aberto o sistema continuava
     vendo a versão velha mesmo depois de eu publicar correções — dava
     para achar que a novidade simplesmente não funcionava. */
  ev.respondWith(
    fetch(ev.request).then(function (rede) {
      if (rede && rede.status === 200 && rede.type === 'basic') {
        var copia = rede.clone();
        caches.open(CACHE).then(function (c) { c.put(ev.request, copia); });
      }
      return rede;
    }).catch(function () {
      /* sem internet: serve o que estiver guardado */
      return caches.match(ev.request).then(function (guardado) {
        return guardado || caches.match('./index.html');
      });
    })
  );
});
