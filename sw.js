const CACHE_NAME = 'moksa-cache-v1';
const assetsToCache = [
    './index.html',
    './style.css',
    './script.js',
    './supabase.js',
    './img/logo.png',
    './img/gambar-iklan-offline.gif'
    
];

// Install Service Worker dan simpan file ke cache lokal
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(assetsToCache);
        })
    );
});

// Ambil data dari cache jika perangkat offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});