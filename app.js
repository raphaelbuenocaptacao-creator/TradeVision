const API = 'https://aureonbase.vercel.app';
const PROJECT = 'tradevision';
const OPS_CACHE = 'tradevision_ops_cache';
const SETTINGS_CACHE = 'tradevision_settings_cache';

let accessToken = localStorage.getItem('tv_access') || '';
let refreshToken = localStorage.getItem('tv_refresh') || '';
let ops = safeJson(localStorage.getItem(OPS_CACHE), []);
let settings = safeJson(localStorage.getItem(SETTINGS_CACHE), {
  dailyStop: 500,
  dailyTarget: 1000,
  baseContracts: 1,
  step: 1000,
  maxContracts: 20,
});
let account = { user: null, access: null, subscription: null, project: null };
let online = navigator.onLine;

const $ = id => document.getElementById(id);
const money = n => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function safeJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function pad(n) { return String(n).padStart(2, '0'); }
function localDateKey(d = new Date()) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function localTimeKey(d = new Date()) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}
function toLocalParts(value) {
  const d = new Date(value);
  return { date: localDateKey(d), time: localTimeKey(d) };
}

function persistTokens(data) {
  if (data?.access_token) {
    accessToken = data.access_token;
    localStorage.setItem('tv_access', accessToken);
  }
  if (data?.refresh_token) {
    refreshToken = data.refresh_token;
    localStorage.setItem('tv_refresh', refreshToken);
  }
}

function clearTokens() {
  accessToken = '';
  refreshToken = '';
  localStorage.removeItem('tv_access');
  localStorage.removeItem('tv_refresh');
}

async function raw(path, options = {}, token = accessToken) {
  try {
    return await fetch(API + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (cause) {
    const error = new Error('network_error');
    error.code = 'NETWORK_ERROR';
    error.cause = cause;
    throw error;
  }
}

async function request(path, options = {}, retry = true) {
  let response = await raw(path, options);
  if (response.status === 401 && retry && refreshToken && path !== '/auth/refresh') {
    const refreshed = await raw('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }, '');
    if (refreshed.ok) {
      persistTokens(await refreshed.json());
      response = await raw(path, options);
    } else {
      clearTokens();
    }
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function loginMessage(error) {
  if (error?.code === 'NETWORK_ERROR') return 'Sem conexão com a Aureon Base. Verifique sua internet e tente novamente.';
  if (error?.status === 409) return 'Esta conta já existe. Confira a senha informada.';
  if (error?.status === 403) return 'Este e-mail ainda não está autorizado para o TradeVision.';
  if (error?.status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (error?.status === 401) return 'E-mail ou senha incorretos.';
  return 'Não foi possível entrar agora. Tente novamente.';
}

async function login() {
  const email = $('email').value.trim().toLowerCase();
  const password = $('password').value;
  if (!email || password.length < 10) {
    $('loginMsg').textContent = 'Informe o e-mail e uma senha com pelo menos 10 caracteres.';
    return;
  }
  $('loginBtn').disabled = true;
  $('loginMsg').textContent = 'Conectando à Aureon Base...';
  try {
    let data;
    try {
      data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false);
    } catch (error) {
      if (error.status !== 401) throw error;
      data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, project_slug: PROJECT }),
      }, false);
    }
    persistTokens(data);
    await loadCloud();
    showApp();
  } catch (error) {
    $('loginMsg').textContent = loginMessage(error);
  } finally {
    $('loginBtn').disabled = false;
  }
}

async function loadCloud() {
  const [user, accessInfo] = await Promise.all([
    request('/me'),
    request(`/projects/${PROJECT}/access`),
  ]);
  account = {
    user,
    access: accessInfo.access,
    subscription: accessInfo.subscription,
    project: accessInfo.project,
  };

  if (!accessInfo.access?.allowed) {
    renderAccount();
    return;
  }

  const [cloudOps, cloudSettings] = await Promise.all([
    request(`/projects/${PROJECT}/operations?limit=1000`),
    request(`/projects/${PROJECT}/settings`),
  ]);

  ops = cloudOps.map(o => {
    const local = toLocalParts(o.operated_at);
    return {
      id: o.id,
      date: local.date,
      time: local.time,
      asset: o.asset,
      side: o.side,
      contracts: Number(o.contracts),
      result: Number(o.result),
      stop: Number(o.stop_planned),
      setup: o.setup,
      note: o.note || '',
    };
  });
  settings = {
    dailyStop: Number(cloudSettings.daily_stop),
    dailyTarget: Number(cloudSettings.daily_target),
    baseContracts: Number(cloudSettings.base_contracts),
    step: Number(cloudSettings.profit_step),
    maxContracts: Number(cloudSettings.max_contracts),
  };
  localStorage.setItem(OPS_CACHE, JSON.stringify(ops));
  localStorage.setItem(SETTINGS_CACHE, JSON.stringify(settings));
  online = true;
  renderAccount();
}

function showApp(isOffline = false) {
  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('today').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  online = !isOffline;
  render();
}

$('loginBtn').onclick = login;
$('password').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
$('logoutBtn').onclick = async () => {
  try {
    await request('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }, false);
  } catch {}
  clearTokens();
  location.reload();
};

(async () => {
  if (!accessToken && !refreshToken) return;
  try {
    await loadCloud();
    showApp();
  } catch (error) {
    if (error.code === 'NETWORK_ERROR' && ops.length) {
      showApp(true);
    } else {
      clearTokens();
    }
  }
})();

window.addEventListener('online', async () => {
  online = true;
  try { if (accessToken || refreshToken) await loadCloud(); } catch {}
  renderAccount();
});
window.addEventListener('offline', () => { online = false; renderAccount(); });

document.querySelectorAll('.nav').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('.nav,.view').forEach(x => x.classList.remove('active'));
    button.classList.add('active');
    $(button.dataset.view).classList.add('active');
    if (button.dataset.view === 'dashboard') requestAnimationFrame(drawChart);
  };
});

