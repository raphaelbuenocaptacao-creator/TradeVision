(()=>{
  const head=document.head;
  const existingManifest=head.querySelector('link[rel="manifest"]');
  if(existingManifest) existingManifest.href='./manifest.webmanifest';
  else {
    const link=document.createElement('link');
    link.rel='manifest';
    link.href='./manifest.webmanifest';
    head.appendChild(link);
  }

  const secureContext=location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';
  if('serviceWorker' in navigator&&secureContext){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>reg.update()).catch(err=>console.warn('PWA service worker não registrado:',err));
    });
  }

  let promptEvent=null;
  const btn=document.getElementById('installApp');
  if(!btn)return;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  function sync(){btn.classList.toggle('hidden',standalone());}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;btn.classList.remove('hidden')});
  window.addEventListener('appinstalled',()=>{promptEvent=null;btn.classList.add('hidden')});
  btn.addEventListener('click',async()=>{
    if(standalone()){btn.classList.add('hidden');return}
    if(promptEvent){promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;sync();return}
    alert('Para instalar: abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.');
  });
  sync();
})();