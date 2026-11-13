import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const source = `${page.slice(0, page.indexOf("export default function Home()"))}\nexport { resources, queryTerms, queryProfile, matchScore, matchesSearchIntent };`;
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const exports = {};
const pageRequire = createRequire(new URL("../app/page.tsx", import.meta.url));
const require = (name) => pageRequire(name === "./english-search" ? "./english-search.ts" : name);
runInNewContext(compiled, { exports, require, console, process, Date, Intl, Map, Set, RegExp, Math, Array, String, Object, Number, Boolean });

function ids(query) {
  const terms = exports.queryTerms(query), profile = exports.queryProfile(query);
  return exports.resources.map((resource) => ({ id: resource.id, score: exports.matchScore(resource, terms, profile), resource }))
    .filter((item) => exports.matchesSearchIntent(item.resource, query, item.score, profile))
    .sort((a, b) => b.score - a.score).map((item) => item.id);
}

test("reviewed Chinese and Spanish typo variants retain their service intent", () => {
  for (const [query, expected] of [
    ["我想吃反", "aggie-eats"],
    ["我需要心里咨询", "counseling"],
    ["哪里有卫身巾", "love-lab"],
    ["我肚子滕", "acute-care"],
    ["necesito comdia", "pantry"],
  ]) assert.ok(ids(query).includes(expected), `${query}: ${ids(query).slice(0, 8).join(", ")}`);
});

test("a Chinese hunger query does not leak into unrelated support", () => {
  const results = ids("我现在很饿");
  assert.ok(results.includes("aggie-eats"));
  assert.equal(results.some((id) => id.startsWith("satellite-") || id.startsWith("fruit-veggie-")), false, results.slice(0, 20).join(", "));
  for (const unrelated of ["care", "counseling", "acute-care", "love-lab", "hp-narcan", "free-helmet"]) {
    assert.equal(results.includes(unrelated), false, `${unrelated}: ${results.slice(0, 20).join(", ")}`);
  }
});

test("a Chinese request for a hot meal prioritizes prepared food", () => {
  const results = ids("我想吃热饭");
  assert.equal(results[0], "aggie-eats", results.slice(0, 8).join(", "));
  assert.equal(results.includes("satellite-hart"), false, results.slice(0, 20).join(", "));
});
