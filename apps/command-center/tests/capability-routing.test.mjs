import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dbDir = mkdtempSync(join(tmpdir(), 'voc-capability-routing-'));
process.env.VOC_DB_PATH = join(dbDir, 'voc.db');

const capabilityRouter = await import('../lib/capability-router.ts');
const providerStrategy = await import('../lib/provider-strategy.ts');
const telegramCommands = await import('../lib/telegram-commands.ts');

// ---- Capability classification ----

test('classifyCapability returns coding for backend/code keywords', () => {
  const result = capabilityRouter.classifyCapability('review backend API code');
  assert.equal(result.capability, 'coding');
  assert.equal(result.agent, 'lannes');
});

test('classifyCapability returns research for research keywords', () => {
  const result = capabilityRouter.classifyCapability('riset competitor market');
  assert.equal(result.capability, 'research');
  assert.equal(result.agent, 'caulaincourt');
});

test('classifyCapability returns marketing for marketing keywords', () => {
  const result = capabilityRouter.classifyCapability('draft marketing campaign launch');
  assert.equal(result.capability, 'marketing');
  assert.equal(result.agent, 'murat');
});

test('classifyCapability returns security for security keywords', () => {
  const result = capabilityRouter.classifyCapability('audit credential threat');
  assert.equal(result.capability, 'security');
  assert.equal(result.agent, 'davout');
});

test('classifyCapability returns devops for devops keywords', () => {
  const result = capabilityRouter.classifyCapability('deploy VPS docker infrastructure');
  assert.equal(result.capability, 'devops');
  assert.equal(result.agent, 'massena');
});

test('classifyCapability returns planning for planning keywords', () => {
  const result = capabilityRouter.classifyCapability('plan coordination review status');
  assert.equal(result.capability, 'planning');
  assert.equal(result.agent, 'berthier');
});

test('classifyCapability defaults to planning for unknown text', () => {
  const result = capabilityRouter.classifyCapability('hello there');
  assert.equal(result.capability, 'planning');
  assert.equal(result.agent, 'berthier');
});

// ---- Agent mapping ----

test('capability agent map assigns coding to LANNES', () => {
  assert.equal(capabilityRouter.capabilityAgentMap.coding, 'lannes');
});

test('capability agent map assigns research to CAULAINCOURT', () => {
  assert.equal(capabilityRouter.capabilityAgentMap.research, 'caulaincourt');
});

test('capability agent map assigns marketing to MURAT', () => {
  assert.equal(capabilityRouter.capabilityAgentMap.marketing, 'murat');
});

test('capability agent map assigns security to DAVOUT', () => {
  assert.equal(capabilityRouter.capabilityAgentMap.security, 'davout');
});

test('capability agent map assigns devops to MASSENA', () => {
  assert.equal(capabilityRouter.capabilityAgentMap.devops, 'massena');
});

test('capability agent map assigns planning to BERTHIER', () => {
  assert.equal(capabilityRouter.capabilityAgentMap.planning, 'berthier');
});

// ---- Provider strategy mapping ----

test('coding routes to worker_pool', () => {
  assert.equal(providerStrategy.resolveProviderStrategy('coding'), 'worker_pool');
});

test('research routes to worker_pool', () => {
  assert.equal(providerStrategy.resolveProviderStrategy('research'), 'worker_pool');
});

test('marketing routes to worker_pool', () => {
  assert.equal(providerStrategy.resolveProviderStrategy('marketing'), 'worker_pool');
});

test('security routes to worker_pool', () => {
  assert.equal(providerStrategy.resolveProviderStrategy('security'), 'worker_pool');
});

test('devops routes to worker_pool', () => {
  assert.equal(providerStrategy.resolveProviderStrategy('devops'), 'worker_pool');
});

test('planning routes to command_brain', () => {
  assert.equal(providerStrategy.resolveProviderStrategy('planning'), 'command_brain');
});

test('BERTHIER planning routes to command_brain', () => {
  const route = capabilityRouter.classifyCapability('plan coordination review status');
  assert.equal(route.capability, 'planning');
  assert.equal(providerStrategy.resolveProviderStrategy(route.capability), 'command_brain');
});

// ---- Workbench response includes capability routing ----

test('workbench reply includes Agent, Capability, and Provider Strategy', () => {
  const response = telegramCommands.handleTelegramCommand('Berthier, minta Lannes review backend VOC');
  assert.match(response.text, /Agent: LANNES/);
  assert.match(response.text, /Capability: coding/);
  assert.match(response.text, /Provider Strategy: worker_pool/);
});

test('workbench reply for marketing includes marketing capability', () => {
  const response = telegramCommands.handleTelegramCommand('Berthier, buatkan draft marketing untuk Tipper');
  assert.match(response.text, /Capability: marketing/);
  assert.match(response.text, /Provider Strategy: worker_pool/);
  assert.match(response.text, /Agent: MURAT/);
});

test('workbench reply for research includes research capability', () => {
  const response = telegramCommands.handleTelegramCommand('Berthier, riset integrasi SKP bridge');
  assert.match(response.text, /Capability: research/);
  assert.match(response.text, /Provider Strategy: worker_pool/);
  assert.match(response.text, /Agent: CAULAINCOURT/);
});
