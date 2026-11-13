import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { default: worker } = await import("../dist/server/index.js");
const statements = [];
const db = {
  prepare(sql) {
    return {
      bind(...values) { statements.push({ sql, values }); return this; },
      async run() { return { success: true }; },
    };
  },
};
const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, DB: db };
async function send(path, init) {
  const pending = [];
  const response = await worker.fetch(new Request(`http://localhost${path}`, init), env, { waitUntil: (promise) => pending.push(promise), passThroughOnException() {} });
  await Promise.all(pending);
  return response;
}

test("site opens without an invite code and the old key endpoint is gone", async () => {
  const response = await send("/");
  assert.equal(response.status, 200);
  assert.doesNotMatch(await response.text(), /Unlock Aggie Care|Enter your individual invite code/);
  const workerSource = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.doesNotMatch(workerSource, /ACCESS_CODES|PERMANENT_CODES|aggie_access|key-auth/);
});

test("analytics records anonymous counts but rejects raw search text", async () => {
  const valid = await send("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "search", target: "submitted" }) });
  assert.equal(valid.status, 204);
  assert.deepEqual(statements.at(-1).values.slice(1), ["search", "submitted"]);
  const before = statements.length;
  const invalid = await send("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "search", target: "I need crisis counseling" }) });
  assert.equal(invalid.status, 400);
  assert.equal(statements.length, before);
  assert.equal((await send("/api/analytics")).status, 405);
});

test("Health Promotion numbered program list is absent from both views", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /programs\.map|id="programs"|href="#programs"|settings-group settings-details"><h2>\{text\.healthPromotionPrograms\}/);
  assert.match(page, /resource\.url/);
});