function canTrade() { return account.access ? Boolean(account.access.allowed) : online; }
function openModal() {
  if (!canTrade()) {
    alert('Seu período gratuito ou assinatura não está ativo.');
    return;
  }
  const now = new Date();
  $('opDate').value = localDateKey(now);
  $('opTime').value = localTimeKey(now);
  $('opContracts').value = recommendedContracts();
  $('modal').classList.remove('hidden');
}
[$('quickAdd'), $('addOperation')].forEach(button => button.onclick = openModal);
$('closeModal').onclick = () => $('modal').classList.add('hidden');

$('opForm').onsubmit = async event => {
  event.preventDefault();
  const localDateTime = new Date(`${$('opDate').value}T${$('opTime').value}:00`);
  const payload = {
    asset: $('opAsset').value,
    side: $('opSide').value,
    contracts: Number($('opContracts').value),
    result: Number($('opResult').value),
    stop_planned: Number($('opStop').value) || 0,
    setup: $('opSetup').value.trim() || 'Sem setup',
    note: $('opNote').value.trim(),
    operated_at: localDateTime.toISOString(),
  };
  try {
    await request(`/projects/${PROJECT}/operations`, { method: 'POST', body: JSON.stringify(payload) });
    await loadCloud();
    $('opForm').reset();
    $('modal').classList.add('hidden');
    render();
  } catch (error) {
    alert(error.status === 402 ? 'Seu período gratuito/assinatura não está ativo.' : error.code === 'NETWORK_ERROR' ? 'Sem internet. A operação não foi enviada.' : 'Não foi possível salvar a operação.');
  }
};

