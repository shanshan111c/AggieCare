import assert from "node:assert/strict";
import test from "node:test";
import { searchEnglish } from "../app/english-search.ts";

const top = (query) => searchEnglish(query)[0]?.id;

test("time and place modifiers rerank matching needs, not unrelated services", () => {
  assert.equal(top("I need food tonight"), "freedge");
  assert.equal(top("I need condoms after hours"), "love-lab-bag");
  assert.equal(top("free groceries near ARC"), "mobile-pantry-arc");
  assert.equal(top("free food near the Student Community Center"), "mobile-pantry-scc");
  assert.equal(top("free fruit near South Coho"), "fruit-veggie-coho");
  assert.deepEqual(searchEnglish("my coding arc"), []);
});

test("specific needs retain stronger relevance than a location-only match", () => {
  assert.equal(top("hot meal near ARC"), "aggie-eats");
  assert.equal(top("I need a doctor near ARC"), "acute-care");
  assert.equal(searchEnglish("I want to die because I have no food tonight").some((hit) => hit.id === "freedge"), false);
});
