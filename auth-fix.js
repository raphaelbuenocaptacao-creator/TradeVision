(() => {
  const button = document.getElementById('loginBtn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const message = document.getElementById('loginMsg');
  if (!button || !emailInput || !passwordInput || !message) return;

  function authMessage(error) {
    if (error?.code === 'NETWORK_ERROR') return 'Sem conexão com a Aureon Base. Verifique sua internet.';
    if (error?.status === 409) return 'Esta conta já existe. Confira a senha informada.';
    if (error?.status === 403) return 'Este e-mail ainda não está autorizado para o TradeVision.';
    if (error?.status === 429) return 'Muitas tentativas. Aguarde alguns minutos.';
    if (error?.status === 402) return 'Seu período de acesso está inativo.';
    if (error?.status === 401) return 'E-mail ou senha incorretos.';
    if (error?.status >= 500) return 'A Aureon Base está atualizando. Tente novamente em instantes.';
    return 'Não foi possível entrar agora.';
  }

  async function enterOrCreate() {
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    if (!email || password.length < 10) {
      message.textContent = 'Informe seu e-mail e uma senha com pelo menos 10 caracteres.';
      return;
    }

    button.disabled = true;
    button.textContent = 'CONECTANDO...';
    message.textContent = 'Validando acesso...';

    try {
      let data;
      try {
        data = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }, false);
      } catch (error) {
        if (error?.status !== 401) throw error;
        data = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, project_slug: PROJECT }),
        }, false);
      }
      persistTokens(data);
      await loadCloud();
      showApp();
      message.textContent = '';
    } catch (error) {
      message.textContent = authMessage(error);
    } finally {
      button.disabled = false;
      button.textContent = 'ENTRAR';
    }
  }

  button.onclick = enterOrCreate;
  passwordInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    enterOrCreate();
  }, true);
})();
