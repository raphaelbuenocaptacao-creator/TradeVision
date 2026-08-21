(() => {
  const button = document.getElementById('loginBtn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const message = document.getElementById('loginMsg');
  if (!button || !emailInput || !passwordInput || !message) return;

  async function improvedLogin() {
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    if (!email || password.length < 10) {
      message.textContent = 'Informe seu e-mail e a senha cadastrada.';
      return;
    }

    button.disabled = true;
    button.textContent = 'CONECTANDO...';
    message.textContent = 'Validando acesso seguro...';

    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false);
      persistTokens(data);
      await loadCloud();
      showApp();
    } catch (error) {
      if (error?.code === 'NETWORK_ERROR') message.textContent = 'Sem conexão com a Aureon Base. Verifique sua internet.';
      else if (error?.status === 401) message.textContent = 'E-mail ou senha incorretos.';
      else if (error?.status === 429) message.textContent = 'Muitas tentativas. Aguarde alguns minutos.';
      else if (error?.status === 402) message.textContent = 'Seu período de acesso está inativo.';
      else if (error?.status >= 500) message.textContent = 'A Aureon Base está atualizando. Tente novamente em instantes.';
      else message.textContent = `Não foi possível entrar${error?.status ? ` (erro ${error.status})` : ''}.`;
    } finally {
      button.disabled = false;
      button.textContent = 'ENTRAR';
    }
  }

  button.onclick = improvedLogin;
  passwordInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    improvedLogin();
  }, true);
})();
