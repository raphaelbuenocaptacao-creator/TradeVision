import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const uiUrl = new URL('../freemium-ui.js', import.meta.url);
const ui = existsSync(uiUrl) ? readFileSync(uiUrl, 'utf8') : '';

test('account panel exposes plan usage and an upgrade action', () => {
  assert.match(html, /id="accountUsage"/);
  assert.match(html, /id="upgradeBtn"/);
  assert.match(html, /R\$\s*39,90/);
  assert.match(html, /freemium-ui\.js/);
});

test('freemium UI reads authoritative plan and usage from Aureon Base', () => {
  assert.match(ui, /\/projects\/\$\{PROJECT\}\/access/);
  assert.match(ui, /Authorization/);
  assert.match(ui, /accessInfo\.usage/);
});

test('Free plan renders monthly usage and keeps upgrade visible', () => {
  assert.match(ui, /plan_code\s*===\s*['"]free['"]/);
  assert.match(ui, /accountUsage/);
  assert.match(ui, /upgradeBtn/);
  assert.match(ui, /usage\.used/);
  assert.match(ui, /usage\.limit/);
});

test('upgrade action is provider-neutral until a checkout URL is configured', () => {
  assert.match(ui, /TRADEVISION_CHECKOUT_URL/);
  assert.match(ui, /location\.assign/);
});
