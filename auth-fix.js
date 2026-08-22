(() => {
  const button = document.getElementById('loginBtn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const message = document.getElementById('loginMsg');
  if (!button || !emailInput || !passwordInput || !message) return;

  let firstAccessBtn = document.getElementById('firstAccessBtn');
  if (!firstAccessBtn) {
    firstAccessBtn = document.createElement('button');
    firstAccessBtn.id = 'firstAccessBtn';
    firstAccessBtn.type = 'button';
    firstAccessBtn.className = 'login-link';
    firstAccessBtn.textContent = 'PRIMEIRO ACESSO';
    button.insertAdjacentElement('afterend', firstAccessBtn);
  }

  function authMessage(error) {
    if (error?.code === 'NETWORK_ERROR') return 'Sem conexão com a Aureon Base. Verifique sua internet.';
    if (error?.status === 409) return 'Este e-mail já possui conta. Use ENTRAR.';
    if (error?.status === 403) return 'Este e-mail ainda não está autorizado para o TradeVision.';
    if (error?.status === 429) return 'Muitas tentativas. Aguarde alguns minutos.';
    if (error?.status === 402) return 'Seu período de acesso está inativo.';
    if (error?.status === 401) return 'E-mail ou senha incorretos.';
    if (error?.status >= 500) return 'A Aureon Base está atualizando. Tente novamente em instantes.';
    return 'Não foi possível concluir agora.';
  }

  function credentials() {
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    if (!email || password.length < 10) {
      message.textContent = 'Informe seu e-mail e uma senha com pelo menos 10 caracteres.';
      return null;
    }
    return { email, password };
  }

  async function finishAuth(data) {
    persistTokens(data);
    await loadCloud();
    showApp();
    message.textContent = '';
  }

  async function enter() {
    const creds = credentials();
    if (!creds) return;
    button.disabled = true;
    firstAccessBtn.disabled = true;
    button.textContent = 'CONECTANDO...';
    message.textContent = 'Validando acesso...';
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(creds),
      }, false);
      await finishAuth(data);
    } catch (error) {
      clearTokens();
      message.textContent = authMessage(error);
    } finally {
      button.disabled = false;
      firstAccessBtn.disabled = false;
      button.textContent = 'ENTRAR';
    }
  }

  async function firstAccess() {
    const creds = credentials();
    if (!creds) return;
    firstAccessBtn.disabled = true;
    button.disabled = true;
    firstAccessBtn.textContent = 'CRIANDO ACESSO...';
    message.textContent = 'Criando sua conta com segurança...';
    try {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...creds, project_slug: PROJECT }),
      }, false);
      await finishAuth(data);
    } catch (error) {
      clearTokens();
      message.textContent = authMessage(error);
    } finally {
      firstAccessBtn.disabled = false;
      button.disabled = false;
      firstAccessBtn.textContent = 'PRIMEIRO ACESSO';
    }
  }

  button.onclick = enter;
  firstAccessBtn.onclick = firstAccess;
  passwordInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    enter();
  }, true);
})();
