const CACHE_NAME = 'wealth-engine-v2.1';
const ASSETS = [
    'index.html',
    'styles.css',
    'script.js',
    'library.js',
    'manifest.json',
    'wealth_engine_app_icon_1776833462378.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
