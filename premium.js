(() => {
 const $p=id=>document.getElementById(id), brl=n=>(Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 function injectMobileUX(){
  if(document.getElementById('tv-mobile-ux'))return;
  const style=document.createElement('style');style.id='tv-mobile-ux';style.textContent=`
  @media(max-width:720px){
    body{padding-bottom:78px}
    nav{position:fixed!important;left:0;right:0;bottom:0;top:auto!important;height:70px;padding:6px 4px calc(6px + env(safe-area-inset-bottom));display:flex;align-items:stretch;justify-content:space-around;gap:0;background:#0e171ff5;border-top:1px solid var(--line);border-bottom:0;box-shadow:0 -10px 28px #0007;z-index:30;overflow:visible}
    .nav{flex:1 1 0;min-width:0;padding:8px 3px!important;border:0!important;border-radius:9px;color:var(--muted);font-size:10px;line-height:1.15;white-space:normal;overflow:hidden;text-overflow:ellipsis;text-align:center;display:flex;align-items:center;justify-content:center}
    .nav.active{background:#102b37;color:#9be9ff;box-shadow:inset 0 0 0 1px #23566b}
    header{position:sticky;top:0}
    main{padding:12px 12px 18px}
    .topline{margin-bottom:12px}
    .topline h1{font-size:20px}
    .cards,.premium-cards{gap:8px;margin-bottom:8px}
    .cards article,.premium-cards article{min-height:112px!important;padding:12px!important;border-radius:9px}
    .cards strong,.premium-cards strong{font-size:20px!important;margin:6px 0!important}
    .cards span,.premium-cards span{font-size:12px}
    .cards small,.premium-cards small{font-size:11px;line-height:1.25}
    .scorebar{margin-top:8px}
    .grid2{margin:8px 0;gap:8px}
    .panel{padding:12px}
  }
  @media(max-width:380px){.nav{font-size:9px}.cards article,.premium-cards article{min-height:106px!important;padding:10px!important}.cards strong,.premium-cards strong{font-size:19px!important}}
  `;document.head.appendChild(style);
  document.querySelectorAll('.nav').forEach(btn=>{if(btn.dataset.view==='settings')btn.textContent='Risco';});
 }
 function calc(){if(typeof ops==='undefined'||typeof settings==='undefined')return;const ordered=[...ops].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));const wins=ordered.filter(o=>o.result>0),losses=ordered.filter(o=>o.result<0);const total=ordered.reduce((s,o)=>s+o.result,0);const avgW=wins.length?wins.reduce((s,o)=>s+o.result,0)/wins.length:0,avgL=losses.length?Math.abs(losses.reduce((s,o)=>s+o.result,0)/losses.length):0;
 const days={};ordered.forEach(o=>days[o.date]=(days[o.date]||0)+o.result);const dv=Object.values(days),pos=dv.filter(v=>v>0).length,neg=dv.filter(v=>v<0).length,pct=dv.length?pos/dv.length*100:0;
 let cur=0,curType='',bestW=0,bestL=0,w=0,l=0;ordered.forEach(o=>{if(o.result>0){w++;l=0;bestW=Math.max(bestW,w)}else if(o.result<0){l++;w=0;bestL=Math.max(bestL,l)}});for(let i=ordered.length-1;i>=0;i--){const t=ordered[i].result>0?'W':ordered[i].result<0?'L':'N';if(t==='N')continue;if(!curType)curType=t;if(t!==curType)break;cur++}
 let violations=0;Object.values(days).forEach(v=>{if(v<=-Math.max(1,settings.dailyStop))violations++});ordered.forEach(o=>{if(o.stop>0&&o.result<0&&Math.abs(o.result)>o.stop*1.15)violations++});const score=ordered.length?Math.max(0,Math.round(100-(violations/Math.max(1,ordered.length))*100)):100;
 const step=Math.max(1,settings.step),progress=((total%step)+step)%step,remaining=total<0?step:progress===0&&total>0?step:step-progress;
 if($p('disciplineScore')){$p('disciplineScore').textContent=score;$p('disciplineLabel').textContent=!ordered.length?'Comece registrando suas operações':score>=90?'Excelente aderência ao plano':score>=75?'Boa disciplina — há pontos de atenção':'Revise sua gestão de risco';$p('disciplineBar').style.width=score+'%'}
 if($p('currentStreak')){$p('currentStreak').textContent=cur?`${cur} ${curType==='W'?'W':'L'}`:'—';$p('currentStreak').className=curType==='W'?'positive':curType==='L'?'negative':'';$p('bestStreak').textContent=`Melhor: ${bestW} W • Maior perda: ${bestL} L`}
 if($p('positiveDays')){$p('positiveDays').textContent=pct.toFixed(0)+'%';$p('dayBalance').textContent=`${pos} positivos / ${neg} negativos`}
 if($p('nextContract')){$p('nextContract').textContent=brl(remaining);$p('progressCapital').textContent=`Faltam para o próximo nível • acumulado ${brl(total)}`}
 if($p('avgWin'))$p('avgWin').textContent=brl(avgW);if($p('avgLoss'))$p('avgLoss').textContent=brl(avgL);if($p('chartEmpty'))$p('chartEmpty').classList.toggle('hidden',ordered.length>0);if($p('equityChart'))$p('equityChart').classList.toggle('hidden',ordered.length===0);
 }
 injectMobileUX();
 const original=window.render;if(typeof original==='function')window.render=function(){original();calc();injectMobileUX()};document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{calc();injectMobileUX()},50));setTimeout(()=>{calc();injectMobileUX()},250);
})();