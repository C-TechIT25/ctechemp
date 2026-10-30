import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch, resetApiRequests } from '../src/utils/apiClient.js';
globalThis.window = new EventTarget();

test('concurrent reads share transport and have independent bodies; subsequent reads are fresh', async () => {
  resetApiRequests();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ calls }); };
  const [a, b] = await Promise.all([apiFetch('/employees'), apiFetch('/employees')]);
  assert.equal(calls, 1);
  assert.deepEqual(await a.json(), await b.json());
  await apiFetch('/employees');
  assert.equal(calls, 2);
});

test('writes are never deduplicated; failed reads can retry', async () => {
  resetApiRequests();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({}); };
  await Promise.all([apiFetch('/todos', { method: 'POST' }), apiFetch('/todos', { method: 'POST' })]);
  assert.equal(calls, 2);
  globalThis.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(apiFetch('/todos'));
  globalThis.fetch = async () => Response.json(['updated']);
  assert.deepEqual(await (await apiFetch('/todos')).json(), ['updated']);
});

test('different credentials and session resets cannot reuse another request', async () => {
  resetApiRequests();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({}); };
  await Promise.all([
    apiFetch('/todos', { headers: { Authorization: 'Bearer a' } }),
    apiFetch('/todos', { headers: { Authorization: 'Bearer b' } }),
  ]);
  assert.equal(calls, 2);
  const old = apiFetch('/employees');
  resetApiRequests();
  await Promise.all([old, apiFetch('/employees')]);
  assert.equal(calls, 4);
});
