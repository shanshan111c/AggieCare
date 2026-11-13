import assert from "node:assert/strict";
import test from "node:test";
import { searchEnglish } from "../app/english-search.ts";

const ids = (query) => searchEnglish(query).map((hit) => hit.id);

test("generic food browsing remains broad, but immediate hunger is focused", () => {
  assert.ok(ids("food").includes("satellite-hart"));
  assert.ok(ids("I need food").includes("fruit-veggie-coho"));
  assert.deepEqual(ids("I am hungry right now").filter((id) => id.startsWith("satellite-") || id.startsWith("fruit-veggie-")), []);
  assert.ok(ids("I am hungry right now").includes("freedge"));
});

test("prepared meals, groceries, and produce are distinct needs", () => {
  assert.deepEqual(ids("I need a hot meal"), ["aggie-eats"]);
  assert.equal(ids("I need groceries")[0], "pantry");
  assert.ok(ids("I need groceries").includes("satellite-hart"));
  assert.ok(ids("I need fresh vegetables").includes("fruit-veggie-coho"));
  assert.equal(ids("I need a pantry")[0], "pantry");
});

test("coercive partner context reaches CARE without sexual-supply leakage", () => {
  const results = ids("My boyfriend is controlling and won't let me leave");
  assert.equal(results[0], "care");
  assert.equal(results.includes("love-lab"), false);
});
