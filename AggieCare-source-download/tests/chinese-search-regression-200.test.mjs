import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { isMentalCrisisQuery } from "../app/resource-patches.ts";
import { englishCrisisQuery, searchEnglish } from "../app/english-search.ts";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const source = `${page.slice(0, page.indexOf("export default function Home()"))}\nexport { resources, queryTerms, queryProfile, matchScore, matchesSearchIntent, isEnglishQuery };`;
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const engine = {};
const pageRequire = createRequire(new URL("../app/page.tsx", import.meta.url));
runInNewContext(compiled, { exports: engine, require: (name) => pageRequire(name === "./english-search" ? "./english-search.ts" : name), console, process, Date, Intl, Map, Set, RegExp, Math, Array, String, Object, Number, Boolean });

// Hand-labelled, original utterances. Each row tests a useful resource or a
// negative example; no real student queries or personal data are included.
const cases = [
  ["我现在很饿", ["aggie-eats", "pantry", "freedge"], ["counseling", "care", "acute-care"]],
  ["饿死了有饭吗", ["aggie-eats", "pantry", "freedge"], ["counseling"]],
  ["干饭的地方在哪", ["aggie-eats", "pantry", "freedge"], ["counseling"]],
  ["想白嫖一顿热饭", ["aggie-eats"], ["counseling", "care"]],
  ["今天有免费热饭吗", ["aggie-eats"], ["counseling"]],
  ["我想吃反", ["aggie-eats", "pantry"], ["counseling"]],
  ["没有钱买午饭", ["aggie-eats", "pantry", "aggie-compass"], ["counseling"]],
  ["哪里能领菜", ["pantry", "fruit-veggie-compass"], ["care"]],
  ["想领免费蔬菜", ["pantry", "fruit-veggie-compass"], ["care"]],
  ["晚上食堂关了还有免费吃的吗", ["freedge"], ["care", "counseling"]],
  ["社区冰箱在哪里", ["freedge"], ["care"]],
  ["哪里能拿罐头食品", ["pantry", "freedge"], ["counseling"]],
  ["我这个月要吃土了房租交不起", ["aggie-compass"], ["counseling", "acute-care"]],
  ["房租付不起了", ["aggie-compass"], ["counseling"]],
  ["芳租交不起", ["aggie-compass"], ["counseling"]],
  ["今晚没地方住", ["aggie-compass"], ["counseling"]],
  ["我想申请食物劵", ["aggie-compass"], ["care"]],
  ["CalFresh怎么申请", ["aggie-compass"], ["care"]],
  ["我肚子疼得厉害", ["acute-care"], ["aggie-eats", "counseling"]],
  ["膝盖破了", ["acute-care"], ["counseling", "free-helmet"]],
  ["膝蓋擦傷了", ["acute-care"], ["counseling"]],
  ["我摔破膝盖了", ["acute-care"], ["counseling"]],
  ["膝盖流血了", ["acute-care"], ["counseling"]],
  ["脚踝扭伤了", ["acute-care"], ["counseling"]],
  ["手腕骨折了", ["acute-care"], ["counseling"]],
  ["我肚子滕", ["acute-care"], ["aggie-eats", "counseling"]],
  ["胃疼还想吐", ["acute-care"], ["aggie-eats", "counseling"]],
  ["发烧了能去哪里看", ["acute-care"], ["aggie-eats", "counseling"]],
  ["吐了一整夜", ["acute-care"], ["aggie-eats", "counseling"]],
  ["我需要看医生", ["acute-care"], ["aggie-eats"]],
  ["晚上生病了有人能来吗", ["health-34"], ["aggie-eats"]],
  ["半夜不舒服能上门帮忙吗", ["health-34"], ["aggie-eats"]],
  ["我现在emo了想找人聊聊", ["counseling"], ["aggie-eats", "love-lab"]],
  ["我emo了", ["counseling"], ["aggie-eats", "love-lab"]],
  ["emo", ["counseling"], ["aggie-eats", "love-lab"]],
  ["EMO", ["counseling"], ["aggie-eats", "love-lab"]],
  ["emo了", ["counseling"], ["aggie-eats", "love-lab"]],
  ["我破防了", ["counseling"], ["aggie-eats", "care"]],
  ["穷到吃土了", ["aggie-compass"], ["counseling", "acute-care"]],
  ["姨妈巾哪里拿", ["love-lab", "wrrc-pharmacy"], ["counseling"]],
  ["破防了压力很大想找人说话", ["counseling"], ["aggie-eats"]],
  ["我心里咨询一下", ["counseling"], ["aggie-eats"]],
  ["焦虑到睡不着", ["counseling"], ["aggie-eats"]],
  ["我想死", ["counseling"], ["aggie-eats", "love-lab"]],
  ["我有自杀的念头", ["counseling"], ["aggie-eats"]],
  ["前男友一直跟踪我", ["care"], ["love-lab", "aggie-eats"]],
  ["男朋友打我我不安全", ["care"], ["love-lab", "aggie-eats"]],
  ["被性骚扰了想找保密支持", ["care"], ["love-lab"]],
  ["我被强迫发生性关系", ["care"], ["love-lab"]],
  ["哪里能领套套", ["love-lab", "love-lab-bag"], ["care", "counseling"]],
  ["避孕淘在哪里拿", ["love-lab", "love-lab-bag"], ["care"]],
  ["哪里有卫身巾", ["love-lab", "wrrc-pharmacy"], ["counseling"]],
  ["来姨妈了没有卫生巾", ["love-lab", "wrrc-pharmacy"], ["counseling"]],
  ["想拿免费棉条", ["love-lab", "wrrc-pharmacy"], ["counseling"]],
  ["有纳洛同吗", ["hp-narcan"], ["counseling"]],
  ["纳落酮哪里领", ["hp-narcan"], ["counseling"]],
  ["芬太尼检测纸哪里拿", ["fentanyl-strips"], ["counseling"]],
  ["我的头亏坏了", ["free-helmet"], ["counseling", "love-lab"]],
  ["骑车头盔裂了", ["free-helmet"], ["counseling"]],
  ["我需要免费安全帽", ["free-helmet"], ["care"]],
  ["我不饿只是肚子疼", ["acute-care"], ["aggie-eats", "pantry"]],
  ["我不是想找饭是想看医生", ["acute-care"], ["aggie-eats", "pantry"]],
  ["我没想自杀但现在发烧", ["acute-care"], ["counseling", "aggie-eats"]],
  ["今天比赛打破防线了", [], ["counseling", "care"]],
  ["我写代码写到破防了", [], ["counseling", "care"]],
  ["社死了手机屏幕碎了", [], ["counseling", "acute-care"]],
  ["我想给朋友买头盔", ["free-helmet"], ["counseling"]],
  ["我想吐槽一下老师", [], ["acute-care", "health-34"]],
  ["我用emo表情包", [], ["counseling", "care"]],
  ["膝盖护具破了", [], ["acute-care", "counseling"]],
  ["自行车轮胎破了", [], ["acute-care", "counseling"]],
  ["我去干饭不是找心理咨询", ["aggie-eats"], ["counseling"]],
];

