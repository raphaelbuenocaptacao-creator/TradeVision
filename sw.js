const CACHE='tradevision-v17';
const APP_SHELL=['./','./index.html','./style.css','./password-login.css','./app.js','./premium.js','./install.js','./auth-fix.js','./admin.js','./manifest.json','./icon.svg'];
const PRIVATE_PATHS=['/auth/','/api/','/admin/'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

function isPrivateRequest(request,url){
  if(request.method!=='GET') return true;
  if(request.headers.has('authorization')) return true;
  if(url.origin!==self.location.origin) return true;
  return PRIVATE_PATHS.some(path=>url.pathname.includes(path));
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(isPrivateRequest(request,url)) return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request,{cache:'no-store'})
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>{
      const network=fetch(request).then(response=>{
        if(response && response.ok && response.type==='basic'){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(request,copy));
        }
        return response;
      }).catch(()=>cached);
      return cached || network;
    })
  );
});