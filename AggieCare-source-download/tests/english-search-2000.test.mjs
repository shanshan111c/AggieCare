import assert from "node:assert/strict";
import test from "node:test";
import { searchEnglish } from "../app/english-search.ts";

// 50 manually labelled needs x 40 orthographic/context variants. These are
// reproducible regression checks, not model training or 2,000 independent posts.
export const cases = [
  ["i need foood", "aggie-eats"], ["i am hungy", "aggie-eats"],
  ["i am starvng", "aggie-eats"], ["i need groceires", "pantry"],
  ["where is the pantrie", "pantry"], ["foodpantry", "pantry"],
  ["i need housng", "aggie-compass"], ["i need calfrsh", "aggie-compass"],
  ["i need finacial help", "aggie-compass"], ["i need deoderant", "aggie-compass"],
  ["i need clothes", "aggie-reuse"], ["i need cloythes", "aggie-reuse"],
  ["i need shoes", "aggie-reuse"], ["i need a condomn", "love-lab"],
  ["i need perod pads", "love-lab"], ["i need tampn", "love-lab"],
  ["i need lubricaant", "love-lab"], ["i need therpy", "counseling"],
  ["i need counceling", "counseling"], ["i have anxity", "counseling"],
  ["i feel depressd", "counseling"], ["emo", "counseling"],
  ["my kneee hurts", "acute-care"], ["broke my kneee", "acute-care"],
  ["my ankel is swollen", "acute-care"], ["my stomache hurts", "acute-care"],
  ["i keep vomitting", "acute-care"], ["i need a clinc", "acute-care"],
  ["i need narkan", "hp-narcan"], ["i need fentinal test strips", "fentanyl-strips"],
  ["my helment broke", "free-helmet"], ["my boyfrend hit me", "care"],
  ["i was sexully assaulted", "care"], ["i am being stalkng", "care"],
  ["my phone is broken", null], ["the chair leg broke", null],
  ["my knee brace broke", null], ["i need a pad for my mouse", null],
  ["i am hungry for success", null], ["i want to eat my words", null],
  ["my bike is sick", null], ["food truck code review", null],
  ["i love my boyfriend", null], ["i need a book", null],
  ["where is the classroom", null], ["i need candy", null],
  ["i need a mood board", null], ["i killed time with my boyfriend", null],
  ["i need wood for a project", null], ["i want a date", null],
];

function variant(query, index) {
  const contexts = ["", "?", " please", " on campus", " at UC Davis", " right now", " nearby", " for a student"];
  const forms = [query, query.toUpperCase(), `  ${query}  `, query.replaceAll(" ", "  "), query[0].toUpperCase() + query.slice(1)];
  return `${forms[index % 5]}${contexts[Math.floor(index / 5)]}`;
}

test("2,000 English typo and context variants preserve labelled intent", () => {
  assert.equal(cases.length, 50);
  const failures = [];
  for (const [query, expected] of cases) {
    for (let i = 0; i < 40; i++) {
      const input = variant(query, i);
      const actual = searchEnglish(input).map((hit) => hit.id);
      if ((actual[0] || null) !== expected) failures.push({ input, expected, actual: actual.slice(0, 3) });
    }
  }
  assert.deepEqual(failures.slice(0, 50), [], `${failures.length}/2000 failures`);
});
