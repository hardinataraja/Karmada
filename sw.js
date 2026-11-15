// Naikkan versi setiap rilis agar cache lama dibuang.
const CACHE='karmada-static-v6';
const CORE=['./','./index.html','./css/styles.css','./js/app.js','./js/catalog.js','./js/firebase-config.js','./manifest.webmanifest','./assets/icons/icon.svg','./assets/icons/car-placeholder.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
// Network-first: selalu ambil versi terbaru, cache hanya sebagai cadangan offline.
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  e.respondWith(fetch(req).then(res=>{
    if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
    return res;
  }).catch(()=>caches.match(req).then(hit=>hit||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
