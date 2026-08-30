const CACHE='tradevision-v20-safe-shell';
const APP_SHELL=['./','./index.html','./style.css','./password-login.css','./app.js','./premium.js','./install.js','./auth-fix.js','./admin.js','./manifest.webmanifest','./icon-192.svg','./icon-512.svg','./icon-512-maskable.svg'];
const PRIVATE_PATHS=['/auth/','/api/','/admin/','/login','/logout','/session','/sessions','/token','/tokens','/account','/profile','/me'];
const SENSITIVE_QUERY_KEYS=['token','access_token','refresh_token','password','passwd','secret','session','auth','authorization','api_key','apikey','key','code','credential','credentials'];

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

function isShellRequest(url){
  if(url.search) return false;
  const relative='./'+url.pathname.split('/').pop();
  return APP_SHELL.includes(relative)||APP_SHELL.includes('./'+url.pathname.replace(/^\//,''));
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(isPrivateRequest(request,url)) return;

  if(request.mode==='navigate'){
    event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>caches.match('./index.html')));
    return;
  }

  if(!isShellRequest(url)) return;

  event.respondWith(
    caches.match(request).then(cached=>cached||fetch(request,{cache:'no-cache'}).then(response=>{
      if(response&&response.ok&&response.type==='basic'){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
      }
      return response;
    }))
  );
});