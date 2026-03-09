var CACHE_NAME = "delegacje-v1773075113";
var ASSETS = [
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./js/countries.js",
  "./js/nbp-api.js",
  "./js/utils.js",
  "./js/app.js",
  "./js/signature-data.js",
  "./js/pdf-fonts.js",
  "./js/pdf-generator.js",
  "./js/jspdf.umd.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (n) { return n !== CACHE_NAME; })
          .map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);

  // NBP API - network only (live rates)
  if (url.hostname === "api.nbp.pl") {
    e.respondWith(fetch(e.request));
    return;
  }

  // Everything else - cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return cached || fetch(e.request).then(function (response) {
        return caches.open(CACHE_NAME).then(function (cache) {
          cache.put(e.request, response.clone());
          return response;
        });
      });
    })
  );
});
