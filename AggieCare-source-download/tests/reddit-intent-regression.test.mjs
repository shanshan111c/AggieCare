import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { classifyEnglishRisk, searchEnglish } from "../app/english-search.ts";

const corpus = JSON.parse(readFileSync(new URL("../data/reddit-intent-samples.json", import.meta.url), "utf8"));

test("public-discussion-derived paraphrases route to the intended service", () => {
  assert.ok(corpus.samples.length >= 30);
  for (const sample of corpus.samples) {
    assert.ok(sample.source.startsWith("https://www.reddit.com/r/UCDavis/"));
    assert.equal(searchEnglish(sample.query)[0]?.id, sample.expected, sample.query);
  }
});

test("short, incomplete violence language gets an urgent safety route, not a blank search", () => {
  for (const query of ["I kill boy", "I killed boy", "I want to kill boy", "I would like to kill someone"]) {
    assert.equal(classifyEnglishRisk(query), "harm-to-others", query);
    assert.deepEqual(searchEnglish(query), [], query);
  }
  assert.equal(classifyEnglishRisk("I might hurt someone"), "harm-concern");
  assert.equal(classifyEnglishRisk("I kill boy in a video game"), null);
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /englishRisk === "harm-to-others" && <div className="crisis-banner danger-banner"/);
  assert.match(page, /href="tel:911"/);
});
