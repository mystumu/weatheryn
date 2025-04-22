const CACHE_NAME = 'weatheryn-v1';
const WEATHER_CACHE_NAME = 'weather-cache-v1';
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/main.js',
  '/src/styles.css',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  'https://fonts.googleapis.com/css2?family=Lato&display=swap',
  'https://fonts.googleapis.com/css2?family=Open+Sans&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_RESOURCES)),
      caches.open(WEATHER_CACHE_NAME)
    ])
  );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, WEATHER_CACHE_NAME].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Función para cachear respuesta con tiempo de expiración
async function cacheWithExpiry(request, response) {
  const now = new Date();
  const expiry = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos

  const data = {
    response: response.clone(),
    expiry: expiry.getTime()
  };

  const cache = await caches.open(WEATHER_CACHE_NAME);
  const headers = new Headers(response.headers);
  headers.append('sw-fetched-on', now.toISOString());
  headers.append('sw-expires', expiry.toISOString());

  const modifiedResponse = new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });

  await cache.put(request, modifiedResponse);
  return response;
}

// Función para verificar si la respuesta cacheada expiró
function hasExpired(response) {
  if (!response) return true;
  const expiryHeader = response.headers.get('sw-expires');
  if (!expiryHeader) return true;
  return new Date(expiryHeader).getTime() < new Date().getTime();
}

// Estrategia de cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Manejo especial para peticiones de la API del clima
  if (url.hostname === 'api.openweathermap.org') {
    event.respondWith(
      fetch(event.request)
        .then((response) => cacheWithExpiry(event.request, response))
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse && !hasExpired(cachedResponse)) {
            return cachedResponse;
          }
          throw new Error('No weather data available');
        })
    );
    return;
  }

  // Para el resto de peticiones, usamos "Network First" con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Si es una petición HTML, devolvemos la página offline
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }

        // Para otros recursos, mostramos error
        return new Response('Sin conexión', {
          status: 503,
          statusText: 'Sin conexión a Internet'
        });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-weather') {
    event.waitUntil(syncWeatherData());
  }
});

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message,
    icon: 'icons/android/android-launchericon-192-192.png',
    badge: 'icons/ios/76.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: 'icons/android/android-launchericon-72-72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('WeatheRyn', options)
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Manejo de mensajes
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
}); 