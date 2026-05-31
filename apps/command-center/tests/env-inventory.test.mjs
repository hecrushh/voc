import assert from 'node:assert/strict';
import test from 'node:test';

// The env-inventory module is side-effect-free (reads process.env, never mutates).
// We set VOC_DB_PATH so the DB module doesn't fail if imported transitively.
const { mkdtempSync } = await import('node:fs');
const { tmpdir } = await import('node:os');
const { join } = await import('node:path');
const dbDir = mkdtempSync(join(tmpdir(), 'voc-env-inventory-'));
process.env.VOC_DB_PATH = join(dbDir, 'voc.db');

const { getEnvInventory, formatEnvInventory } = await import('../lib/env-inventory.ts');

test('env inventory returns only present or missing', () => {
  const inventory = getEnvInventory();
  assert.ok(Array.isArray(inventory));
  assert.ok(inventory.length > 0);
  for (const entry of inventory) {
    assert.ok(entry.status === 'present' || entry.status === 'missing');
    assert.ok(typeof entry.name === 'string' && entry.name.length > 0);
  }
});

test('env inventory never returns values', () => {
  // Set a known secret so we can verify it never leaks
  const original = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'sk-test-should-never-appear';
  const inventory = getEnvInventory();
  const entry = inventory.find((item) => item.name === 'OPENAI_API_KEY');
  assert.ok(entry);
  const inventoryString = JSON.stringify(inventory);
  assert.ok(!inventoryString.includes('sk-test-should-never-appear'), 'inventory must not contain secret values');
  // Restore
  if (original === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = original;
  }
});

test('env inventory uses custom allowlist', () => {
  process.env.CUSTOM_VAR_1234 = 'yes';
  const inventory = getEnvInventory(['CUSTOM_VAR_1234', 'DOES_NOT_EXIST']);
  assert.equal(inventory.length, 2);
  assert.equal(inventory[0].name, 'CUSTOM_VAR_1234');
  assert.equal(inventory[0].status, 'present');
  assert.equal(inventory[1].name, 'DOES_NOT_EXIST');
  assert.equal(inventory[1].status, 'missing');
  delete process.env.CUSTOM_VAR_1234;
});

test('env inventory reports empty string as missing', () => {
  process.env.EMPTY_VAR = '   ';
  const inventory = getEnvInventory(['EMPTY_VAR']);
  assert.equal(inventory[0].status, 'missing');
  delete process.env.EMPTY_VAR;
});

test('formatEnvInventory produces correct format', () => {
  const inventory = [
    { name: 'OPENAI_API_KEY', status: 'present' },
    { name: 'DEEPSEEK_API_KEY', status: 'missing' },
  ];
  const output = formatEnvInventory(inventory);
  assert.match(output, /Env inventory, Sire\./);
  assert.match(output, /OPENAI_API_KEY: present/);
  assert.match(output, /DEEPSEEK_API_KEY: missing/);
  assert.match(output, /Secret values are redacted by design\./);
  assert.ok(!output.includes('sk-'), 'formatted output must not contain secret values');
});
