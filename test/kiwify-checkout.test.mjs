import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ui = readFileSync(new URL('../freemium-ui.js', import.meta.url), 'utf8');

test('TradeVision Pro upgrade uses the official Kiwify checkout', () => {
  assert.match(ui, /https:\/\/pay\.kiwify\.com\.br\/PauaSjH/);
  assert.match(ui, /location\.assign/);
});
