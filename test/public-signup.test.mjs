import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('login surface offers account creation', () => {
  assert.match(html, /id="signupBtn"/);
  assert.match(html, /id="signupPasswordConfirm"/);
  assert.match(html, /Criar conta/i);
});

test('signup posts to Aureon Base for TradeVision and persists returned session', () => {
  assert.match(app, /\/auth\/register/);
  assert.match(app, /project_slug:\s*PROJECT/);
  assert.match(app, /persistTokens\(data\)/);
  assert.match(app, /await loadCloud\(\)/);
});

test('signup errors distinguish duplicate email without exposing sensitive state', () => {
  assert.match(app, /email_already_exists/);
  assert.match(app, /Já existe uma conta/i);
});
