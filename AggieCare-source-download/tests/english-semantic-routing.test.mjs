import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyEnglishRisk, searchEnglish } from "../app/english-search.ts";

const cases = [
  ["lowkey starving rn", "aggie-eats"],
  ["I'm broke and haven't eaten today", "aggie-eats"],
  ["can't afford dinner tonight", "aggie-eats"],
  ["my fridge is empty and I need groceries", "pantry"],
  ["I need a place to crash tonight", "aggie-compass"],
  ["I can't pay rent this month", "aggie-compass"],
  ["need help applying for SNAP", "aggie-compass"],
  ["I need plan b", "love-lab"],
  ["need rubbers for sex", "love-lab"],
  ["my period started and I have no pads", "love-lab"],
  ["my bf forced me to have sex", "care"],
  ["my ex keeps following me around campus", "care"],
  ["my boyfriend grabbed my throat", "care"],
  ["I can't cope rn", "counseling"],
  ["I am spiraling and need someone to talk to", "counseling"],
  ["my bf broke my heart", "counseling"],
  ["I feel hopeless", "counseling"],
  ["I can't keep food down", "acute-care"],
  ["I keep throwing up", "acute-care"],
  ["my head is pounding and I feel sick", "acute-care"],
  ["can someone come to me for medical help tonight", "health-34"],
  ["where can I get naloxone", "hp-narcan"],
  ["need strips to check fentanyl", "fentanyl-strips"],
  ["my bike helmet is cracked", "free-helmet"],
  ["my helmat is broken", "free-helmet"],
  ["Where is Health 34?", "health-34"],
  ["Find Aggie Compass", "aggie-compass"],
  ["How do I reach the Love Lab?", "love-lab"],
  ["I need CARE Advocacy", "care"],
  ["Where is the Acute Care Clinic?", "acute-care"],
  ["Find the MU Community Freedge", "freedge"],
  ["Not food, but I need counseling", "counseling"],
  ["I want food but actually need a clinic", "acute-care"],
  ["I want to unalive myself", "counseling"],
  ["I have food poisoning", "acute-care"],
  ["I need food but my boyfriend is threatening me", "care"],
  ["Where do I get help for a sore throat?", "acute-care"],
  ["I need a wellness check", "health-34"],
  ["Can I pay what I can for a meal?", "aggie-eats"],
];

const unrelated = [
  "my helmet is broken", "I killed time with my boyfriend", "I liked my boyfriend",
  "I'm cooked for finals", "I am hungry for knowledge", "my phone is sick",
  "I need a food truck code review", "this book is depressing", "I want to crash a party",
  "I need Food Truck app code review",
];

test("abbreviations, implication, phrase structure, and typos route to the intended service", () => {
  for (const [query, expected] of cases) assert.equal(searchEnglish(query)[0]?.id, expected, query);
});

test("literal and figurative false positives are suppressed", () => {
  for (const query of unrelated) {
    const hits = searchEnglish(query).map((hit) => hit.id);
    if (query.includes("helmet")) assert.deepEqual(hits, ["free-helmet"], query);
    else assert.deepEqual(hits, [], query);
    assert.equal(classifyEnglishRisk(query), null, query);
  }
});

test("contextual crisis slang is handled without treating every mention as an emergency", () => {
  assert.equal(classifyEnglishRisk("I want to unalive myself"), "self-harm");
  assert.equal(classifyEnglishRisk("A video explained the word unalive"), null);
  assert.equal(searchEnglish("A video explained the word unalive").length, 0);
});

test("symptom language does not leak into free-food results", () => {
  for (const query of ["I can't keep food down", "I have food poisoning", "I feel sick after eating"]) {
    const ids = searchEnglish(query).map((hit) => hit.id);
    assert.equal(ids[0], "acute-care", query);
    for (const id of ["aggie-eats", "pantry", "freedge", "aggie-compass"]) assert.ok(!ids.includes(id), `${query}: ${id}`);
  }
});
