import assert from "node:assert/strict";
import test from "node:test";
import { searchEnglish } from "../app/english-search.ts";

const implicit = [
  ["my cabinets are bare", "pantry"],
  ["my last meal was yesterday", "aggie-eats"],
  ["I keep skipping meals because my money ran out", "aggie-eats"],
  ["I might need to sleep in my car tonight", "aggie-compass"],
  ["my period started and I have nothing with me", "love-lab"],
  ["we are about to hook up but forgot protection", "love-lab"],
  ["he waits outside my dorm even after I asked him to leave", "care"],
  ["my partner checks my phone and will not let me leave", "care"],
  ["I keep crying and can barely go to class", "counseling"],
  ["I ate bad food and now I keep vomiting", "acute-care"],
];

const fragments = [
  ["no dinner", "aggie-eats"],
  ["hungry rn", "aggie-eats"],
  ["pantry", "pantry"],
  ["crash tonight", "aggie-compass"],
  ["nauseous rn", "acute-care"],
  ["flashbacks class", "counseling"],
  ["condoms asap", "love-lab"],
  ["narcan now", "hp-narcan"],
  ["car sleeping", "aggie-compass"],
];

const typos = [
  ["grocereis", "pantry"],
  ["pantrry", "pantry"],
  ["counsling", "counseling"],
  ["helmat", "free-helmet"],
  ["vommitng", "acute-care"],
  ["mentl helth", "counseling"],
  ["lvoe lab", "love-lab"],
  ["agie compass", "aggie-compass"],
  ["narkn", "hp-narcan"],
];

test("implicit full-sentence needs route to relevant services", () => {
  assert.deepEqual(implicit.flatMap(([query, id]) => searchEnglish(query)[0]?.id === id ? [] : [`${query}: ${searchEnglish(query)[0]?.id} != ${id}`]), []);
});
test("short phrases work without a full sentence", () => {
  assert.deepEqual(fragments.flatMap(([query, id]) => searchEnglish(query)[0]?.id === id ? [] : [`${query}: ${searchEnglish(query)[0]?.id} != ${id}`]), []);
});
test("curated typos and safe fuzzy correction preserve intent", () => {
  assert.deepEqual(typos.flatMap(([query, id]) => searchEnglish(query)[0]?.id === id ? [] : [`${query}: ${searchEnglish(query)[0]?.id} != ${id}`]), []);
});
test("figurative and cross-domain phrases stay out of resource results", () => {
  const negatives = ["my phone died", "food for thought", "this class is killing me", "I need a binder for class", "I want to kill boy in a video game"];
  assert.deepEqual(negatives.flatMap((query) => searchEnglish(query).length ? [query] : []), []);
  assert.equal(searchEnglish("I ate bad food and now I am vomiting").some((hit) => hit.id.startsWith("satellite-")), false);
});

test("a request for help with violence reaches advocacy without guessing from a bare word", () => {
  assert.equal(searchEnglish("I need help with violence")[0]?.id, "care");
  assert.equal(searchEnglish("someone hurt me")[0]?.id, "care");
  assert.deepEqual(searchEnglish("violence in a movie"), []);
});

test("negation and contrast preserve the student's actual request", () => {
  const cases = [
    ["I don't need food; I need a doctor", "acute-care"],
    ["I need a doctor, not food", "acute-care"],
    ["Not condoms, I need help after assault", "care"],
    ["My phone broke, but I need food", "aggie-eats"],
  ];
  assert.deepEqual(cases.flatMap(([query, id]) => {
    const hits = searchEnglish(query);
    return hits[0]?.id === id && !hits.some((hit) => hit.id === "aggie-eats" && id !== "aggie-eats") ? [] : [`${query}: ${hits.map((hit) => hit.id).join(", ")}`];
  }), []);
});
