// ── Version : à incrémenter à chaque mise à jour du site ──
const VERSION = '2';
const CACHE_NAME = 'eps-pasteur-v' + VERSION;
const ASSETS = [
  './index.html',
  './manifest.json'
];

// Installation : mise en cache + activation immédiate
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // Force le nouveau SW à prendre la main immédiatement sans attendre la fermeture
  self.skipWaiting();
});

// Activation : supprime TOUS les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Suppression ancien cache:', k);
          return caches.delete(k);
        })
      )
    )
  );
  // Prend le contrôle de tous les onglets ouverts immédiatement
  self.clients.claim();
});

// Fetch : réseau en priorité, cache en fallback
// → garantit toujours la version la plus récente si internet disponible
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes vers d'autres domaines (vos autres sites)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Met à jour le cache avec la réponse fraîche
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Pas de réseau → fallback sur le cache
        return caches.match(event.request)
          .then(cached => cached || caches.match('./index.html'));
      })
  );
});

// Message depuis la page : forcer la mise à jour
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
