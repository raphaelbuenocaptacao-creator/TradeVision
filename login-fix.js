(() => {
  async function loginOnly() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const button = document.getElementById('loginBtn');
    const message = document.getElementById('loginMsg');
    const email = (emailInput?.value || '').trim().toLowerCase();
    const password = passwordInput?.value || '';

    if (!email || password.length < 10) {
      if (message) message.textContent = 'Informe o e-mail e uma senha com pelo menos 10 caracteres.';
      return;
    }

    button.disabled = true;
    if (message) message.textContent = 'Conectando à Aureon Base...';

    try {
      const response = await fetch('https://aureonbase.vercel.app/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) throw new Error('AUTH');
        if (response.status === 429) throw new Error('RATE');
        throw new Error(data.error || 'SERVER');
      }

      persistTokens(data);
      await loadCloud();
      showApp();
    } catch (error) {
      if (!message) return;
      if (error.message === 'AUTH') message.textContent = 'E-mail ou senha incorretos.';
      else if (error.message === 'RATE') message.textContent = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      else if (!navigator.onLine) message.textContent = 'Sem internet. Verifique a conexão e tente novamente.';
      else message.textContent = 'O acesso foi validado, mas a sessão não abriu. Aguarde alguns segundos e tente novamente.';
    } finally {
      button.disabled = false;
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('loginBtn');
    const password = document.getElementById('password');
    if (button) button.onclick = loginOnly;
    if (password) {
      password.onkeydown = event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          loginOnly();
        }
      };
    }
  });
})();