function variant(query, round) {
  switch (round % 5) {
    case 1: return query;
    case 2: return `  ${query}  `;
    case 3: return `${query}？`;
    case 4: return query.replaceAll(" ", "　");
    default: return query.replaceAll("吗", "嘛");
  }
}

function ids(query) {
  if (engine.isEnglishQuery(query, "zh")) return searchEnglish(query).map((hit) => hit.id);
  const terms = engine.queryTerms(query), profile = engine.queryProfile(query);
  return engine.resources.map((resource) => ({ id: resource.id, score: engine.matchScore(resource, terms, profile), resource }))
    .filter((item) => engine.matchesSearchIntent(item.resource, query, item.score, profile))
    .sort((a, b) => b.score - a.score).map((item) => item.id);
}

test(`200 rounds of ${cases.length} labelled Chinese search queries`, () => {
  assert.ok(cases.length >= 50);
  for (let round = 1; round <= 200; round++) {
    for (const [query, expected, excluded] of cases) {
      const hits = ids(variant(query, round));
      if (expected.length) assert.ok(expected.includes(hits[0]), `round ${round}: ${query} -> ${hits.slice(0, 8)}`);
      for (const id of excluded) assert.equal(hits.includes(id), false, `round ${round}: ${query} unexpectedly -> ${id}`);
    }
  }
});

test("Chinese crisis wording is contextual, not a meme or a negated thought", () => {
  for (const query of ["饿死了有饭吗", "写代码写到破防了", "社死了手机屏幕碎了", "我没想自杀但现在发烧"]) {
    assert.equal(isMentalCrisisQuery(query), false, query);
  }
  for (const query of ["我想死", "我有自杀的念头", "心理危机"]) {
    assert.equal(isMentalCrisisQuery(query), true, query);
  }
});

test("standalone emo works in any display language without a crisis alert", () => {
  for (const query of ["emo", "EMO", " emo "]) {
    assert.equal(engine.isEnglishQuery(query, "zh"), true, query);
    assert.equal(searchEnglish(query)[0]?.id, "counseling", query);
    assert.equal(englishCrisisQuery(query), false, query);
  }
  for (const query of ["demo", "emoji", "emotional support"]) {
    assert.equal(searchEnglish(query).some((hit) => hit.id === "counseling"), query === "emotional support", query);
  }
});
