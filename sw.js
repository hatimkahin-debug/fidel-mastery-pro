// sw.js — enables real offline use once this project is hosted on an
// https:// origin (service workers can't register from a local file or
// from a sandboxed preview, so this simply has no effect there).
const CACHE = 'fidel-mastery-pro-v1';
const SHELL = ['./', './index.html', './app.js', './data.js', './manifest.webmanifest'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE).then(function(cache){ return cache.addAll(SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

// Cache-first for the app shell and any audio recordings you add under
// audio/letters/ and audio/words/ — once fetched once, they're available
// offline from then on. Everything else (e.g. the Google TTS calls) goes
// straight to the network, since that's inherently online-only anyway.
self.addEventListener('fetch', function(event){
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  if (!isLocal) return; // let TTS/network-only requests pass through untouched

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if (cached) return cached;
      return fetch(event.request).then(function(resp){
        if (resp && resp.status === 200){
          const copy = resp.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return resp;
      }).catch(function(){
        // offline and not cached — audio files simply won't play until
        // they've been fetched at least once while online
        return new Response('', { status: 404 });
      });
    })
  );
});
