(() => {
  const API = 'https://aureonbase.vercel.app';
  const PROJECT = 'tradevision';
  const $ = id => document.getElementById(id);

  function checkoutUrl() {
    return String(window.TRADEVISION_CHECKOUT_URL || '').trim();
  }

  function setUpgradeVisible(visible) {
    const button = $('upgradeBtn');
    if (!button) return;
    button.classList.toggle('hidden', !visible);
  }

  function renderAccess(accessInfo) {
    const subscription = accessInfo?.subscription || {};
    const usage = accessInfo && accessInfo.usage ? accessInfo.usage : {};
    const access = accessInfo?.access || {};
    const usageNode = $('accountUsage');
    const accessNode = $('accountAccess');
    const untilNode = $('accountUntil');
    const badge = $('accountBadge');

    if (!usageNode || !accessNode || !untilNode || !badge) return;

    if (access.allowed && access.status === 'active' && subscription.plan_code === 'free') {
      const used = Number(usage.used || 0);
      const limit = Number(usage.limit || 20);
      accessNode.textContent = 'Plano Free';
      untilNode.textContent = 'Sem expiração';
      usageNode.textContent = `${used} de ${limit} operações neste mês`;
      badge.textContent = `Free • ${used}/${limit}`;
      setUpgradeVisible(true);
      return;
    }

    if (access.allowed && (subscription.plan_code === 'pro-monthly' || usage.unlimited === true)) {
      usageNode.textContent = 'Operações ilimitadas';
      if (access.status === 'active') accessNode.textContent = 'TradeVision Pro';
      if (access.status === 'active') badge.textContent = 'Pro';
      setUpgradeVisible(false);
      return;
    }

    usageNode.textContent = '—';
    setUpgradeVisible(false);
  }

  async function refreshFreemiumState() {
    const token = localStorage.getItem('tv_access') || '';
    if (!token) return;
    try {
      const response = await fetch(`${API}/projects/${PROJECT}/access`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const accessInfo = await response.json();
      renderAccess(accessInfo);
    } catch {
      // Core app keeps the last known state when offline.
    }
  }

  function handleUpgrade() {
    const url = checkoutUrl();
    if (url) {
      window.location.assign(url);
      return;
    }
    alert('O checkout do TradeVision Pro está em configuração.');
  }

  function scheduleRefresh() {
    window.setTimeout(refreshFreemiumState, 700);
  }

  function init() {
    $('upgradeBtn')?.addEventListener('click', handleUpgrade);
    document.querySelector('[data-view="settings"]')?.addEventListener('click', refreshFreemiumState);
    $('opForm')?.addEventListener('submit', scheduleRefresh);
    window.addEventListener('online', refreshFreemiumState);
    refreshFreemiumState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
