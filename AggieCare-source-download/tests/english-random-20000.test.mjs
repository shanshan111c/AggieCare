import assert from "node:assert/strict";
import test from "node:test";
import { searchEnglish } from "../app/english-search.ts";
import { cases as typoCases } from "./english-search-2000.test.mjs";
import { cases as dailyCases } from "./english-daily-1000.test.mjs";

// Seeded randomized regression, not training data. 100 human-labelled seed
// intents x 200 spelling/format/context variations = 20,000 deterministic
// queries. The variants are not 20,000 independently labelled user reports.
const sources = [
  ...typoCases.map(([query, expected]) => ({ query, allowed: expected ? [expected] : [], excluded: [] })),
  ...dailyCases.map(([query, allowed, excluded = []]) => ({ query, allowed, excluded })),
];
const prefixes = ["", "please: ", "quick question: ", "uc davis student: ", "help me find this: "];
const suffixes = ["", "?", " please", " on campus", " at UC Davis", " nearby", " right now", " for a student"];

function rng(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function variant(query, random) {
  let result = query;
  const form = Math.floor(random() * 5);
  if (form === 1) result = result.toUpperCase();
  if (form === 2) result = result[0].toUpperCase() + result.slice(1);
  if (form === 3) result = result.replaceAll(" ", "  ");
  if (form === 4) result = `  ${result}  `;
  return `${prefixes[Math.floor(random() * prefixes.length)]}${result}${suffixes[Math.floor(random() * suffixes.length)]}`;
}

test("20,000 reproducible randomized English help queries retain labelled intent", () => {
  assert.equal(sources.length, 100);
  const random = rng(20261111);
  const failures = new Map();
  let passed = 0;
  for (const { query, allowed, excluded } of sources) {
    for (let i = 0; i < 200; i++) {
      const input = variant(query, random);
      const actual = searchEnglish(input).map((hit) => hit.id);
      const valid = (allowed.length ? allowed.includes(actual[0]) : actual.length === 0) && excluded.every((id) => !actual.includes(id));
      passed += Number(valid);
      if (!valid) {
        const entry = failures.get(query) || { count: 0, input, allowed, excluded, actual: actual.slice(0, 5) };
        entry.count++;
        failures.set(query, entry);
      }
    }
  }
  assert.equal(passed, 20_000, `${passed}/20000 passed; failures: ${JSON.stringify([...failures].map(([query, issue]) => ({ query, ...issue })))}`);
});
