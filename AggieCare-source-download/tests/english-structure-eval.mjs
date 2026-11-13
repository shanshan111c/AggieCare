import { classifyEnglishRisk, searchEnglish } from "../app/english-search.ts";

const cases = [];
const add = (query, risk, top = null) => cases.push({ query, risk, top });
const people = ["boyfriend", "girlfriend", "partner", "friend", "roommate", "someone"];
for (const person of people) {
  for (const verb of ["killed", "stabbed", "shot", "attacked", "hurt"]) add(`I ${verb} my ${person}`, "harm-to-others");
  for (const phrase of ["want to kill", "might hurt", "plan to attack", "will stab", "am going to kill"]) add(`I ${phrase} my ${person}`, "harm-to-others");
  for (const phrase of ["did not kill", "never killed", "don't want to kill"]) add(`I ${phrase} my ${person}`, null);
  add(`I killed my ${person} in a video game`, null);
  add(`I killed time with my ${person}`, null);
}
for (const person of ["boyfriend", "girlfriend", "partner", "roommate"]) {
  for (const phrase of ["threatened to kill", "wants to hurt", "will attack", "hit", "punched"]) add(`My ${person} ${phrase} me`, "threatened-by-other", "care");
}
for (const query of [
  "I killed my boyfriend", "I killed my boyfriend and need condoms", "I want to kill my boyfriend", "I might have killed my partner",
  "I took my boyfriend's life", "My partner isn't breathing because of me", "I hurt my boyfriend badly",
  "I may have poisoned my partner", "My boyfriend is bleeding after I attacked him",
]) add(query, "harm-to-others");
for (const query of [
  "I think I might do something terrible to my boyfriend", "I am afraid I could hurt someone",
  "I need help before I hurt him", "I can't stop thinking about killing my boyfriend",
]) add(query, "harm-concern", "counseling");
for (const query of [
  "My boyfriend threatened to kill me", "My partner is going to hurt me", "My ex said he would murder me",
  "My boyfriend hit me", "I was attacked by my partner", "My girlfriend tried to stab me",
]) add(query, "threatened-by-other", "care");
for (const query of [
  "I want to kill myself", "I might hurt myself", "I am suicidal", "I don't want to live",
  "I am thinking about self-harm", "I am scared I will hurt myself",
]) add(query, "self-harm", "counseling");
for (const query of [
  "I didn't kill my boyfriend", "I killed my boyfriend in a video game", "I killed time with my boyfriend",
  "My boyfriend and I talked about a murder mystery", "I need condoms for my boyfriend",
  "I said the line I killed my boyfriend in a class play", "I don't want to kill my boyfriend",
  "I killed my boyfriend's phone battery", "I have intrusive thoughts about my boyfriend but I do not intend to hurt him",
  "I killed my boyfriend at chess", "I killed my boyfriend in a play", "I was told to say I killed my boyfriend",
  "I could kill for a burger", "My boyfriend is killing me with laughter", "I want to kill my boyfriend's phone",
]) add(query, null);
for (const query of [
  "I tried to kill my boyfriend", "I almost killed my partner", "My boyfriend killed himself",
  "My partner is unconscious", "I ended my girlfriend's life",
]) add(query, "harm-to-others");
for (const query of [
  "I wanted to kill my boyfriend yesterday", "I am scared of my anger around my partner",
]) add(query, "harm-concern", "counseling");
for (const query of [
  "I need a free meal", "I cannot pay my rent", "I am having a panic attack", "My boyfriend broke up with me",
  "I need a condom", "My helmet broke", "I vomited", "My boyfriend is stalking me",
]) add(query, null);

const baseCases = [...cases];
for (const item of baseCases) {
  for (const wrapper of [
    (q) => `Please help. ${q}.`,
    (q) => `Right now, ${q}.`,
    (q) => `At UC Davis, ${q}.`,
    (q) => `I am asking because ${q.charAt(0).toLowerCase()}${q.slice(1)}.`,
  ]) cases.push({ ...item, query: wrapper(item.query) });
}

let riskCorrect = 0, topCorrect = 0;
const failures = [];
for (const item of cases) {
  const actualRisk = classifyEnglishRisk(item.query);
  const actualTop = searchEnglish(item.query)[0]?.id || null;
  const riskPass = actualRisk === item.risk;
  const topPass = !item.top || actualTop === item.top;
  riskCorrect += Number(riskPass); topCorrect += Number(topPass);
  if ((!riskPass || !topPass) && failures.length < 40) failures.push({ ...item, actualRisk, actualTop });
}
console.log(JSON.stringify({ cases: cases.length, riskAccuracy: riskCorrect / cases.length, expectedTopAccuracy: topCorrect / cases.length, failures }, null, 2));
