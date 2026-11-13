import { classifyEnglishRisk, searchEnglish } from "../app/english-search.ts";

const cases = [
  ["I need foood", ["aggie-eats", "pantry", "freedge", "aggie-compass"]],
  ["Where can I find fodo?", ["aggie-eats", "pantry", "freedge", "aggie-compass"]],
  ["I am hungy", ["aggie-eats", "pantry", "freedge", "aggie-compass"]],
  ["I am starvng", ["aggie-eats", "pantry", "freedge", "aggie-compass"]],
  ["Where is the pantyr?", ["pantry"]],
  ["Can I get groceris?", ["pantry"]],
  ["I need grocerries", ["pantry"]],
  ["Is the foodpantry open?", ["pantry"]],
  ["I need housng support", ["aggie-compass"]],
  ["I need homless support", ["aggie-compass"]],
  ["Where do I apply for calfrehs?", ["aggie-compass"]],
  ["I need finacial help", ["aggie-compass"]],
  ["I need basicneeds support", ["aggie-compass"]],
  ["Can I get free condmos?", ["love-lab"]],
  ["I need lubricaant", ["love-lab"]],
  ["I need a tampn", ["love-lab"]],
  ["I need perod pads", ["love-lab"]],
  ["I want to fuck my boyfrend", ["love-lab"]],
  ["I need anxeity help", ["counseling"]],
  ["I need counsling", ["counseling"]],
  ["I feel depressd", ["counseling"]],
  ["I had a panick attack", ["counseling"]],
  ["I need mentlhealth help", ["counseling"]],
  ["I keep vomitting", ["acute-care"]],
  ["I have nausa", ["acute-care"]],
  ["I need a clinik", ["acute-care"]],
  ["I have a stomache ache", ["acute-care"]],
  ["Where can I get narkan?", ["hp-narcan"]],
  ["I need narcna", ["hp-narcan"]],
  ["I need fentanly checking", ["fentanyl-strips"]],
  ["My helmat broke", ["free-helmet"]],
  ["I need a helment", ["free-helmet"]],
  ["I am being stalkng", ["care"]],
  ["I experienced harrasment", ["care"]],
  ["I need help after an assualt", ["care"]],
  ["I feel good", []],
  ["I feel hopeless", ["counseling"]],
  ["I want a date", []],
  ["Where do I get a card?", []],
  ["I need a mood board", []],
  ["I killed time with my boyfriend", []],
  ["I like my boyfriend", []],
  ["I need a book", []],
  ["Where is the classroom?", []],
  ["I need wood for a project", []],
];

const riskCases = [
  ["I kiled my boyfriend", "harm-to-others"],
  ["I feel suicdal", "self-harm"],
  ["I liked my boyfriend", null],
  ["I killed time with my boyfriend", null],
  ["My boyfriend kiled me in a video game", null],
];

const failures = [];
for (const [query, allowed] of cases) {
  const actual = searchEnglish(query).map((hit) => hit.id);
  if (allowed.length ? !allowed.includes(actual[0]) : actual.length > 0) failures.push({ query, allowed, actual });
}
for (const [query, expected] of riskCases) {
  const actual = classifyEnglishRisk(query);
  if (actual !== expected) failures.push({ query, expected, actual });
}
console.log(JSON.stringify({ cases: cases.length + riskCases.length, passed: cases.length + riskCases.length - failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
