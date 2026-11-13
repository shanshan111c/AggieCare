import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { searchEnglish } from "../app/english-search.ts";
import { additionalResourcePrompts } from "../app/resource-prompts.ts";

// Canonical needs are reviewed separately from the program's output. The
// random seed makes every failure reproducible, without a network request.
const core = [
  ["aggie-eats", "aggie eats", "aggie"], ["pantry", "the pantry", "pantry"],
  ["aggie-compass", "aggie compass", "compass"], ["freedge", "community freedge", "freedge"],
  ["acute-care", "acute care clinic", "clinic"], ["health-34", "health 34", "health"],
  ["counseling", "crisis counseling services", "counseling"], ["love-lab", "the love lab", "love"],
  ["hp-narcan", "health promotion narcan", "narcan"], ["fentanyl-strips", "fentanyl test strips", "fentanyl"],
  ["free-helmet", "free helmet pickup", "helmet"], ["care", "care advocacy", "advocacy"],
];
const extras = additionalResourcePrompts.map((profile) => {
  const phrase = profile.aliases.find((alias) => /\bsatellite\b/.test(alias)) || profile.aliases[0];
  const word = phrase.match(/\b(?:satellite|pantry|student|pharmacy|clothing|parent|condoms|reuse|professional|checkup|groceries|compass|fruit|veggie|coho|health|gender|love|printing|academic|snack|hair|diaper)\b/)?.[0];
  assert.ok(word, `Need typo-bearing word for ${profile.id}`);
  return [profile.id, phrase, word];
});
const cases = [...core, ...extras];
const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const region = page.split("const resources: Resource[] = [")[1].split("const guides = [")[0];
const literalIds = [...region.matchAll(/\bid: "([a-z0-9-]+)"/g)].map((match) => match[1]);
const satelliteIds = [...region.matchAll(/\["(satellite-[a-z0-9-]+)"/g)].map((match) => match[1]);

function typo(word, mode, index) {
  const position = 2 + index % (word.length - 2);
  if (mode === 0) return word.slice(0, position) + word.slice(position + 1);
  if (mode === 1) return word.slice(0, position) + "y" + word.slice(position);
  if (mode === 2 && position < word.length - 1) return word.slice(0, position) + word[position + 1] + word[position] + word.slice(position + 2);
  return word.slice(0, position) + (word[position] === "a" ? "e" : "a") + word.slice(position + 1);
}

test("every stored campus resource has a reviewed English need phrase", () => {
  const stored = new Set([...literalIds, ...satelliteIds]);
  assert.deepEqual([...stored].filter((id) => !cases.some(([target]) => target === id)), []);
  for (const [id, phrase] of cases) assert.ok(searchEnglish(phrase).some((hit) => hit.id === id), `${id}: ${phrase}`);
});

test("500 seeded random single-typo English queries preserve their intended resource", () => {
  let seed = 20261110;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
  const failures = [];
  for (let index = 0; index < 500; index++) {
    const [id, phrase, word] = cases[index < cases.length ? index : Math.floor(random() * cases.length)];
    const misspelling = typo(word, Math.floor(random() * 4), Math.floor(random() * 100));
    const query = phrase.replace(word, misspelling);
    if (!searchEnglish(query).some((hit) => hit.id === id)) failures.push({ id, query, expected: phrase });
  }
  assert.deepEqual(failures.slice(0, 30), [], `${failures.length}/500 failed`);
});
