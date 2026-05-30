import assert from 'node:assert/strict';
import test from 'node:test';

const github = await import('../lib/github-intelligence.ts');
const telegramCommands = await import('../lib/telegram-commands.ts');

test('summarizes local repository state read-only', () => {
  const text = github.summarizeRepoStatus('/opt/voc');
  assert.match(text, /Repo status, Sire/);
  assert.match(text, /Branch:/);
  assert.match(text, /HEAD:/);
  assert.match(text, /Recent commits:/);
});

test('detects forbidden GitHub write requests', () => {
  assert.equal(github.isForbiddenGithubWriteRequest('push to master'), true);
  assert.equal(github.isForbiddenGithubWriteRequest('create PR now'), true);
  assert.equal(github.isForbiddenGithubWriteRequest('show recent commits'), false);
});

test('Telegram repo status is read-only and GitHub writes are blocked', () => {
  const status = telegramCommands.handleTelegramCommand('/repo status');
  assert.match(status.text, /Repo status, Sire/);

  const blocked = telegramCommands.handleTelegramCommand('/github create PR for alpha');
  assert.match(blocked.text, /read-only GitHub intelligence/i);
});
