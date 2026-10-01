/* SW para la PWA VR: solo app-shell, el vídeo/splats/CDN siempre van a red */
const CACHE = "vr-splat-v1";
const APP_SHELL = [
  "./escenaVR.html",
  "./manifest-vr.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Navegaciones: network-first con fallback al shell (funciona offline/instalada)
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("./escenaVR.html"))
    );
    return;
  }

  // Solo cachea lo mismo-origen (shell + iconos). CDN, vídeo y .rad/.spz/.ply van directos a red.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      }))
    );
  }
});
