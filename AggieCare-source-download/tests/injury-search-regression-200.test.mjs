import assert from "node:assert/strict";
import test from "node:test";
import { searchEnglish } from "../app/english-search.ts";

const cases = [
  ["broke my knee", "acute-care"],
  ["my knee is broken", "acute-care"],
  ["my knee hurts", "acute-care"],
  ["I scraped my knee", "acute-care"],
  ["I fell and hurt my knee", "acute-care"],
  ["I twisted my ankle", "acute-care"],
  ["I sprained my wrist", "acute-care"],
  ["I broke my wrist", "acute-care"],
  ["I cut my hand", "acute-care"],
  ["my leg is bleeding", "acute-care"],
  ["my elbow is injured", "acute-care"],
  ["my ankle is swollen after a fall", "acute-care"],
  ["my knee pad broke", null],
  ["my knee brace broke", null],
  ["my bike is broken", null],
  ["the bicycle wheel broke", null],
  ["the chair leg broke", null],
  ["my helmet is broken", "free-helmet"],
];

function variant(query, round) {
  switch (round % 5) {
    case 1: return query;
    case 2: return query.toUpperCase();
    case 3: return `  ${query}  `;
    case 4: return `${query}?`;
    default: return query.replaceAll(" ", "  ");
  }
}

test(`200 rounds of ${cases.length} physical-injury and object-damage queries`, () => {
  for (let round = 1; round <= 200; round++) {
    for (const [query, expected] of cases) {
      const hits = searchEnglish(variant(query, round)).map((hit) => hit.id);
      assert.equal(hits[0] || null, expected, `round ${round}: ${query} -> ${hits.join(", ")}`);
      assert.equal(hits.includes("counseling"), false, `round ${round}: ${query} unexpectedly led to counseling`);
    }
  }
});
