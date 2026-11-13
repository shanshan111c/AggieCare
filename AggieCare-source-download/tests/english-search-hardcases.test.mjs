import assert from "node:assert/strict";
import test from "node:test";
import { classifyEnglishRisk, englishCrisisQuery, searchEnglish } from "../app/english-search.ts";

const cases = [
  ["my helmet broken", "free-helmet"],
  ["I would like to fuck up", "counseling"],
  ["fuck my boyfriend", "love-lab"],
  ["I feel sick and keep vomiting", "acute-care"],
  ["My stomach hurts", "acute-care"],
  ["I am hungry and have no money for food", "aggie-eats"],
  ["I need a place to sleep because I am homeless", "aggie-compass"],
  ["My boyfriend hit me", "care"],
  ["I am scared of my partner", "care"],
  ["I need condoms after hours", "love-lab-bag"],
  ["I need STI testing", "acute-care"],
  ["My relationship ended and I feel lonely", "counseling"],
  ["I am not hungry", null],
  ["I have a question about my boyfriend", null],
  ["Where is the library?", null],
  ["The food truck is open but I need a helmet", "free-helmet"],
  ["I have a panic attack", "counseling"],
  ["Can I pick up naloxone?", "hp-narcan"],
  ["I want fentanyl test strips", "fentanyl-strips"],
  ["Where can I find help for rent?", "aggie-compass"],
  ["Need a free meal", "aggie-eats"],
  ["Can I talk to a counselor?", "counseling"],
  ["I need a pregnancy test", "acute-care"],
  ["I need a pad for my period", "love-lab"],
];

test("English searches route specific needs without generic false positives", () => {
  for (const [query, expected] of cases) {
    const hits = searchEnglish(query);
    assert.equal(hits[0]?.id || null, expected, `${query}: ${hits.map((hit) => hit.id).join(", ")}`);
  }
});

test("crisis banner distinguishes self-harm language from sex and equipment", () => {
  assert.equal(englishCrisisQuery("I would like to fuck up"), true);
  assert.equal(englishCrisisQuery("fuck my boyfriend"), false);
  assert.equal(englishCrisisQuery("my helmet broken"), false);
  assert.equal(classifyEnglishRisk("I killed my boyfriend"), "harm-to-others");
  assert.deepEqual(searchEnglish("I killed my boyfriend"), []);
  assert.equal(classifyEnglishRisk("My boyfriend threatened to kill me"), "threatened-by-other");
  assert.equal(searchEnglish("My boyfriend threatened to kill me")[0]?.id, "care");
});
