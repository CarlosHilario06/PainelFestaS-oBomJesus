/* Service worker: guarda o sistema no aparelho para funcionar sem internet */
var CACHE = 'festa-sbj-v1';
var ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icone.svg',
  './assets/css/style.css',
  './assets/js/db.js',
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
  ev.respondWith(
    caches.match(ev.request).then(function (resposta) {
      return resposta || fetch(ev.request).then(function (rede) {
        var copia = rede.clone();
        caches.open(CACHE).then(function (c) { c.put(ev.request, copia); });
        return rede;
      }).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});
