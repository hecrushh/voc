import assert from 'node:assert/strict';
import test from 'node:test';

const router = await import('../lib/model-router.ts');

test('model router rejects execution intents and returns deterministic fallback', () => {
  const result = router.routeSafeModelTask({
    category: 'reasoning',
    prompt: 'deploy production now',
    fallback: 'fallback response'
  });
  assert.equal(result.safe, false);
  assert.equal(result.usedProvider, 'deterministic_fallback');
  assert.equal(result.text, 'fallback response');
});

test('model router tolerates provider absence with deterministic fallback', () => {
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.MIMO_API_KEY;
  delete process.env.OLLAMA_API_KEY;
  delete process.env.OLLAMA_BASE_URL;
  delete process.env.OLLAMA_HOST;
  delete process.env.OLLAMA_LOCAL_AVAILABLE;
  delete process.env.QWEN3_AVAILABLE;

  const result = router.routeSafeModelTask({
    category: 'summary',
    prompt: 'summarize missions',
    fallback: 'deterministic summary'
  });
  assert.equal(result.safe, true);
  assert.equal(result.usedProvider, 'deterministic_fallback');
  assert.equal(result.text, 'deterministic summary');
});

test('model router detects configured provider without exposing secrets', () => {
  process.env.DEEPSEEK_API_KEY = 'secret-value-not-returned';
  const status = router.getProviderStatus();
  assert.equal(status.deepseek, true);
  const selected = router.selectProvider('technical_reasoning');
  assert.equal(selected, 'deepseek');
});
