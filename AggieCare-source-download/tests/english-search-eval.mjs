import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { performance } from "node:perf_hooks";
import ts from "typescript";

// Source-grounded, original test utterances: wording is derived from UC Davis
// Aggie Compass, SHCS Love Lab/Counseling, and CARE service descriptions.
// No private student messages or website prose are copied into this fixture.
const frames = [
  (need) => `I need help with ${need}.`,
  (need) => `Where can I find ${need} at UC Davis?`,
  (need) => `Can someone point me to ${need} on campus?`,
  (need) => `I am dealing with ${need} right now.`,
  (need) => `What campus resource can help with ${need}?`,
  (need) => `Is there walk-in support for ${need}?`,
  (need) => `A friend asked me about ${need}.`,
  (need) => `Please show me where to get ${need}.`,
  (need) => `Does UC Davis offer help for ${need}?`,
  (need) => `I am looking for nearby options for ${need}.`,
];

const themes = {
  food: [
    "free food", "a hot meal", "lunch with no money", "something to eat", "being hungry",
    "free groceries", "a food pantry", "fresh produce", "free snacks", "the AggieEats truck",
    "the ASUCD Pantry", "a community fridge", "food after hours", "canned food", "a meal today",
    "food insecurity", "a free dinner", "low-cost meals", "vegetables for free", "food on campus",
    "an open food truck", "a student pantry", "groceries without paying", "a free refrigerator", "food when the pantry is closed",
  ].map((need) => ({ need, allowed: ["aggie-eats", "pantry", "freedge", "aggie-compass"] })),
  basic: [
    "basic needs support", "emergency housing", "rent assistance", "being homeless", "housing insecurity",
    "a place to stay", "help paying rent", "financial hardship", "an emergency grant", "CalFresh application help",
    "SNAP benefits", "an EBT card", "AggieFresh", "no money for essentials", "case management",
    "a security deposit", "temporary shelter", "rapid rehousing", "economic crisis help", "basic needs assistance",
    "free toiletries", "soap and hygiene supplies", "help with living costs", "unstable housing", "financial support for students",
  ].map((need) => ({ need, allowed: ["aggie-compass", "pantry"] })),
  love: [
    ...["free condoms", "safer sex supplies", "dental dams", "water-based lube", "silicone lubricant", "birth control information", "STI protection", "period pads", "tampons", "a condom for my boyfriend", "protection for a hookup", "sex with my girlfriend", "an internal condom", "non-latex condoms", "sexual health products"].map((need) => ({ need, allowed: ["love-lab"] })),
    ...["sexual assault support", "a stalking situation", "dating violence", "an abusive boyfriend", "confidential survivor advocacy"].map((need) => ({ need, allowed: ["care"] })),
    ...["a painful breakup", "relationship anxiety", "heartbreak", "feeling lonely after a breakup", "emotional distress about my partner"].map((need) => ({ need, allowed: ["counseling", "health-34"] })),
  ],
  mental: [
    "a panic attack", "feeling depressed", "anxiety that will not stop", "crying all day", "suicidal thoughts",
    "wanting to hurt myself", "thoughts of self-harm", "feeling hopeless", "mental health counseling", "someone to talk to",
    "a same-day crisis appointment", "therapy", "emotional overwhelm", "severe stress", "grief",
    "loneliness", "not wanting to live", "fear that I might kill myself", "a mental breakdown", "mental health help tonight",
    "a counselor after hours", "feeling unsafe with myself", "being unable to cope", "a friend in mental crisis", "a crisis conversation",
  ].map((need) => ({ need, allowed: ["counseling", "health-34"] })),
};

const cases = Object.entries(themes).flatMap(([theme, seeds]) => seeds.flatMap(({ need, allowed }) => frames.map((frame, variant) => ({ theme, query: frame(need), allowed, variant }))));
if (cases.length !== 1000 || new Set(cases.map((item) => item.query)).size !== 1000) throw new Error("Expected 1,000 unique English sentences");

function loadLegacySearch() {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const prefix = page.slice(0, page.indexOf("export default function Home()"));
  const source = `${prefix}\nexport { resources, queryTerms, queryProfile, matchScore, matchesSearchIntent, statusFor, resolveResource };`;
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const pageRequire = createRequire(new URL("../app/page.tsx", import.meta.url));
  const require = (name) => pageRequire(name === "./english-search" ? "./english-search.ts" : name);
  runInNewContext(compiled, { exports, require, console, process, Date, Intl, Map, Set, RegExp, Math, Array, String, Object, Number, Boolean });
  return exports;
}

const mode = process.argv[2] || "legacy";
const legacy = loadLegacySearch();
const engine = mode === "new" ? await import("../app/english-search.ts") : legacy;
const allResources = legacy.resources;
const referenceTime = new Date("2026-11-06T19:00:00Z");
const openById = new Map(allResources.map((resource) => [resource.id, legacy.statusFor(legacy.resolveResource(resource, referenceTime).hours, referenceTime).open]));
const byTheme = {};
let correctTop = 0, precisionSum = 0, totalMs = 0;
const failures = [];
for (const item of cases) {
  const started = performance.now();
  let ids;
  if (mode === "new") ids = engine.searchEnglish(item.query).sort((a, b) => Number(openById.get(b.id)) - Number(openById.get(a.id)) || b.score - a.score).map((result) => result.id);
  else {
    const terms = engine.queryTerms(item.query);
    const profile = engine.queryProfile(item.query);
    ids = allResources.map((resource) => ({ id: resource.id, score: engine.matchScore(resource, terms, profile), resource }))
      .filter((entry) => engine.matchesSearchIntent(entry.resource, item.query, entry.score, profile))
      .sort((a, b) => Number(openById.get(b.id)) - Number(openById.get(a.id)) || b.score - a.score).map((entry) => entry.id);
  }
  totalMs += performance.now() - started;
  const topGood = item.allowed.includes(ids[0]);
  const precision = ids.length ? ids.filter((id) => item.allowed.includes(id)).length / ids.length : 0;
  correctTop += Number(topGood); precisionSum += precision;
  const group = byTheme[item.theme] ||= { count: 0, top1: 0, precision: 0 };
  group.count++; group.top1 += Number(topGood); group.precision += precision;
  if ((!topGood || precision < 1) && failures.length < 40) failures.push({ query: item.query, expected: item.allowed, actual: ids });
}
console.log(JSON.stringify({ mode, cases: cases.length, top1: correctTop / cases.length, precision: precisionSum / cases.length, meanMs: totalMs / cases.length, totalMs, byTheme: Object.fromEntries(Object.entries(byTheme).map(([key, value]) => [key, { top1: value.top1 / value.count, precision: value.precision / value.count }])), failures }, null, 2));
