import assert from "node:assert/strict";
import test from "node:test";
import { searchEnglish } from "../app/english-search.ts";

const examples = [
  ["my kneee hurts", "acute-care"], ["broke my kneee", "acute-care"],
  ["my ankel is swollen", "acute-care"], ["my stomache hurts", "acute-care"],
  ["I need therpy", "counseling"], ["I need counceling", "counseling"],
  ["I have anxity", "counseling"], ["I need groceires", "pantry"],
  ["where is the pantrie", "pantry"], ["I need a helment", "free-helmet"],
  ["I need narkan", "hp-narcan"], ["I need fentinal test strips", "fentanyl-strips"],
  ["I need a condomn", "love-lab"], ["I need calfrsh", "aggie-compass"],
  ["my boyfrend hit me", "care"], ["I was sexully assaulted", "care"],
  ["I need perod pads", "love-lab"], ["I need deoderant", "aggie-compass"],
  ["I need a clinc", "acute-care"], ["I need mentl helth", "counseling"],
  ["I need a knee pad", null], ["my book is sick", null],
  ["I need candy", null], ["I am hungry for success", null],
];

test("reviewed English typo corrections retain intent without guessing unrelated words", () => {
  const failures = [];
  for (const [query, expected] of examples) {
    const hits = searchEnglish(query).map((hit) => hit.id);
    if ((hits[0] || null) !== expected) failures.push({ query, expected, actual: hits.slice(0, 5) });
  }
  assert.deepEqual(failures, []);
});
