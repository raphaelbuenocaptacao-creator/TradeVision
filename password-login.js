(() => {
  const openBtn = document.getElementById('openPasswordChange');
  const box = document.getElementById('passwordChangeBox');
  const saveBtn = document.getElementById('saveLoginPassword');
  const cancelBtn = document.getElementById('cancelPasswordChange');
  const msg = document.getElementById('passwordChangeMsg');
  const currentInput = document.getElementById('password');
  const emailInput = document.getElementById('email');
  const newInput = document.getElementById('loginNewPassword');
  const confirmInput = document.getElementById('loginConfirmPassword');

  if (!openBtn || !box || !saveBtn || !cancelBtn || !msg || !currentInput || !emailInput || !newInput || !confirmInput) return;

  function closeBox() {
    box.classList.add('hidden');
    msg.textContent = '';
    newInput.value = '';
    confirmInput.value = '';
  }

  openBtn.addEventListener('click', () => {
    box.classList.toggle('hidden');
    msg.textContent = '';
    if (!box.classList.contains('hidden')) newInput.focus();
  });

  cancelBtn.addEventListener('click', closeBox);

  saveBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim().toLowerCase();
    const currentPassword = currentInput.value;
    const newPassword = newInput.value;
    const confirmPassword = confirmInput.value;

    if (!email || currentPassword.length < 10) {
      msg.textContent = 'Informe seu e-mail e a senha atual acima.';
      return;
    }
    if (newPassword.length < 10) {
      msg.textContent = 'A nova senha precisa ter pelo menos 10 caracteres.';
      return;
    }
    if (newPassword !== confirmPassword) {
      msg.textContent = 'As novas senhas não conferem.';
      return;
    }
    if (newPassword === currentPassword) {
      msg.textContent = 'Escolha uma senha diferente da atual.';
      return;
    }

    saveBtn.disabled = true;
    msg.textContent = 'Validando sua conta...';
    try {
      const loginData = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: currentPassword }),
      }, false);
      persistTokens(loginData);

      await request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      }, false);

      clearTokens();
      currentInput.value = '';
      msg.textContent = 'Senha alterada. Agora entre com a nova senha.';
      newInput.value = '';
      confirmInput.value = '';
    } catch (error) {
      clearTokens();
      if (error?.status === 401) msg.textContent = 'E-mail ou senha atual incorretos.';
      else if (error?.status === 429) msg.textContent = 'Muitas tentativas. Aguarde alguns minutos.';
      else if (error?.code === 'NETWORK_ERROR') msg.textContent = 'Sem conexão com a Aureon Base.';
      else msg.textContent = 'Não foi possível trocar a senha agora.';
    } finally {
      saveBtn.disabled = false;
    }
  });
})();
