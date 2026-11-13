import assert from "node:assert/strict";
import test from "node:test";
import { searchEnglish } from "../app/english-search.ts";
import { variant } from "./english-daily-1000.test.mjs";

// 50 independently reviewed need statements × 20 display/context variants.
// Sources informed phrasing, but these are paraphrases, not scraped personal posts.
const cases = [
  ["clothes", "aggie-reuse"], ["free clothes", "aggie-reuse"],
  ["I need a jacket", "aggie-reuse"], ["where can I find shoes", "aggie-reuse"],
  ["thrift store", "aggie-reuse"], ["cheap outfits", "aggie-reuse"],
  ["I need clothing for an interview", "lsa-professional-closet"],
  ["I cannot afford winter clothes", "aggie-reuse"],
  ["where can I get a free shirt", "aggie-reuse"],
  ["I need a binder to affirm my gender", "lgbtq-closet"],
  ["I need food", "aggie-eats"], ["free lunch", "aggie-eats"],
  ["I need groceries", "pantry"], ["where is the pantry", "pantry"],
  ["I need food stamps", "aggie-compass"], ["I cannot pay rent", "aggie-compass"],
  ["I am sleeping in my car", "aggie-compass"],
  ["I feel sick", "acute-care"], ["my ankle hurts", "acute-care"],
  ["I keep vomiting", "acute-care"], ["I scraped my knee", "acute-care"],
  ["I have a fever", "acute-care"], ["my wrist looks fractured", "acute-care"],
  ["my bike has a flat tire", "bike-barn-checkup"],
  ["I am anxious", "counseling"], ["I feel depressed", "counseling"],
  ["I need counseling", "counseling"], ["I am spiraling", "counseling"],
  ["I need someone to talk to", "counseling"],
  ["my partner hit me", "care"], ["I was sexually assaulted", "care"],
  ["my ex follows me", "care"],
  ["I need a condom", "love-lab"], ["I need period pads", "love-lab"],
  ["where can I get plan b", "love-lab"],
  ["I need narcan", "hp-narcan"], ["I need naloxone", "hp-narcan"],
  ["I need fentanyl test strips", "fentanyl-strips"],
  ["my bike helmet broke", "free-helmet"], ["I need a helmet", "free-helmet"],
  ["I want to donate clothes", null], ["I want to sell shoes", null],
  ["my phone is broken", null], ["food for thought", null],
  ["I love my boyfriend", null], ["my computer is sick", null],
  ["I need a mouse pad", null], ["I am hungry for success", null],
  ["food truck code review", null], ["my bike is sick", null],
];

test("1,000 additional English public-needs variants match human-labelled intent", () => {
  assert.equal(cases.length, 50);
  const failures = [];
  for (const [query, expected] of cases) {
    for (let i = 0; i < 20; i++) {
      const actual = searchEnglish(variant(query, i))[0]?.id ?? null;
      if (actual !== expected && !failures.some((failure) => failure.query === query)) failures.push({ query, expected, actual });
    }
  }
  assert.deepEqual(failures, []);
});
