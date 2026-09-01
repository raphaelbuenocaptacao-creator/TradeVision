const CACHE='tradevision-v21-safe-shell';
const APP_SHELL=['./','./index.html','./style.css','./password-login.css','./app.js','./premium.js','./install.js','./auth-fix.js','./admin.js','./manifest.webmanifest','./icon-192.svg','./icon-512.svg','./icon-512-maskable.svg'];
const PRIVATE_PATHS=['/auth/','/api/','/admin/','/login','/logout','/session','/sessions','/token','/tokens','/account','/profile','/me'];
const SENSITIVE_QUERY_KEYS=['token','access_token','refresh_token','password','passwd','secret','session','auth','authorization','api_key','apikey','key','code','credential','credentials'];

function hasSensitiveQuery(url){
  for(const key of url.searchParams.keys()){
    if(SENSITIVE_QUERY_KEYS.includes(String(key).toLowerCase())) return true;
  }
  return false;
}

function isPrivateRequest(request,url){
  if(request.method!=='GET') return true;
  if(request.headers.has('authorization')||request.headers.has('cookie')) return true;
  if(url.origin!==self.location.origin) return true;
  if(hasSensitiveQuery(url)) return true;
  const path=url.pathname.toLowerCase();
  return PRIVATE_PATHS.some(part=>path.includes(part));
}

function isSafeResponse(response){
  if(!response||!response.ok||response.type!=='basic') return false;
  const cacheControl=(response.headers.get('cache-control')||'').toLowerCase();
  if(cacheControl.includes('private')||cacheControl.includes('no-store')) return false;
  if(response.headers.has('set-cookie')) return false;
  return true;
}

function isShellRequest(url){
  if(url.search) return false;
  const relative='./'+url.pathname.split('/').pop();
  return APP_SHELL.includes(relative)||APP_SHELL.includes('./'+url.pathname.replace(/^\//,''));
}

async function precacheShell(){
  const cache=await caches.open(CACHE);
  await Promise.all(APP_SHELL.map(async asset=>{
    try{
      const request=new Request(asset,{credentials:'omit',cache:'reload'});
      const response=await fetch(request);
      if(isSafeResponse(response)) await cache.put(request,response.clone());
    }catch(error){
      console.warn('[TradeVision PWA] precache skipped:',asset,error);
    }
  }));
}

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(precacheShell());
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(isPrivateRequest(request,url)) return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request,{cache:'no-store'}).catch(async()=>{
        const cached=await caches.match('./index.html');
        return cached||Response.error();
      })
    );
    return;
  }

  if(!isShellRequest(url)) return;

  event.respondWith(
    caches.match(request).then(cached=>cached||fetch(request,{cache:'no-cache',credentials:'omit'}).then(async response=>{
      if(isSafeResponse(response)){
        const copy=response.clone();
        const cache=await caches.open(CACHE);
        await cache.put(request,copy);
      }
      return response;
    }))
  );
});