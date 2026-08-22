(() => {
  const button = document.getElementById('loginBtn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const message = document.getElementById('loginMsg');
  if (!button || !emailInput || !passwordInput || !message) return;

  const oldFirstAccess = document.getElementById('firstAccessBtn');
  if (oldFirstAccess) oldFirstAccess.remove();

  let forgotBtn = document.getElementById('forgotPasswordBtn');
  if (!forgotBtn) {
    forgotBtn = document.createElement('button');
    forgotBtn.id = 'forgotPasswordBtn';
    forgotBtn.type = 'button';
    forgotBtn.className = 'recovery-link';
    forgotBtn.textContent = 'ESQUECI MINHA SENHA';
    button.insertAdjacentElement('afterend', forgotBtn);
  }

  let recoveryBox = document.getElementById('recoveryBox');
  if (!recoveryBox) {
    recoveryBox = document.createElement('div');
    recoveryBox.id = 'recoveryBox';
    recoveryBox.className = 'recovery-box hidden';
    recoveryBox.innerHTML = `
      <h3>Recuperar acesso</h3>
      <p id="recoveryHelp">Enviaremos um código de segurança para o e-mail informado acima.</p>
      <button id="recoverySend" type="button">ENVIAR CÓDIGO POR E-MAIL</button>
      <div id="recoveryFields" class="hidden">
        <input id="recoveryCode" inputmode="numeric" maxlength="8" placeholder="Código de 8 dígitos">
        <input id="recoveryNewPassword" type="password" autocomplete="new-password" placeholder="Nova senha (mín. 10 caracteres)">
        <input id="recoveryConfirmPassword" type="password" autocomplete="new-password" placeholder="Confirmar nova senha">
        <button id="recoverySave" type="button">REDEFINIR SENHA</button>
      </div>
      <button id="recoveryCancel" type="button" class="secondary-action">CANCELAR</button>
      <div id="recoveryMsg" class="msg" aria-live="polite"></div>`;
    forgotBtn.insertAdjacentElement('afterend', recoveryBox);
  }

  function authMessage(error) {
    if (error?.code === 'NETWORK_ERROR') return 'Sem conexão com a Aureon Base. Verifique sua internet.';
    if (error?.status === 403) return 'Este e-mail ainda não está autorizado para o TradeVision.';
    if (error?.status === 429) return 'Muitas tentativas. Aguarde alguns minutos.';
    if (error?.status === 402) return 'Seu período de acesso está inativo.';
    if (error?.status === 401) return 'E-mail ou senha incorretos.';
    if (error?.status >= 500) return 'A Aureon Base está atualizando. Tente novamente em instantes.';
    return 'Não foi possível entrar agora.';
  }

  async function enter() {
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    if (!email || password.length < 10) {
      message.textContent = 'Informe seu e-mail e uma senha com pelo menos 10 caracteres.';
      return;
    }
    button.disabled = true;
    forgotBtn.disabled = true;
    button.textContent = 'CONECTANDO...';
    message.textContent = 'Validando acesso...';
    try {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
      persistTokens(data);
      await loadCloud();
      showApp();
      message.textContent = '';
    } catch (error) {
      clearTokens();
      message.textContent = authMessage(error);
    } finally {
      button.disabled = false;
      forgotBtn.disabled = false;
      button.textContent = 'ENTRAR';
    }
  }

  forgotBtn.onclick = () => {
    recoveryBox.classList.toggle('hidden');
    document.getElementById('recoveryMsg').textContent = '';
  };
  document.getElementById('recoveryCancel').onclick = () => recoveryBox.classList.add('hidden');
  document.getElementById('recoverySend').onclick = async () => {
    const email = emailInput.value.trim().toLowerCase();
    const send = document.getElementById('recoverySend');
    const msg = document.getElementById('recoveryMsg');
    if (!email) { msg.textContent = 'Informe seu e-mail acima primeiro.'; return; }
    send.disabled = true;
    send.textContent = 'ENVIANDO...';
    msg.textContent = '';
    try {
      await request('/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) }, false);
      document.getElementById('recoveryFields').classList.remove('hidden');
      msg.textContent = 'Código enviado. Verifique sua caixa de entrada e também o spam.';
    } catch (error) {
      if (error?.status === 503) msg.textContent = 'Envio automático temporariamente indisponível. O CEO ainda pode gerar um código pelo painel administrativo.';
      else if (error?.status === 429) msg.textContent = 'Muitas solicitações. Aguarde alguns minutos.';
      else msg.textContent = 'Não foi possível enviar o código agora.';
    } finally {
      send.disabled = false;
      send.textContent = 'REENVIAR CÓDIGO';
    }
  };
  document.getElementById('recoverySave').onclick = async () => {
    const email = emailInput.value.trim().toLowerCase();
    const code = document.getElementById('recoveryCode').value.replace(/\D/g, '');
    const newPassword = document.getElementById('recoveryNewPassword').value;
    const confirmPassword = document.getElementById('recoveryConfirmPassword').value;
    const msg = document.getElementById('recoveryMsg');
    if (!email) { msg.textContent = 'Informe o e-mail da conta acima.'; return; }
    if (code.length !== 8) { msg.textContent = 'Informe o código de 8 dígitos enviado para seu e-mail.'; return; }
    if (newPassword.length < 10) { msg.textContent = 'A nova senha precisa ter pelo menos 10 caracteres.'; return; }
    if (newPassword !== confirmPassword) { msg.textContent = 'As senhas não conferem.'; return; }
    const save = document.getElementById('recoverySave');
    save.disabled = true;
    msg.textContent = 'Redefinindo senha...';
    try {
      await request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, new_password: newPassword }) }, false);
      passwordInput.value = '';
      recoveryBox.classList.add('hidden');
      message.textContent = 'Senha redefinida. Entre com sua nova senha.';
    } catch (error) {
      msg.textContent = error?.status === 401 ? 'Código inválido ou expirado.' : error?.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.' : 'Não foi possível redefinir a senha.';
    } finally { save.disabled = false; }
  };

  button.onclick = enter;
  passwordInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    enter();
  }, true);
})();