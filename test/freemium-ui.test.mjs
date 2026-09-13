import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('account panel exposes plan usage and an upgrade action', () => {
  assert.match(html, /id="accountUsage"/);
  assert.match(html, /id="upgradeBtn"/);
  assert.match(html, /R\$\s*39,90/);
});

test('cloud access usage is preserved in account state', () => {
  assert.match(app, /usage:\s*accessInfo\.usage/);
});

test('Free plan renders monthly usage and keeps upgrade visible', () => {
  assert.match(app, /plan_code\s*===\s*['"]free['"]/);
  assert.match(app, /accountUsage/);
  assert.match(app, /upgradeBtn/);
  assert.match(app, /usage\.used/);
  assert.match(app, /usage\.limit/);
});
