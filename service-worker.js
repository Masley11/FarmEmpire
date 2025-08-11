
const CACHE_NAME = 'ferme-industrielle-v1.0.0';
const STATIC_CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/main.js',
  './assets/js/game.js',
  './assets/js/ui.js',
  './assets/js/crops.js',
  './assets/js/livestock.js',
  './assets/js/machines.js',
  './assets/js/market.js',
  './assets/js/finance.js',
  './assets/js/production.js',
  './assets/js/weather.js',
  './assets/js/save.js',
  './assets/data/crops.js',
  './assets/data/livestock.js',
  './assets/data/machines.js',
  './assets/data/market.js'
];

// Installation du service worker
self.addEventListener('install', event => {
  console.log('[SW] Installation...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Mise en cache des fichiers essentiels');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation terminée');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Erreur lors de l\'installation:', error);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', event => {
  console.log('[SW] Activation...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation terminée');
        return self.clients.claim();
      })
  );
});

// Gestion des requêtes
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes externes
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Retourner la version en cache si elle existe
        if (cachedResponse) {
          console.log('[SW] Fichier servi depuis le cache:', event.request.url);
          return cachedResponse;
        }

        // Sinon, récupérer depuis le réseau
        return fetch(event.request)
          .then(response => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cloner la réponse car elle ne peut être lue qu'une fois
            const responseToCache = response.clone();

            // Mettre en cache pour les futures requêtes
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('[SW] Fichier mis en cache:', event.request.url);
              });

            return response;
          })
          .catch(error => {
            console.error('[SW] Erreur réseau:', error);
            
            // Retourner une page hors ligne pour les documents HTML
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            throw error;
          });
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CACHE_SAVE_DATA') {
    // Mettre en cache les données de sauvegarde
    const saveData = event.data.payload;
    caches.open(CACHE_NAME + '-saves')
      .then(cache => {
        cache.put('./save-data.json', new Response(JSON.stringify(saveData)));
      });
  }
});

// Synchronisation en arrière-plan (pour les sauvegardes)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-save') {
    event.waitUntil(
      // Synchroniser les données de sauvegarde lorsque la connexion est rétablie
      syncSaveData()
    );
  }
});

// Fonction pour synchroniser les données de sauvegarde
async function syncSaveData() {
  try {
    const cache = await caches.open(CACHE_NAME + '-saves');
    const cachedSave = await cache.match('./save-data.json');
    
    if (cachedSave) {
      const saveData = await cachedSave.json();
      console.log('[SW] Synchronisation des données de sauvegarde:', saveData);
      // Ici vous pourriez envoyer les données vers un serveur
    }
  } catch (error) {
    console.error('[SW] Erreur lors de la synchronisation:', error);
  }
}

// Notification de mise à jour disponible
self.addEventListener('updatefound', () => {
  console.log('[SW] Nouvelle version disponible');
  
  // Notifier le client qu'une mise à jour est disponible
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        message: 'Une nouvelle version du jeu est disponible!'
      });
    });
  });
});