window.delOp = async id => {
  if (!confirm('Excluir esta operação?')) return;
  try {
    await request(`/projects/${PROJECT}/operations/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadCloud();
    render();
  } catch {
    alert('Não foi possível excluir a operação.');
  }
};

function recommendedContracts() {
  const pnl = ops.reduce((sum, o) => sum + o.result, 0);
  const extra = Math.max(0, Math.floor(pnl / Math.max(1, settings.step)));
  return Math.min(settings.maxContracts, settings.baseContracts + extra);
}

function group(keyFn) {
  return ops.reduce((acc, op) => {
    const key = keyFn(op);
    acc[key] = (acc[key] || 0) + op.result;
    return acc;
  }, {});
}

function metrics() {
  const wins = ops.filter(o => o.result > 0);
  const losses = ops.filter(o => o.result < 0);
  const gross = wins.reduce((sum, o) => sum + o.result, 0);
  const grossLoss = Math.abs(losses.reduce((sum, o) => sum + o.result, 0));
  const avgWin = gross / (wins.length || 1);
  const avgLoss = grossLoss / (losses.length || 1);
  const winRate = wins.length / (ops.length || 1);
  let equity = 0, peak = 0, drawdown = 0;
  [...ops].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach(o => {
    equity += o.result;
    peak = Math.max(peak, equity);
    drawdown = Math.max(drawdown, peak - equity);
  });
  return {
    wins, losses, gross, grossLoss, winRate,
    pf: grossLoss ? gross / grossLoss : gross ? Infinity : 0,
    payoff: avgLoss ? avgWin / avgLoss : 0,
    expectancy: winRate * avgWin - (1 - winRate) * avgLoss,
    drawdown,
    total: gross - grossLoss,
  };
}

function cls(n) { return n > 0 ? 'positive' : n < 0 ? 'negative' : ''; }
function bars(id, data) {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, value]) => Math.abs(value)));
  $(id).innerHTML = entries.length
    ? entries.map(([key, value]) => `<div class="hbar"><span>${escapeHtml(key)}</span><div class="hbar-track"><i style="width:${Math.abs(value) / max * 100}%"></i></div><b class="${cls(value)}">${money(value)}</b></div>`).join('')
    : '<span class="muted">Sem dados.</span>';
}

function render() {
  const m = metrics();
  const todayKey = localDateKey();
  const todaysOps = ops.filter(o => o.date === todayKey);
  const todayPnl = todaysOps.reduce((sum, o) => sum + o.result, 0);

  $('todayPnl').textContent = money(todayPnl);
  $('todayPnl').className = cls(todayPnl);
  $('todayTrades').textContent = `${todaysOps.length} operações`;
  $('totalPnl').textContent = money(m.total);
  $('totalPnl').className = cls(m.total);
  $('winRate').textContent = `${(m.winRate * 100).toFixed(1)}%`;
  $('wl').textContent = `${m.wins.length} W / ${m.losses.length} L`;
  $('contracts').textContent = recommendedContracts();
  $('contractRule').textContent = `+1 a cada ${money(settings.step)}`;
  $('profitFactor').textContent = m.pf === Infinity ? '∞' : m.pf.toFixed(2);
  $('drawdown').textContent = money(m.drawdown);
  $('payoff').textContent = m.payoff.toFixed(2);
  $('expectancy').textContent = money(m.expectancy);

  const used = Math.max(0, -todayPnl);
  const pct = Math.min(100, used / Math.max(1, settings.dailyStop) * 100);
  $('dailyStop').textContent = money(settings.dailyStop);
  $('stopBar').style.width = `${pct}%`;
  $('stopUsed').textContent = `${money(used)} utilizados`;
  $('stopRemaining').textContent = `${money(Math.max(0, settings.dailyStop - used))} restantes`;
  const hit = todayPnl <= -settings.dailyStop;
  $('riskStatus').textContent = hit ? 'STOP ATINGIDO' : pct >= 75 ? 'Atenção' : 'Dentro do plano';
  $('riskBanner').classList.toggle('hidden', !hit);
  $('riskBanner').textContent = 'STOP DIÁRIO ATINGIDO — o limite configurado foi alcançado.';

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const byWeekday = group(o => weekdays[new Date(`${o.date}T12:00:00`).getDay()]);
  const byHour = group(o => `${o.time.slice(0, 2)}h`);
  const bySetup = group(o => o.setup || 'Sem setup');
  bars('weekdayBars', byWeekday);
  bars('hourBars', byHour);
  bars('setupBars', bySetup);

  const best = obj => Object.entries(obj).sort((a, b) => b[1] - a[1])[0];
  $('bestHour').textContent = best(byHour)?.[0] || '—';
  $('bestSetup').textContent = best(bySetup)?.[0] || '—';
  const bestWeekday = best(byWeekday);
  $('bestInsight').textContent = bestWeekday
    ? `Seu melhor dia registrado é ${bestWeekday[0]}, com resultado líquido de ${money(bestWeekday[1])}.`
    : 'Registre operações para gerar insights.';

  $('opCount').textContent = `${ops.length} registros`;
  const sorted = [...ops].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  $('recentOps').innerHTML = sorted.slice(0, 6).map(o => `<div class="recent-row"><span>${escapeHtml(o.asset)}</span><span>${escapeHtml(o.time)}</span><span>${escapeHtml(o.setup)}</span><b class="${cls(o.result)}">${money(o.result)}</b></div>`).join('') || '<span class="muted">Sem operações.</span>';
  $('opsTable').innerHTML = sorted.map(o => `<tr><td>${escapeHtml(o.date.split('-').reverse().join('/'))}</td><td>${escapeHtml(o.time)}</td><td>${escapeHtml(o.asset)}</td><td>${escapeHtml(o.side)}</td><td>${o.contracts}</td><td>${escapeHtml(o.setup)}</td><td class="${cls(o.result)}"><b>${money(o.result)}</b></td><td><button class="del" onclick="delOp('${escapeHtml(o.id)}')">Excluir</button></td></tr>`).join('');

  drawChart();
  drawHeat();
  loadSettings();
  renderAccount();
}

function drawChart() {
  const canvas = $('equityChart');
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  const dpr = devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = 260 * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const arranged = [...ops].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const values = [0];
  let sum = 0;
  arranged.forEach(o => values.push(sum += o.result));
  const width = rect.width, height = 250;
  const min = Math.min(...values, 0), max = Math.max(...values, 1), range = max - min || 1;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = '#263746';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const y = 15 + i * (height - 30) / 4;
    ctx.moveTo(0, y); ctx.lineTo(width, y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#00a8d6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = index / Math.max(1, values.length - 1) * width;
    const y = 15 + (max - value) / range * (height - 30);
    index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.stroke();
}

function drawHeat() {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const hours = ['09', '10', '11', '12', '13', '14', '15', '16', '17'];
  const grouped = {};
  ops.forEach(o => {
    const day = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date(`${o.date}T12:00:00`).getDay()];
    const hour = o.time.slice(0, 2);
    grouped[day + hour] = (grouped[day + hour] || 0) + o.result;
  });
  let html = '<div class="heat head"></div>' + days.map(d => `<div class="heat head">${d}</div>`).join('');
  hours.forEach(hour => {
    html += `<div class="heat head">${hour}h</div>` + days.map(day => {
      const value = grouped[day + hour];
      return `<div class="heat ${value > 0 ? 'pos' : value < 0 ? 'neg' : ''}" title="${value == null ? 'Sem operações' : money(value)}">${value == null ? '—' : money(value)}</div>`;
    }).join('');
  });
  $('heatmap').innerHTML = html;
}

function loadSettings() {
  $('setStop').value = settings.dailyStop;
  $('setTarget').value = settings.dailyTarget;
  $('setBaseContracts').value = settings.baseContracts;
  $('setStep').value = settings.step;
  $('setMaxContracts').value = settings.maxContracts;
}

$('saveSettings').onclick = async () => {
  const next = {
    dailyStop: Number($('setStop').value),
    dailyTarget: Number($('setTarget').value),
    baseContracts: Number($('setBaseContracts').value),
    step: Number($('setStep').value),
    maxContracts: Number($('setMaxContracts').value),
  };
  if (next.dailyStop <= 0 || next.dailyTarget <= 0 || next.step <= 0 || next.baseContracts <= 0 || next.maxContracts < next.baseContracts) {
    alert('Revise as regras informadas.');
    return;
  }
  try {
    await request(`/projects/${PROJECT}/settings`, {
      method: 'PUT',
      body: JSON.stringify({
        daily_stop: next.dailyStop,
        daily_target: next.dailyTarget,
        base_contracts: next.baseContracts,
        profit_step: next.step,
        max_contracts: next.maxContracts,
      }),
    });
    settings = next;
    localStorage.setItem(SETTINGS_CACHE, JSON.stringify(settings));
    render();
    alert('Regras salvas e sincronizadas.');
  } catch {
    alert('Não foi possível salvar as regras.');
  }
};

function renderAccount() {
  const sync = $('syncStatus');
  if (!sync) return;
  sync.textContent = online ? 'Online' : 'Offline';
  sync.className = online ? 'positive' : 'negative';
  $('accountEmail').textContent = account.user?.email || '—';

  const access = account.access;
  const subscription = account.subscription;
  if (!access) {
    $('accountAccess').textContent = online ? 'Conectado' : 'Cache local';
    $('accountUntil').textContent = '—';
    $('accountBadge').textContent = online ? 'Conectado' : 'Offline';
    return;
  }

  if (access.status === 'trialing') {
    const days = Number(access.trial_days_remaining || 0);
    $('accountAccess').textContent = `Teste gratuito • ${days} dia${days === 1 ? '' : 's'} restante${days === 1 ? '' : 's'}`;
    $('accountUntil').textContent = formatDate(subscription?.trial_ends_at);
    $('accountBadge').textContent = `Teste • ${days}d`;
  } else if (access.status === 'active') {
    $('accountAccess').textContent = 'Assinatura ativa';
    $('accountUntil').textContent = formatDate(subscription?.current_period_end);
    $('accountBadge').textContent = 'Pro';
  } else if (access.status === 'lifetime') {
    $('accountAccess').textContent = 'Acesso vitalício';
    $('accountUntil').textContent = 'Sem expiração';
    $('accountBadge').textContent = 'Vitalício';
  } else {
    $('accountAccess').textContent = 'Acesso inativo';
    $('accountUntil').textContent = '—';
    $('accountBadge').textContent = 'Inativo';
  }
}

$('changePassword').onclick = async () => {
  const currentPassword = $('currentPassword').value;
  const newPassword = $('newPassword').value;
  const confirmPassword = $('confirmPassword').value;
  const msg = $('passwordMsg');
  if (newPassword.length < 10) {
    msg.textContent = 'A nova senha precisa ter pelo menos 10 caracteres.';
    return;
  }
  if (newPassword !== confirmPassword) {
    msg.textContent = 'A confirmação da nova senha não confere.';
    return;
  }
  $('changePassword').disabled = true;
  msg.textContent = 'Alterando senha...';
  try {
    await request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }, false);
    clearTokens();
    alert('Senha alterada com sucesso. Entre novamente usando a nova senha.');
    location.reload();
  } catch (error) {
    msg.textContent = error.status === 401 ? 'A senha atual está incorreta.' : error.status === 400 ? 'Escolha uma nova senha diferente, com pelo menos 10 caracteres.' : 'Não foi possível alterar a senha agora.';
  } finally {
    $('changePassword').disabled = false;
  }
};

window.addEventListener('resize', drawChart);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
