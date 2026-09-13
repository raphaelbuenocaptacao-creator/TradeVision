(() => {
  const loginRoot = document.getElementById('login');
  const card = loginRoot?.querySelector('.login-card');
  if (!card || document.getElementById('signupPanel')) return;

  card.insertAdjacentHTML('beforeend', `
    <div class="auth-signup" id="authSignup">
      <div class="auth-divider"><span>ou</span></div>
      <button id="showSignupBtn" type="button" class="ghost">CRIAR CONTA GRÁTIS</button>
      <div id="signupPanel" class="hidden">
        <p class="note">Comece no TradeVision Free. Não precisa de cartão.</p>
        <input id="signupPasswordConfirm" type="password" placeholder="Confirme sua senha" autocomplete="new-password">
        <button id="signupBtn" type="button">CRIAR CONTA</button>
        <button id="cancelSignupBtn" type="button" class="ghost">VOLTAR PARA ENTRAR</button>
      </div>
    </div>
  `);

  const showButton = document.getElementById('showSignupBtn');
  const panel = document.getElementById('signupPanel');
  const confirmInput = document.getElementById('signupPasswordConfirm');
  const signupButton = document.getElementById('signupBtn');
  const cancelButton = document.getElementById('cancelSignupBtn');
  const loginButton = document.getElementById('loginBtn');
  const message = document.getElementById('loginMsg');
  const passwordInput = document.getElementById('password');

  function setSignupMode(enabled) {
    panel.classList.toggle('hidden', !enabled);
    showButton.classList.toggle('hidden', enabled);
    loginButton.classList.toggle('hidden', enabled);
    passwordInput.autocomplete = enabled ? 'new-password' : 'current-password';
    if (!enabled) confirmInput.value = '';
    message.textContent = '';
  }

  function signupMessage(error) {
    const code = error?.data?.error || error?.message;
    if (error?.code === 'NETWORK_ERROR') return 'Sem conexão com a Aureon Base. Verifique sua internet e tente novamente.';
    if (code === 'email_already_exists') return 'Já existe uma conta com este e-mail. Entre com sua senha.';
    if (code === 'invalid_credentials') return 'Use um e-mail válido e uma senha com pelo menos 10 caracteres.';
    if (error?.status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    return 'Não foi possível criar sua conta agora. Tente novamente.';
  }

  async function signup() {
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmation = confirmInput.value;

    if (!email || password.length < 10) {
      message.textContent = 'Informe um e-mail válido e uma senha com pelo menos 10 caracteres.';
      return;
    }
    if (password !== confirmation) {
      message.textContent = 'As senhas não coincidem.';
      return;
    }

    signupButton.disabled = true;
    cancelButton.disabled = true;
    message.textContent = 'Criando sua conta Free...';
    try {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, project_slug: PROJECT }),
      }, false);
      persistTokens(data);
      await loadCloud();
      showApp();
      message.textContent = '';
    } catch (error) {
      clearTokens();
      message.textContent = signupMessage(error);
    } finally {
      signupButton.disabled = false;
      cancelButton.disabled = false;
    }
  }

  showButton.addEventListener('click', () => setSignupMode(true));
  cancelButton.addEventListener('click', () => setSignupMode(false));
  signupButton.addEventListener('click', signup);
  confirmInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') signup();
  });
})();
