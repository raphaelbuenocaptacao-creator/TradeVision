(() => {
  let mounted = false;
  const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function statusLabel(row){
    if(row.status==='lifetime') return 'Vitalício';
    if(row.status==='active') return 'Ativo';
    if(row.status==='trialing') return `Teste${row.access?.trial_days_remaining!=null ? ` • ${row.access.trial_days_remaining}d` : ''}`;
    return 'Inativo';
  }

  async function loadUsers(){
    const body=document.getElementById('adminUsers');
    if(!body) return;
    body.innerHTML='<div class="admin-loading">Carregando usuários...</div>';
    try{
      const rows=await request(`/admin/projects/${PROJECT}/users`);
      body.innerHTML=rows.map(row=>`<article class="admin-user" data-id="${esc(row.id)}">
        <div><b>${esc(row.email)}</b><small>${row.is_superadmin?'Super Admin':'Usuário'} • ${esc(row.role||'member')}</small></div>
        <div class="admin-status"><span>${esc(statusLabel(row))}</span></div>
        <div class="admin-actions">
          <button data-action="reset">Código de recuperação</button>
          <button data-action="trial">7 dias</button>
          <button data-action="lifetime">Vitalício</button>
          <button data-action="inactive" class="danger-outline">Bloquear</button>
        </div>
      </article>`).join('') || '<p class="muted">Nenhum usuário.</p>';
    }catch(e){ body.innerHTML='<p class="negative">Não foi possível carregar os usuários.</p>'; }
  }

  async function act(button){
    const card=button.closest('.admin-user');
    const userId=card?.dataset.id;
    if(!userId) return;
    const action=button.dataset.action;
    button.disabled=true;
    try{
      if(action==='reset'){
        const data=await request(`/admin/users/${encodeURIComponent(userId)}/reset-code`,{method:'POST',body:'{}'});
        await navigator.clipboard?.writeText(data.code).catch(()=>{});
        alert(`Código de recuperação para ${data.email}: ${data.code}\n\nVálido por até ${data.expires_in_minutes} minutos. O código também foi copiado.`);
      }else{
        const status=action==='trial'?'trialing':action==='lifetime'?'lifetime':'inactive';
        const currentRole=card.querySelector('small')?.textContent?.includes('owner')?'owner':'member';
        await request(`/admin/projects/${PROJECT}/users/${encodeURIComponent(userId)}/access`,{method:'PUT',body:JSON.stringify({status,role:currentRole})});
        await loadUsers();
      }
    }catch(e){ alert('Não foi possível concluir esta ação.'); }
    finally{button.disabled=false;}
  }

  function mount(){
    if(mounted || !account?.user?.is_superadmin) return;
    mounted=true;
    const nav=document.querySelector('nav');
    const main=document.querySelector('main');
    if(!nav||!main) return;
    const btn=document.createElement('button');
    btn.className='nav admin-nav'; btn.dataset.view='admin'; btn.textContent='CEO';
    nav.appendChild(btn);
    const section=document.createElement('section');
    section.id='admin'; section.className='view';
    section.innerHTML=`<div class="topline"><div><span class="eyebrow">ADMINISTRAÇÃO</span><h1>Painel CEO</h1></div><button id="refreshAdmin">ATUALIZAR</button></div>
      <div class="panel"><div class="panel-title"><b>Usuários e acessos</b><span>TradeVision</span></div><div id="adminUsers" class="admin-users"></div></div>`;
    main.appendChild(section);
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.nav,.view').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active'); section.classList.add('active'); loadUsers();
    });
    section.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)act(b);});
    section.querySelector('#refreshAdmin').onclick=loadUsers;
  }

  const originalRenderAccount=window.renderAccount;
  if(typeof originalRenderAccount==='function') window.renderAccount=function(){originalRenderAccount();mount();};
  setTimeout(mount,300);
})();