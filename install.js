(()=>{
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('PWA service worker não registrado:',err));
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