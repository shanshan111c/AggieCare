import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { additionalResourcePrompts } from "../app/resource-prompts.ts";
import { searchEnglish } from "../app/english-search.ts";

test("every expanded organization has a unique card, source, and searchable alias", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const ids = additionalResourcePrompts.map((profile) => profile.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const profile of additionalResourcePrompts) {
    assert.match(page, new RegExp(`(?:id: "${profile.id}"|"${profile.id}",)`), profile.id);
    assert.equal(searchEnglish(profile.aliases[0])[0]?.id, profile.id, profile.id);
  }
  assert.equal(ids.length, 29);
});

test("broader coverage respects sentence intent and safety", () => {
  const food = searchEnglish("I need food").map((hit) => hit.id);
  assert.ok(food.includes("satellite-hart"));
  assert.ok(food.includes("fruit-veggie-coho"));
  assert.ok(!food.includes("wrrc-pharmacy"));
  assert.equal(searchEnglish("free gender affirming clothes")[0]?.id, "lgbtq-closet");
  assert.equal(searchEnglish("food poisoning").some((hit) => hit.id.startsWith("satellite-")), false);
  assert.deepEqual(searchEnglish("I killed my boyfriend"), []);
});
