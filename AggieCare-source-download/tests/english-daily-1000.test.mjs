import assert from "node:assert/strict";
import test from "node:test";
import { searchEnglish } from "../app/english-search.ts";

// 50 original, hand-labelled everyday intents × 20 keyboard/context variants.
// This is an offline regression evaluation, not a trained language model or a
// claim of 1,000 independent semantic needs.
export const cases = [
  ["broke my knee", ["acute-care"]],
  ["my knee hurts", ["acute-care"]],
  ["I scraped my knee", ["acute-care"]],
  ["my ankle is swollen after a fall", ["acute-care"]],
  ["I feel dizzy", ["acute-care"]],
  ["I keep throwing up", ["acute-care"]],
  ["my wrist looks fractured", ["acute-care"]],
  ["my stomach hurts", ["acute-care"]],
  ["need help paying rent", ["aggie-compass"]],
  ["I am sleeping in my car", ["aggie-compass"]],
  ["I need food stamps", ["aggie-compass"], ["aggie-eats", "pantry", "freedge"]],
  ["I need soap and shampoo", ["aggie-compass", "pantry"]],
  ["I have no place to stay", ["aggie-compass"]],
  ["I am broke and hungry", ["aggie-eats", "pantry"]],
  ["I have not eaten today", ["aggie-eats", "pantry"]],
  ["I need free groceries", ["pantry"]],
  ["I need a hot lunch", ["aggie-eats"]],
  ["where can I get free produce", ["pantry", "fruit-veggie-compass", "fruit-veggie-coho"], ["aggie-eats", "aggie-compass"]],
  ["I need food after hours", ["freedge"]],
  ["where is the food pantry", ["pantry"]],
  ["I am spiraling", ["counseling"]],
  ["I need someone to talk to", ["counseling"]],
  ["my anxiety is through the roof", ["counseling"]],
  ["I am depressed", ["counseling"]],
  ["emo", ["counseling"]],
  ["I have been crying all day", ["counseling"]],
  ["my ex follows me", ["care"]],
  ["my boyfriend hit me", ["care"]],
  ["I was sexually assaulted", ["care"]],
  ["my partner will not let me leave", ["care"]],
  ["I need a condom", ["love-lab"]],
  ["I need a period pad", ["love-lab"]],
  ["I need plan b", ["love-lab"]],
  ["I need naloxone", ["hp-narcan"]],
  ["I need fentanyl testing strips", ["fentanyl-strips"]],
  ["I need groceires", ["pantry"]],
  ["I need counceling", ["counseling"]],
  ["my anxity is bad", ["counseling"]],
  ["my kneee hurts", ["acute-care"]],
  ["my helment broke", ["free-helmet"]],
  ["I need therpy", ["counseling"]],
  ["my phone is broken", []],
  ["the chair leg broke", []],
  ["my knee brace broke", []],
  ["I need a pad for my mouse", []],
  ["I am hungry for success", []],
  ["I want to eat my words", []],
  ["my bike is sick", []],
  ["food truck code review", []],
  ["I love my boyfriend", []],
];

export function variant(query, index) {
  const format = index % 5;
  const value = format === 0 ? query : format === 1 ? query.toUpperCase() : format === 2 ? `  ${query}  ` : format === 3 ? query.replaceAll(" ", "  ") : query.toLowerCase();
  return `${value}${["", "?", " on campus", " at UC Davis"][Math.floor(index / 5)]}`;
}

test("1,000 English daily-life queries match manually labelled campus intent", () => {
  assert.equal(cases.length, 50);
  let correct = 0;
  const failures = new Map();
  for (const [query, expected, excluded = []] of cases) {
    for (let i = 0; i < 20; i++) {
      const actual = searchEnglish(variant(query, i)).map((hit) => hit.id);
      const pass = (expected.length ? expected.includes(actual[0]) : actual.length === 0) && excluded.every((id) => !actual.includes(id));
      correct += Number(pass);
      if (!pass && !failures.has(query)) failures.set(query, { query, expected, actual: actual.slice(0, 6) });
    }
  }
  assert.equal(correct, 1000, `accuracy ${correct}/1000; differences: ${JSON.stringify([...failures.values()])}`);
});
