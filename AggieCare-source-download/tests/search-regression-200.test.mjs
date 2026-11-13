import test from "node:test";
import assert from "node:assert/strict";
import { classifyEnglishRisk, englishCrisisQuery, searchEnglish } from "../app/english-search.ts";

// Compact, hand-labelled student-needs matrix. The 200-round runner changes
// casing, spacing and punctuation while checking these same semantic outcomes.
const cases = [
  ["my stomach is killing me", "acute-care", ["aggie-eats", "counseling"]],
  ["I cannot keep food down", "acute-care", ["pantry", "aggie-eats", "freedge"]],
  ["I feel nauseated", "acute-care"],
  ["my head is dizzy", "acute-care"],
  ["food poisoning", "acute-care", ["pantry", "aggie-eats"]],
  ["I have a stomach ache", "acute-care"],
  ["I have a sore throat", "acute-care"],
  ["I need a pregnancy test", "acute-care"],
  ["I was raped", "care", ["love-lab"]],
  ["my ex is stalking me", "care"],
  ["my ex follows me to class", "care"],
  ["my boyfriend took my phone and will not let me leave", "care", ["love-lab"]],
  ["my partner forced me to have sex", "care", ["love-lab"]],
  ["my partner controls where I go and wont let me leave", "care"],
  ["I need a period pad", "love-lab"],
  ["I need period supplies", "love-lab"],
  ["I need sanitary pads", "love-lab"],
  ["I need contraception", "love-lab"],
  ["I need condoms after hours", "love-lab-bag"],
  ["I need a pad for my mouse", null, ["love-lab"]],
  ["I need a pad for my knee", null, ["love-lab"]],
  ["my bike brake pads are worn out", "bike-barn-checkup", ["love-lab"]],
  ["I have no money for shampoo", "aggie-compass"],
  ["I need deodorant", "aggie-compass"],
  ["I cannot afford rent", "aggie-compass"],
  ["I dont have anywhere to sleep", "aggie-compass"],
  ["I need a place to crash tonight", "aggie-compass"],
  ["I need basic needs", "aggie-compass"],
  ["I need a hot meal", "aggie-eats", ["pantry"]],
  ["I need groceries", "pantry"],
  ["I need food at SCC", "mobile-pantry-scc"],
  ["groceries after hours", "freedge"],
  ["I need help now", "health-34"],
  ["I need someone to talk to", "counseling"],
  ["I am depressed", "counseling"],
  ["panic attack", "counseling"],
  ["I feel hopeless", "counseling"],
  ["I would like to fuck up", "counseling"],
  ["I need naloxone", "hp-narcan"],
  ["I need test strips for fentanyl", "fentanyl-strips"],
  ["check my pills for fentanyl", "fentanyl-strips"],
  ["where can I get a free helmet", "free-helmet"],
  ["my helmet broken", "free-helmet", ["counseling"]],
  ["I dont need food", null, ["pantry", "aggie-eats"]],
  ["I dont want food", null, ["pantry", "aggie-eats"]],
  ["not food I need counseling", "counseling", ["pantry", "aggie-eats"]],
  ["I am hungry for attention", null, ["pantry", "aggie-eats"]],
  ["I am hungry for love", null, ["pantry", "aggie-eats"]],
  ["I am sick of school", null, ["acute-care"]],
  ["I want to eat my words", null, ["pantry", "aggie-eats"]],
  ["my phone is sick", null, ["acute-care"]],
];

const round = Number(process.env.AGGIE_SEARCH_ROUND || 1);
function variant(query) {
  switch (round % 5) {
    case 1: return query;
    case 2: return query.toUpperCase();
    case 3: return `  ${query}  `;
    case 4: return `${query}?`;
    default: return query.replaceAll(" ", "  ");
  }
}

test(`search relevance round ${round}: ${cases.length} labelled needs`, () => {
  assert.equal(cases.length, 51);
  for (const [query, primary, excluded = []] of cases) {
    const hits = searchEnglish(variant(query)).map((hit) => hit.id);
    assert.equal(hits[0] || null, primary, `${query}: ${hits.join(", ")}`);
    for (const id of excluded) assert.equal(hits.includes(id), false, `${query}: unexpected ${id}`);
  }
});

test(`risk-context round ${round}: urgent language stays distinct`, () => {
  for (const [query, expected] of [
    ["I want to kill myself", "self-harm"],
    ["I killed my boyfriend", "harm-to-others"],
    ["my boyfriend threatened to kill me", "threatened-by-other"],
    ["my stomach is killing me", null],
    ["I need a pad for my knee", null],
    ["I dont want to kill myself", null],
  ]) assert.equal(classifyEnglishRisk(variant(query)), expected, query);
  assert.equal(englishCrisisQuery(variant("panic attack")), true);
  assert.equal(englishCrisisQuery(variant("my helmet broken")), false);
});
