import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const signupUrl = new URL('../signup.js', import.meta.url);
const signup = existsSync(signupUrl) ? readFileSync(signupUrl, 'utf8') : '';

test('login loads the public account-creation surface', () => {
  assert.match(html, /signup\.js/);
  assert.ok(signup, 'expected signup.js to exist');
  assert.match(signup, /id="signupBtn"/);
  assert.match(signup, /id="signupPasswordConfirm"/);
  assert.match(signup, /Criar conta/i);
});

test('signup posts to Aureon Base for TradeVision and persists returned session', () => {
  assert.match(signup, /\/auth\/register/);
  assert.match(signup, /project_slug:\s*PROJECT/);
  assert.match(signup, /persistTokens\(data\)/);
  assert.match(signup, /await loadCloud\(\)/);
});

test('signup errors distinguish duplicate email without exposing sensitive state', () => {
  assert.match(signup, /email_already_exists/);
  assert.match(signup, /Já existe uma conta/i);
});
