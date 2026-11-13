import assert from "node:assert/strict";
import test from "node:test";
import { classifyEnglishRisk, searchEnglish } from "../app/english-search.ts";

const examples = [
  ["I have not eaten in two days", null, "aggie-eats"],
  ["My fridge is empty and I can't buy groceries", null, "pantry"],
  ["I don't have anywhere to sleep tonight", null, "aggie-compass"],
  ["I don't have a roof over my head", null, "aggie-compass"],
  ["I need to make it to payday without food", null, "aggie-eats"],
  ["I ran out of pads", null, "love-lab"],
  ["I need something to prevent pregnancy", null, "love-lab"],
  ["My partner forced me to have sex", "threatened-by-other", "care"],
  ["My ex keeps following me home", null, "care"],
  ["My boyfriend grabbed my throat", "threatened-by-other", "care"],
  ["I feel like disappearing", null, "counseling"],
  ["I don't want to wake up tomorrow", "self-harm", "counseling"],
  ["I need help not to hurt my boyfriend", "harm-concern", "counseling"],
  ["My boyfriend might kill himself", "harm-to-others", null],
  ["He is on the floor and not breathing", "harm-to-others", null],
  ["I hurt my boyfriend and he is bleeding", "harm-to-others", null],
  ["I killed my boyfriend in my dream", null, null],
  ["I did not hurt my boyfriend", null, null],
  ["I killed time with my boyfriend", null, null],
  ["I love my boyfriend", null, null],
  ["I need condoms for my boyfriend", null, "love-lab"],
  ["My boyfriend threatened to hurt me", "threatened-by-other", "care"],
  ["My boyfriend broke my heart", null, "counseling"],
  ["I am sick to my stomach", null, "acute-care"],
  ["I feel sick of my boyfriend", null, "counseling"],
  ["I need someone to talk to because I am scared", null, "counseling"],
];

test("implications and English sentence structure route without keyword collisions", () => {
  const failures = [];
  for (const [query, expectedRisk, expectedTop] of examples) {
    const actualRisk = classifyEnglishRisk(query);
    const actualTop = searchEnglish(query)[0]?.id || null;
    if (actualRisk !== expectedRisk || actualTop !== expectedTop) failures.push({ query, expectedRisk, actualRisk, expectedTop, actualTop });
  }
  assert.deepEqual(failures, []);
});
