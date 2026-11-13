// Small, offline-first English intent router. Rules describe the student's need;
// generic words such as "free", "help", "friend" or "open" never create a match.
import { additionalResourcePrompts } from "./resource-prompts.ts";
export type EnglishSearchHit = { id: string; score: number };
export type EnglishRisk = "harm-to-others" | "threatened-by-other" | "self-harm" | "harm-concern" | null;

// Injury verbs need a human body part: "broke my knee" is medical, while
// "my knee pad broke" and "the chair leg broke" are damaged objects.
const physicalInjury = /\b(?:broke|hurt|injured|sprained|twisted|scraped|cut|fractured)\s+(?:(?:my|the|a)\s+)?(?:(?:left|right)\s+)?(?:knee|ankle|wrist|leg|arm|hand|foot|elbow|shoulder|head|hip)\b(?!\s+(?:pad|brace|guard|protector))|\b(?:(?:my|the|a)\s+)(?:(?:left|right)\s+)?(?:knee|ankle|wrist|leg|arm|hand|foot|elbow|shoulder|head|hip)\s+(?:(?:is|was|feels?|got|looks?|seems?)\s+)?(?:broken|hurts?|aching|injured|sprained|twisted|scraped|cut|bleeding|swollen|fractured)\b/;

const concepts: { pattern: RegExp; hits: EnglishSearchHit[] }[] = [
  { pattern: physicalInjury, hits: [{ id: "acute-care", score: 155 }] },
  { pattern: /\b(havent\s+eaten|have\s+not\s+eaten|didnt\s+eat|not\s+eaten\s+in\s+(?:a|one|two|three|four|five|several)\s+days|skipped\s+meals|nothing\s+to\s+eat|no\s+food\s+left|empty\s+fridge|fridge\s+is\s+empty)\b/, hits: [{ id: "aggie-eats", score: 125 }, { id: "freedge", score: 90 }, { id: "pantry", score: 80 }] },
  { pattern: /\b(grocer(?:y|ies)|food\s*pantry|fresh\s*produce|canned\s*goods)\b/, hits: [{ id: "pantry", score: 135 }, { id: "aggie-compass", score: 75 }, { id: "freedge", score: 60 }] },
  { pattern: /\b(?:free|fresh)\s+(?:produce|vegetables?|veggies|fruit)\b/, hits: [{ id: "pantry", score: 135 }, { id: "fruit-veggie-compass", score: 105 }, { id: "fruit-veggie-coho", score: 105 }, { id: "freedge", score: 70 }] },
  { pattern: /\b(aggie\s*eats|food\s*truck|hot\s*meal|prepared\s*meal|lunch\s*with\s*no\s*money|no\s*money\s*for\s*lunch)\b/, hits: [{ id: "aggie-eats", score: 120 }] },
  { pattern: /\b(asu?cd\s*pantry|the\s*pantry|student\s*pantry|food\s*pantry|free\s*grocer(?:y|ies)|grocer(?:y|ies)\s*without\s*paying)\b/, hits: [{ id: "pantry", score: 120 }, { id: "aggie-compass", score: 45 }] },
  { pattern: /\b(community\s*(?:fridge|freedge)|free\s*(?:fridge|refrigerator)|food\s*after\s*hours|after.hours\s*food|food\s*when\s*the\s*pantry\s*is\s*closed|overnight\s*food)\b/, hits: [{ id: "freedge", score: 130 }] },
  { pattern: /\b(food|hungr(?:y|ier)|hunger|starv(?:e|ing)|meals?|eat|eating|grocer(?:y|ies)|produce|snacks?|dinner|lunch|vegetables|canned\s*food|food\s*insecurity|something\s*to\s*eat)\b/, hits: [{ id: "aggie-eats", score: 55 }, { id: "pantry", score: 55 }, { id: "freedge", score: 50 }, { id: "aggie-compass", score: 40 }] },
  { pattern: /\b(basic\s*needs|cal\s*fresh|aggie\s*fresh|snap(?:\s*benefits?)?|ebt|case\s*management|assistance\s*request|economic\s*crisis|emergency\s*grant|financial\s*(?:support|hardship|assistance|aid|help)|living\s*costs|no\s*money\s*for\s*essentials)\b/, hits: [{ id: "aggie-compass", score: 120 }] },
  { pattern: /\bfood\s+stamps?\b/, hits: [{ id: "aggie-compass", score: 150 }] },
  { pattern: /\b(hous(?:e|ing)|homeless(?:ness)?|unhoused|rent|shelter|security\s*deposit|rapid\s*rehousing|place\s*to\s*stay|unstable\s*housing)\b/, hits: [{ id: "aggie-compass", score: 125 }] },
  { pattern: /\b(?:no\s+roof\s+over\s+my\s+head|dont\s+have\s+a\s+roof\s+over\s+my\s+head|dont\s+have\s+anywhere\s+to\s+sleep|nowhere\s+to\s+sleep|need\s+(?:a\s+)?place\s+to\s+sleep|sleeping\s+outside)\b/, hits: [{ id: "aggie-compass", score: 130 }] },
  { pattern: /\b(toiletr(?:y|ies)|soap|shampoo|deodorant|toothpaste|toothbrush|hygiene\s*(?:items?|supplies|products?)|basic\s*essentials)\b/, hits: [{ id: "aggie-compass", score: 90 }, { id: "pantry", score: 75 }] },
  { pattern: /\b(condoms?|contraception|birth\s*control|safer?\s*sex|sexual\s*health\s*products?|(?:sex|fuck)\s*(?:with\s*)?(?:my\s*)?(?:boyfriend|girlfriend|partner)|(?:boyfriend|girlfriend|partner|hookup)\s*(?:sex|condom)|hook\s*up|hookup|dental\s*dams?|lube|lubricant|non.latex|sti\s*protection|std\s*protection|internal\s*condom|period\s*(?:pads?|products?|supplies)|pads?\s*(?:for\s*my\s*)?period|tampons?|menstrual\s*products?)\b/, hits: [{ id: "love-lab", score: 125 }] },
  { pattern: /\b(pads?|prevent\s+pregnancy|avoid\s+pregnancy|ran\s+out\s+of\s+pads?)\b/, hits: [{ id: "love-lab", score: 125 }] },
  { pattern: /\b(sexual\s*assault|(?:after|experienced|survived)\s+(?:an?\s+)?assault|rape|stalk(?:ing|er|ed)|harass(?:ment|ed)|dating\s*violence|domestic\s*violence|intimate\s*partner\s*violence|abusive\s*(?:boyfriend|girlfriend|partner)|relationship\s*abuse|survivor\s*advocacy|victim\s*advocacy|unsafe\s*(?:around|with)\s*(?:my\s*)?(?:boyfriend|girlfriend|partner)|scared\s*of\s*(?:my\s*)?(?:boyfriend|girlfriend|partner)|(?:boyfriend|girlfriend|partner)\s*(?:hit|hits|hurt|threatens?)\s*me|title\s*ix)\b/, hits: [{ id: "care", score: 140 }] },
  { pattern: /\b(?:i\s+)?(?:need|want|looking\s+for|seeking)\s+(?:some\s+)?(?:help|support|resources?|advice)\s+(?:with|for|after|about)\s+(?:sexual\s+|interpersonal\s+|relationship\s+|domestic\s+)?violence\b|\bsomeone\s+(?:hit|hurt|attacked|threatened)\s+me\b/, hits: [{ id: "care", score: 145 }] },
  { pattern: /\b(?:my\s+)?(?:boyfriend|girlfriend|partner|ex)\s+(?:forced\s+me\s+to\s+have\s+sex|grabbed\s+my\s+throat|keeps?\s+following\s+me|wont\s+stop\s+following\s+me)\b/, hits: [{ id: "care", score: 150 }] },
  { pattern: /\b(?:my\s+)?(?:boyfriend|girlfriend|partner|ex)\s+(?:is\s+)?(?:controlling|coercive)\b.{0,60}\b(?:wont|will\s+not|doesnt|does\s+not)\s+let\s+me\s+leave\b/, hits: [{ id: "care", score: 155 }] },
  { pattern: /\b(?:my\s+)?(?:boyfriend|girlfriend|partner|ex)\s+(?:(?:will\s+not|wont|doesnt|does\s+not)\s+let\s+me\s+leave|(?:keeps?\s+)?(?:follows?|following|stalks?|stalking)\s+me)\b|\b(?:i\s+(?:was|have\s+been)\s+)?sexually\s+assault(?:ed)?\b/, hits: [{ id: "care", score: 150 }] },
  { pattern: /\b(?:my\s+)?(?:boyfriend|girlfriend|partner|ex)\s+(?:took|takes|checks?|controls?)\s+my\s+phone\b.{0,70}\b(?:wont|will\s+not|doesnt|does\s+not)\s+let\s+me\s+leave\b/, hits: [{ id: "care", score: 160 }] },
  { pattern: /\bmy\s+(?:ex|boyfriend|girlfriend|partner)\s+(?:keeps?\s+)?(?:following|follows)\s+me\s+(?:to|around)\s+(?:class|campus|my\s+dorm)\b/, hits: [{ id: "care", score: 150 }] },
  { pattern: /\bi\s+(?:(?:was|have\s+been)\s+)?(?:raped|sexually\s+assaulted)\b/, hits: [{ id: "care", score: 155 }] },
  { pattern: /\b(painful\s*breakup|heartbreak|relationship\s*anxiety|lonely\s*after\s*a\s*breakup|emotional\s*distress\s*about\s*(?:my\s*)?partner|breakup|loneliness|grief|feel(?:ing)?\s*lonely)\b/, hits: [{ id: "counseling", score: 115 }] },
  { pattern: /\b(broke\s+my\s+heart|sick\s+of\s+(?:my\s+)?(?:boyfriend|girlfriend|partner)|feel\s+like\s+disappearing)\b/, hits: [{ id: "counseling", score: 145 }] },
  { pattern: /\b(?:i\s+am\s+)?spiraling\b/, hits: [{ id: "counseling", score: 115 }] },
  { pattern: /\b(suicid(?:e|al)|self.harm|hurt\s*myself|kill\s*myself|not\s*wanting\s*to\s*live|want\s*to\s*die|thoughts?\s*of\s*(?:self.harm|suicide)|mental\s*crisis|same\s*day\s*crisis\s*appointment|panic\s*attack|mental\s*breakdown|unsafe\s*with\s*myself|unable\s*to\s*cope|crisis\s*conversation|feel(?:ing)?\s*hopeless)\b/, hits: [{ id: "counseling", score: 140 }, { id: "health-34", score: 75 }] },
  { pattern: /\b(emo|mental\s*health|counsel(?:ing|or|lor)|therap(?:y|ist)|depress(?:ed|ion)|anxiet(?:y|ies)|anxious|cry(?:ing)?|overwhelm(?:ed)?|severe\s*stress|someone\s*to\s*talk\s*to|emotional\s*(?:support|distress)|feel(?:ing)?\s*(?:sad|down|alone)|cannot\s*cope|can.t\s*cope)\b/, hits: [{ id: "counseling", score: 110 }, { id: "health-34", score: 55 }] },
  { pattern: /\b(after.hours\s*counsel(?:or|ing)|counsel(?:or|ing)\s*after\s*hours|mental\s*health\s*help\s*tonight|mental\s*support\s*at\s*night)\b/, hits: [{ id: "counseling", score: 130 }, { id: "health-34", score: 105 }] },
  { pattern: /\b(i\s*(?:would\s*like|want|need|am\s*going|m\s*gonna)\s*to\s*fuck\s*(?:myself\s*)?up|fuck\s*myself\s*up|mess\s*myself\s*up|ruin\s*myself|can.t\s*take\s*it|i\s*am\s*done)\b/, hits: [{ id: "counseling", score: 150 }, { id: "health-34", score: 80 }] },
  { pattern: /\b(vomit(?:ing)?|throw(?:ing)?\s*up|nausea|nauseous|nauseated|dizz(?:y|iness)|lightheaded|stomach\s*(?:pain|ache|hurts?)|abdominal\s*pain|fever|sick|ill|clinic|doctor|nurse|injur(?:y|ed)|sprain|rash|migraine|diarrhea|infection|asthma|pregnancy\s*test|sti\s*test(?:ing)?|std\s*test(?:ing)?|emergency\s*contraception)\b/, hits: [{ id: "acute-care", score: 125 }, { id: "health-34", score: 60 }] },
  { pattern: /\b(narcan|naloxone|opioid\s*overdose|overdose\s*reversal)\b/, hits: [{ id: "hp-narcan", score: 130 }] },
  { pattern: /\b(fentanyl\s*(?:test|checking|strip)|drug\s*checking|test\s*strips?)\b/, hits: [{ id: "fentanyl-strips", score: 130 }] },
  { pattern: /\b(helmet|bike\s*safety|bicycle\s*helmet|scooter\s*helmet)\b/, hits: [{ id: "free-helmet", score: 130 }] },
];

// Phrase frames encode implications and word relationships that a bag of keywords
// cannot express. Keep these distinct from direct service-name/keyword matches.
const implicationFrames: { pattern: RegExp; hits: EnglishSearchHit[] }[] = [
  // Concrete circumstances can imply the needed service without naming it.
  { pattern: /\b(?:my\s+)?(?:cabinets?|cupboards?)\s+(?:are|is)\s+(?:bare|empty)\b/, hits: [{ id: "pantry", score: 145 }, { id: "aggie-eats", score: 100 }] },
  { pattern: /\b(?:my\s+)?last\s+meal\s+was\s+(?:yesterday|days?\s+ago)\b/, hits: [{ id: "aggie-eats", score: 145 }, { id: "pantry", score: 85 }] },
  { pattern: /\b(?:my\s+)?period\s+(?:started|came|arrived)\b.{0,45}\b(?:nothing|no\s+supplies|unprepared|without\s+(?:anything|supplies))\b/, hits: [{ id: "love-lab", score: 150 }] },
  { pattern: /\b(?:he|she|they|someone)\s+(?:keeps?\s+)?(?:waits?|shows?\s+up|follows?)\b.{0,45}\b(?:outside\s+my\s+(?:dorm|class|home)|after\s+i\s+(?:asked|told)\s+(?:him|her|them)\s+to\s+(?:leave|stop))\b|\b(?:my\s+)?(?:boyfriend|girlfriend|partner|ex)\s+(?:checks?\s+my\s+phone|controls?\s+where\s+i\s+go)\b.{0,45}\b(?:wont|will\s+not|doesnt|does\s+not)\s+let\s+me\s+leave\b/, hits: [{ id: "care", score: 160 }] },
  // Public student discussions frequently describe a situation rather than
  // naming a campus service. These frames are paraphrased, not copied posts.
  { pattern: /\b(?:food|groceries)\b.{0,40}\b(?:or|and)\b.{0,20}\b(?:hygiene|toiletries|soap)\b|\b(?:hygiene|toiletries|soap)\b.{0,40}\b(?:or|and)\b.{0,20}\b(?:food|groceries)\b/, hits: [{ id: "pantry", score: 145 }, { id: "aggie-compass", score: 100 }] },
  { pattern: /\b(?:weekend|saturday|sunday)\b.{0,35}\b(?:food|groceries|pantry|something\s+to\s+eat)\b|\b(?:food|groceries|pantry)\b.{0,35}\b(?:weekend|saturday|sunday)\b/, hits: [{ id: "pantry", score: 145 }, { id: "freedge", score: 95 }] },
  { pattern: /\b(?:live|living|sleep|sleeping|stay|staying)\s+in\s+(?:my|a|the)\s+car\b|\b(?:cant|cannot|wont\s+be\s+able\s+to)\s+afford\s+(?:my\s+|an?\s+)?(?:apartment|housing|rent)\b|\bno\s+safe\s+place\s+to\s+sleep\b|\bnowhere\s+to\s+(?:stay|sleep)\b/, hits: [{ id: "aggie-compass", score: 155 }] },
  { pattern: /\b(?:flashbacks?|trauma)\b.{0,55}\b(?:class|campus|sleep|help|support)\b|\b(?:depress(?:ed|ion)|mental\s+health)\b.{0,55}\b(?:cant|cannot)\s+get\s+out\s+of\s+bed\b|\b(?:counseling|therapy)\s+appointment\s+(?:was\s+)?cancel(?:led|ed)\b.{0,45}\b(?:worse|crisis|struggling)\b/, hits: [{ id: "counseling", score: 145 }, { id: "health-34", score: 55 }] },
  { pattern: /\b(?:cant|cannot|unable\s+to|dont\s+have\s+money\s+to)\s+(?:afford|pay\s+for)\s+(?:a\s+|my\s+)?(?:dinner|lunch|breakfast|meal|food)\b|\b(?:cupboard|fridge)\s+(?:is\s+)?(?:bare|empty)\b/, hits: [{ id: "aggie-eats", score: 125 }, { id: "pantry", score: 105 }, { id: "freedge", score: 90 }] },
  { pattern: /\b(?:need|looking\s+for|find)\s+(?:a\s+)?place\s+to\s+crash\s+(?:tonight|this\s+week|for\s+the\s+night)\b|\b(?:cant|cannot)\s+pay\s+(?:my\s+)?rent\b/, hits: [{ id: "aggie-compass", score: 145 }] },
  { pattern: /\b(?:plan\s*b|morning\s+after\s+pill|emergency\s+contraception|rubbers?\s+for\s+sex|no\s+(?:pads?|tampons?)\s+(?:for\s+my\s+)?period)\b|\bperiod\s+(?:started|came)\b.{0,35}\b(?:no|need|out\s+of)\s+(?:pads?|tampons?)\b/, hits: [{ id: "love-lab", score: 145 }] },
  { pattern: /\b(?:my\s+)?(?:boyfriend|girlfriend|partner|ex)\s+(?:forced\s+me\s+to\s+have\s+sex|grabbed\s+my\s+throat|keeps?\s+following\s+me(?:\s+around\s+campus)?)\b/, hits: [{ id: "care", score: 170 }] },
  { pattern: /\b(?:i\s+am\s+)?spiral(?:ing)?\b.{0,50}\b(?:need\s+someone\s+to\s+talk\s+to|cant\s+cope|need\s+help)\b|\b(?:i\s+)?(?:cant|cannot)\s+cope\b|\b(?:my\s+)?(?:boyfriend|girlfriend|partner)\s+broke\s+my\s+heart\b/, hits: [{ id: "counseling", score: 145 }] },
  { pattern: /\b(?:cant|cannot)\s+keep\s+food\s+down\b|\bhead\s+is\s+pounding\b|\bkeep\s+throwing\s+up\b/, hits: [{ id: "acute-care", score: 155 }, { id: "health-34", score: 70 }] },
  { pattern: /\b(?:my\s+)?stomach\s+(?:is\s+)?killing\s+me\b/, hits: [{ id: "acute-care", score: 155 }, { id: "health-34", score: 70 }] },
  { pattern: /\bfood\s+poisoning\b|\b(?:sick|nauseous|vomiting)\s+after\s+eating\b/, hits: [{ id: "acute-care", score: 155 }, { id: "health-34", score: 70 }] },
  { pattern: /\b(?:someone|somebody|a\s+nurse|medical\s+help)\s+(?:come|comes|visit|reach)\s+(?:to\s+)?me\b.{0,40}\b(?:medical|sick|ill|tonight|campus)\b|\b(?:medical|sick|ill)\b.{0,40}\b(?:someone|somebody|a\s+nurse)\s+(?:come|comes|visit|reach)\s+(?:to\s+)?me\b/, hits: [{ id: "health-34", score: 155 }] },
  { pattern: /\b(?:strips?|test)\s+to\s+(?:check|test)\s+(?:for\s+)?fentanyl\b/, hits: [{ id: "fentanyl-strips", score: 150 }] },
  { pattern: /\b(?:check|test)\s+(?:my\s+|these\s+)?(?:pills?|drugs?)\s+for\s+fentanyl\b/, hits: [{ id: "fentanyl-strips", score: 150 }] },
  { pattern: /\b(?:cracked|broken|damaged)\s+(?:bike\s+)?helmet\b|\b(?:bike\s+)?helmet\s+(?:is\s+)?(?:cracked|broken|damaged)\b/, hits: [{ id: "free-helmet", score: 150 }] },
];

// Very short queries lack enough syntax for clause analysis. These routes are
// deliberately narrow; e.g. "binder" alone is not treated as clothing.
const shortNeedRules: { pattern: RegExp; hits: EnglishSearchHit[] }[] = [
  { pattern: /^(?:free\s+)?(?:clothes|clothing|outfit|outfits|shoes|jacket|jackets|thrift)$/, hits: [{ id: "aggie-reuse", score: 155 }, { id: "lgbtq-closet", score: 90 }] },
  { pattern: /^(?:professional|interview|business)\s+(?:clothes|clothing|outfit|attire)$/, hits: [{ id: "aggie-reuse", score: 100 }] },
  { pattern: /^pantry$/, hits: [{ id: "pantry", score: 145 }] },
  { pattern: /^(?:i\s+need\s+(?:a\s+|the\s+)?|where\s+is\s+(?:a\s+|the\s+)?)pantry$/, hits: [{ id: "pantry", score: 145 }] },
  { pattern: /^(?:crash\s+tonight|car\s+sleeping|sleeping\s+in\s+car)$/, hits: [{ id: "aggie-compass", score: 145 }] },
];

// Exact campus-service names have stronger evidence than generic topic words.
// Aliases live here so the lexicon can be reviewed without adding synthetic
// thousands of near-duplicate prompts to the browser bundle.
const serviceLexicon: { id: string; aliases: RegExp[]; score: number }[] = [
  { id: "aggie-eats", aliases: [/\baggie\s*eats\b/, /\baggieeats\b/], score: 170 },
  { id: "pantry", aliases: [/\b(?:asucd|the)\s+pantry\b/], score: 170 },
  { id: "freedge", aliases: [/\b(?:mu\s+)?(?:community\s+)?freedge\b/], score: 170 },
  { id: "aggie-compass", aliases: [/\baggie\s+compass\b/], score: 170 },
  { id: "love-lab", aliases: [/\b(?:the\s+)?love\s+lab\b/], score: 170 },
  { id: "care", aliases: [/\bcare\s+(?:advocacy|office|uc\s+davis)\b/], score: 170 },
  { id: "counseling", aliases: [/\b(?:uc\s+davis\s+)?(?:crisis\s+)?counseling\s+services\b/], score: 170 },
  { id: "acute-care", aliases: [/\bacute\s+care\s+clinic\b/], score: 170 },
  { id: "health-34", aliases: [/\bhealth\s*34\b/], score: 170 },
  { id: "hp-narcan", aliases: [/\bhealth\s+promotion\s+narcan\b/], score: 170 },
  { id: "fentanyl-strips", aliases: [/\bfentanyl\s+test\s+strips?\b/], score: 170 },
  { id: "free-helmet", aliases: [/\b(?:free\s+)?helmet\s+pickup\b/], score: 170 },
];
// High-specificity phrases retained from the original resource lexicon. Broad
// words ("friend", "safe", "kill", "free") are deliberately not standalone keys.
const resourceTermLexicon: { id: string; phrases: string[]; score: number }[] = [
  { id: "aggie-eats", phrases: ["pay what you want", "pay what i can", "warm meal", "student meal"], score: 115 },
  { id: "pantry", phrases: ["free groceries", "fresh produce", "canned food", "food insecurity"], score: 120 },
  { id: "aggie-compass", phrases: ["housing help", "help paying rent", "case management", "financial support", "calfresh", "aggiefresh"], score: 120 },
  { id: "freedge", phrases: ["after hours food", "donated food", "community fridge", "open fridge"], score: 130 },
  { id: "acute-care", phrases: ["sore throat", "ear pain", "urgent care", "advice nurse"], score: 130 },
  { id: "health-34", phrases: ["late night sick", "wellness check", "mobile help", "campus response", "non emergency"], score: 120 },
  { id: "counseling", phrases: ["same day crisis", "talk to someone", "mental crisis", "i feel hopeless"], score: 130 },
  { id: "love-lab", phrases: ["unprotected sex", "free period products", "sex supplies", "birth control"], score: 130 },
  { id: "hp-narcan", phrases: ["reverse overdose", "opioid overdose", "free narcan"], score: 130 },
  { id: "fentanyl-strips", phrases: ["drug checking", "testing strips", "check drugs"], score: 130 },
  { id: "free-helmet", phrases: ["bike safety", "helmet hair", "bike barn"], score: 125 },
  { id: "care", phrases: ["survivor advocacy", "relationship abuse", "intimate partner violence", "title ix"], score: 135 },
];
const resourceTermPatterns = resourceTermLexicon.map(({ id, phrases, score }) => ({
  id, score, patterns: phrases.map((phrase) => new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`)),
}));
const searchRules = [...concepts, ...implicationFrames];
const resourcePromptPatterns = additionalResourcePrompts.map(({ id, broad, aliases, phrases }) => ({
  id, broad,
  aliases: aliases.map((phrase) => new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`)),
  phrases: phrases.map((phrase) => new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`)),
}));

const typoCorrections: Record<string, string> = {
  grocieries: "groceries", counceling: "counseling", anxity: "anxiety", depresion: "depression",
  kneee: "knee", therpy: "therapy", ankel: "ankle", stomache: "stomach",
  sexully: "sexually", deoderant: "deodorant",
  vomitting: "vomiting", nausa: "nausea", condomn: "condom", calfrsh: "calfresh",
  pantrie: "pantry", helment: "helmet", narkan: "narcan", fentinal: "fentanyl",
  // Safety-critical spellings are curated, never inferred from nearby ordinary words.
  kiled: "killed", suicdal: "suicidal",
  // Joined phrases are common on phones and should retain their original intent.
  foodpantry: "food pantry", basicneeds: "basic needs", mentlhealth: "mental health",
  lvoe: "love", lov: "love", loe: "love", narkn: "narcan", cloythes: "clothes", cltohes: "clothes",
};

// Explicit, versioned aliases; a slang word alone does not imply a clinical need.
const shortForms: Record<string, string> = {
  bf: "boyfriend", gf: "girlfriend", rn: "right now", pls: "please", plz: "please",
  im: "i am", idk: "i do not know", bc: "because", bcz: "because", btw: "by the way",
  wanna: "want to", gotta: "have to", cant: "cant", dont: "dont",
};

// A deliberately small vocabulary, not a fuzzy match against every result description.
// This keeps corrections local/offline and prevents incidental words from becoming hits.
const searchVocabulary = [
  "food", "hungry", "starving", "pantry", "groceries", "housing", "homeless", "calfresh", "financial",
  "condoms", "condom", "lubricant", "tampon", "period", "boyfriend", "girlfriend", "partner",
  "anxiety", "counseling", "depressed", "panic", "mental", "therapy", "vomiting", "nausea", "clinic", "stomach", "knee", "ankle", "wrist", "fractured",
  "narcan", "fentanyl", "helmet", "stalking", "harassment", "assault", "health", "aggie", "compass",
  "clothes", "clothing", "shoes", "jacket", "shirt", "binder", "interview", "attire", "reuse",
  "satellite", "community", "student", "parent", "diaper", "diapers", "toys", "pharmacy", "toiletries",
  "checkup", "diagnostics", "bicycle", "brakes", "tire", "produce", "vegetables", "fruit",
  "freedge", "advocacy", "crisis", "love", "pickup", "strips", "professional", "closet", "gender", "printing", "scantrons", "snack", "academic", "hair",
];
const vocabularySet = new Set(searchVocabulary);
// Real, intent-bearing words must not be "corrected" into a different need.
const protectedWords = new Set(["hopeless", "helpless", "feeling", "someone", "nothing", "lunch", "heartbreak", "sexual", "safety", "danger", "liked", "good", "mood", "date", "card", "wood", "boyfriends", "girlfriends", "partners", "friends", "roommates"]);
const vocabularyByPrefix = new Map<string, string[]>();
for (const word of searchVocabulary) {
  const prefix = word.slice(0, 2);
  vocabularyByPrefix.set(prefix, [...(vocabularyByPrefix.get(prefix) || []), word]);
}
const correctionCache = new Map<string, string>();

// Optimal-string-alignment distance catches a single adjacent swap as one typo.
function editDistance(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const rows = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = limit + 1;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let distance = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        distance = Math.min(distance, rows[i - 2][j - 2] + 1);
      }
      rows[i][j] = distance;
      rowMin = Math.min(rowMin, distance);
    }
    if (rowMin > limit && i >= b.length) return limit + 1;
  }
  return rows[a.length][b.length];
}

function correctWord(word: string) {
  if (shortForms[word]) return shortForms[word];
  if (typoCorrections[word]) return typoCorrections[word];
  if (word.length < 4 || vocabularySet.has(word) || protectedWords.has(word)) return word;
  const cached = correctionCache.get(word);
  if (cached) return cached;
  const candidates = vocabularyByPrefix.get(word.slice(0, 2)) || [];
  const limit = word.length >= 8 ? 2 : 1;
  let best = word;
  let bestDistance = limit + 1;
  let tied = false;
  for (const candidate of candidates) {
    const distance = editDistance(word, candidate, limit);
    if (distance < bestDistance) { best = candidate; bestDistance = distance; tied = false; }
    else if (distance === bestDistance) tied = true;
  }
  const result = bestDistance <= limit && !tied ? best : word;
  if (correctionCache.size >= 128) correctionCache.clear();
  correctionCache.set(word, result);
  return result;
}

function cleanEnglish(query: string) {
  return query.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9\s-]/g, " ").replace(/-/g, " ")
    .split(/\s+/).filter(Boolean).map(correctWord).join(" ");
}

const firstPersonViolence = /\b(?:i|we)\s+(?:(?:have|had|just|already|accidentally|almost|nearly)\s+){0,3}(?:killed|murdered|stabbed|shot|attacked|punched|hit|hurt|choked|strangled)\s+(?:(?:my|our|a|the)\s+)?(?:boyfriend|girlfriend|partner|ex|roommate|friend|him|her|them|someone|somebody|person|people)\b/;
const firstPersonThreat = /\b(?:i|we)\s+(?:(?:really|think\s+i|feel\s+like\s+i)\s+)?(?:want|intend|plan|might|may|could|will|gonna|going|about|need|would\s+like)\s+(?:to\s+)?(?:kill|murder|stab|shoot|hurt|attack|strangle)\s+(?:(?:my|our|a|the)\s+)?(?:boyfriend|girlfriend|partner|ex|roommate|friend|him|her|them|someone|somebody|person|people)\b|\b(?:i|we)\s+(?:am|are)\s+(?:going|about)\s+to\s+(?:kill|murder|stab|shoot|hurt|attack)\s+(?:(?:my|our|a|the)\s+)?(?:boyfriend|girlfriend|partner|ex|roommate|friend|him|her|them|someone|somebody|person|people)\b/;
const deniedViolence = /\b(?:i|we)\s+(?:didnt|did\s+not|never|havent|have\s+not|would\s+never|dont|do\s+not|wont|will\s+not)\s+(?:want\s+to\s+)?(?:kill|murder|stab|shoot|hurt|attack|killed|murdered|stabbed|shot|hurt|attacked)\b/;
const fictionalContext = /\b(?:video\s*game|board\s*game|at\s+chess|movie|novel|fiction|fictional|class\s*play|in\s+a\s+play|acting|dream|nightmare|hypothetical|quoted|quoting|told\s+to\s+say|in\s+a\s+story)\b/;
const selfHarm = /\b(?:i\s+(?:want|might|plan|need|am\s+going|going|will|would\s+like)\s+(?:to\s+)?(?:kill|hurt|harm|unalive)\s+myself|i\s+(?:(?:am|feel|feeling)\s+)?suicidal|suicidal\s+thoughts?|self\s*harm|not\s+wanting\s+to\s+live|want\s+to\s+die|unsafe\s+with\s+myself|dont\s+want\s+to\s+wake\s+up\s+tomorrow)\b/;
const victimThreat = /\b(?:my\s+)?(?:boyfriend|girlfriend|partner|ex|roommate|someone|somebody)\s+(?:(?:is|has|was)\s+)?(?:threaten(?:s|ed|ing)?\s+to|wants?\s+to|is\s+going\s+to|will|tried\s+to)\s+(?:kill|hurt|attack|stab|shoot)\s+(?:me|us|my\s+friend)\b|\b(?:my\s+)?(?:boyfriend|girlfriend|partner|ex|roommate)\s+(?:hit|hits|hurt|punched|choked|strangled|attacked|stabbed|shot)\s+me\b|\bi\s+was\s+(?:assaulted|attacked|raped)\s+by\s+(?:my\s+)?(?:boyfriend|girlfriend|partner|ex|roommate|someone)\b/;
const possiblePastViolence = /\bi\s+(?:might|may|could)\s+have\s+(?:killed|poisoned|stabbed|shot|seriously\s+hurt)\s+(?:my\s+)?(?:boyfriend|girlfriend|partner|ex|roommate|friend|someone|him|her|them)\b|\bi\s+(?:took|ended)\s+(?:my\s+)?(?:boyfriends|girlfriends|partners|friends|roommates|someone\s+elses)\s+life\b|\b(?:my\s+)?(?:boyfriend|girlfriend|partner|friend|roommate)\s+(?:isnt\s+breathing|is\s+unresponsive|is\s+unconscious|is\s+bleeding\s+badly|killed\s+himself|killed\s+herself|might\s+kill\s+himself)\b|\b(?:he|she|they|someone)\b.{0,40}\b(?:not\s+breathing|unconscious|unresponsive)\b/;
const violentConcern = /\bi\s+(?:am\s+afraid|worry|fear)\s+i\s+(?:might|could|may)\s+(?:kill|hurt|attack)\s+(?:my\s+)?(?:boyfriend|girlfriend|partner|friend|roommate|someone|him|her|them)\b|\bi\s+(?:think\s+i\s+might\s+do\s+something\s+terrible\s+to|cant\s+stop\s+thinking\s+about\s+(?:killing|hurting)|need\s+help\s+before\s+i\s+hurt|wanted\s+to\s+kill)\s+(?:my\s+)?(?:boyfriend|girlfriend|partner|friend|roommate|someone|him|her|them)\b|\bi\s+need\s+help\s+not\s+to\s+hurt\s+(?:my\s+)?(?:boyfriend|girlfriend|partner|friend|roommate|someone|him|her|them)\b|\bi\s+am\s+scared\s+of\s+my\s+anger\s+around\s+(?:my\s+)?(?:boyfriend|girlfriend|partner|friend|roommate|someone)\b/;
const shortFirstPersonViolence = /\bi\s+(?:(?:have|had|just|already|accidentally|want\s+to|wanna|gonna|will|might|may|could|am\s+going\s+to|would\s+like\s+to|plan\s+to)\s+){0,3}(?:kill|killed|murder|murdered|stab|stabbed|shoot|shot|attack|attacked|hurt)\s+(?:(?:a|the|my|some)\s+)?(?:boy|girl|kid|child|person|someone|somebody|people|man|woman)\b/;
const uncertainHarm = /\bi\s+(?:might|may|could)\s+(?:kill|hurt|attack|stab|shoot)\s+(?:(?:a|the|my|some)\s+)?(?:boy|girl|kid|child|person|someone|somebody|people|man|woman)\b/;

export function classifyEnglishRisk(query: string): EnglishRisk {
  const clean = cleanEnglish(query);
  if ((selfHarm.test(clean) || /\bi\s+(?:dont|do\s+not)\s+want\s+to\s+live\b/.test(clean)) && !/\b(?:dont|do\s+not|never|wont|will\s+not)\s+want\s+to\s+(?:kill|hurt|harm|unalive)\s+myself\b/.test(clean)) return "self-harm";
  if ((victimThreat.test(clean) || /\bmy\s+(?:ex|boyfriend|girlfriend|partner)\s+(?:(?:is|was)\s+)?threaten(?:ing|ed|s)?\s+me\b|\bmy\s+(?:ex|boyfriend|girlfriend|partner)\s+(?:forced\s+me\s+to\s+have\s+sex|grabbed\s+my\s+throat|said\s+(?:he|she|they)\s+would\s+(?:kill|murder|hurt|attack)\s+me)\b/.test(clean)) && !fictionalContext.test(clean)) return "threatened-by-other";
  if ((violentConcern.test(clean) || uncertainHarm.test(clean)) && !fictionalContext.test(clean) && !/\bi\s+(?:killed|murdered|stabbed|shot|attacked|punched|choked|strangled|poisoned)\b/.test(clean)) return "harm-concern";
  if ((firstPersonViolence.test(clean) || firstPersonThreat.test(clean) || possiblePastViolence.test(clean) || shortFirstPersonViolence.test(clean) || /\bi\s+(?:tried|attempted)\s+to\s+(?:kill|murder|stab|shoot|attack)\s+(?:my\s+)?(?:boyfriend|girlfriend|partner|ex|roommate|friend|someone|him|her|them)\b/.test(clean)) && !deniedViolence.test(clean) && !fictionalContext.test(clean)) return "harm-to-others";
  return null;
}

export function searchEnglish(query: string): EnglishSearchHit[] {
  const normalized = cleanEnglish(query);
  // A contrast clause often states the real request after rejecting an earlier
  // topic: "not food, I need counseling" should not return food providers.
  let clean = normalized.split(/\b(?:but|instead|actually)\s+(?:i\s+)?(?:need|want|am\s+looking\s+for)\b/).at(-1)?.trim() || normalized;
  // A rejected need followed by an explicit replacement is not evidence for
  // the rejected category. Preserve the replacement clause for scoring.
  if (/\b(?:dont|do\s+not)\s+(?:need|want)\b/.test(clean)) {
    const replacement = [...clean.matchAll(/\bi\s+(?:need|want)\b/g)].at(-1);
    if (replacement && replacement.index > clean.search(/\b(?:dont|do\s+not)\s+(?:need|want)\b/)) clean = clean.slice(replacement.index);
  }
  if (!clean) return [];
  if (/^(?:i\s+)?(?:dont|do\s+not)\s+(?:need|want)\s+(?:any\s+)?(?:food|groceries|a\s+meal)(?:\s+(?:today|right\s+now))?$/.test(clean)) return [];
  if (/^(?:can\s+i\s+get\s+|i\s+need\s+|where\s+can\s+i\s+get\s+)?help\s+(?:right\s+)?now$/.test(clean)) return [{ id: "health-34", score: 125 }];
  const risk = classifyEnglishRisk(query);
  if (risk === "harm-to-others") return [];
  if (/\bfood\s+truck\s+(?:(?:app|website)\s+)?code\s+review\b/.test(clean)) return [];
  // These are ordinary figurative or non-health uses. Require a second, explicit
  // need before letting any overlapping word create a resource recommendation.
  const figurative = /\bhungry\s+for\s+(?:knowledge|success|attention|power|love|recognition)\b|\bfood\s+for\s+thought\b|\b(?:phone|computer|laptop|code|website|app|book|movie|bike|bicycle|scooter)\s+(?:is\s+)?(?:sick|depressing|broken|crashing?)\b|\bsick\s+of\s+(?:school|class|finals|studying)\b|\beat\s+my\s+words\b|\bfood\s+truck\s+(?:(?:app|website)\s+)?code\s+review\b|\b(?:im|i\s+am)\s+cooked\s+for\s+(?:finals|exams|class)\b/;
  if (figurative.test(clean) && !/\b(?:need|want|looking\s+for)\s+(?:food|a\s+meal|groceries|counseling|a\s+doctor|a\s+clinic)\b/.test(clean)) return [];
  const scores = new Map<string, number>();
  for (const { id, aliases, score } of serviceLexicon) {
    if (aliases.some((alias) => alias.test(clean))) scores.set(id, score);
  }
  for (const { id, patterns, score } of resourceTermPatterns) {
    if (patterns.some((pattern) => pattern.test(clean))) scores.set(id, Math.max(scores.get(id) || 0, score));
  }
  for (const { pattern, hits } of searchRules) {
    if (!pattern.test(clean)) continue;
    for (const hit of hits) scores.set(hit.id, Math.max(scores.get(hit.id) || 0, hit.score));
  }
  for (const { pattern, hits } of shortNeedRules) if (pattern.test(clean)) for (const hit of hits) scores.set(hit.id, Math.max(scores.get(hit.id) || 0, hit.score));
  if (/\b(?:clothes|clothing|outfits?|shoes|jackets?|shirts?|thrift\s+store|free\s+store|attire|suit)\b/.test(clean) && !/\b(?:donat(?:e|ing|ion)|sell|discard|throw\s+away)\b/.test(clean)) {
    scores.set("aggie-reuse", Math.max(scores.get("aggie-reuse") || 0, 135));
    if (/\b(?:professional|interview|business|career|suit)\b/.test(clean)) scores.set("lsa-professional-closet", 170);
    else scores.set("lgbtq-closet", Math.max(scores.get("lgbtq-closet") || 0, 75));
  }
  if (/\bgender\s+affirming\s+(?:clothes|clothing|wear|binder)\b/.test(clean) || (/\bbinders?\b/.test(clean) && /\b(?:gender|affirm(?:ing|ation)?|trans|chest|compression|dysphoria)\b/.test(clean))) scores.set("lgbtq-closet", 205);
  if (/\b(?:bike|bicycle)\b.{0,35}\b(?:flat|tire|air|checkup|diagnos(?:is|tic)|repair|brakes?)\b|\b(?:flat|tire|air|checkup|diagnos(?:is|tic)|repair|brakes?)\b.{0,35}\b(?:bike|bicycle)\b/.test(clean) && !/\bhelmet\b/.test(clean)) scores.set("bike-barn-checkup", 145);
  // Each added organization has its own reviewed service-name and need-phrase
  // profile. Broad routing is only a low-ranked fallback, never a substitute
  // for sentence intent or a safety override.
  const foodNeed = /\b(food|hungr(?:y|ier)|hunger|starv(?:e|ing)|meals?|eat|eating|grocer(?:y|ies)|produce|fruit|veggies|snacks?|vegetables|canned\s*food|food\s*insecurity)\b/.test(clean);
  const medicalFoodContext = /\b(food\s*poisoning|food\s*allergy|(?:cant|cannot)\s*keep\s*food\s*down|sick\s*after\s*eating|vomiting\s*after\s*eating|ate\s+bad\s+food\b.{0,45}\b(?:vomit|vomiting|sick|nauseous))\b/.test(clean);
  const preparedMealNeed = /\b(?:hot|warm|prepared|cooked)\s+meals?\b|\bfood\s*truck\b/.test(clean);
  const groceryNeed = /\b(?:grocer(?:y|ies)|pantry|canned\s*food|food\s*insecurity)\b/.test(clean);
  const produceNeed = /\b(?:fruit|vegetables?|veggies|produce)\b/.test(clean);
  const genericFoodBrowse = /^(?:(?:i\s+)?(?:need|want|looking\s+for)\s+)?(?:free\s+)?food(?:\s+on\s+campus)?$/.test(clean);
  const foodProfileMatches = (id: string) => genericFoodBrowse || (groceryNeed && !id.startsWith("fruit-veggie-")) || (produceNeed && id.startsWith("fruit-veggie-"));
  for (const profile of resourcePromptPatterns) {
    if (profile.aliases.some((pattern) => pattern.test(clean))) scores.set(profile.id, Math.max(scores.get(profile.id) || 0, 190));
    else if (profile.phrases.some((pattern) => pattern.test(clean))) scores.set(profile.id, Math.max(scores.get(profile.id) || 0, 125));
    else if (profile.broad === "food" && foodNeed && !medicalFoodContext && !preparedMealNeed && foodProfileMatches(profile.id)) scores.set(profile.id, Math.max(scores.get(profile.id) || 0, 42));
    else if (profile.broad === "period" && /\b(period|menstrual|tampon|pads?)\b/.test(clean)) scores.set(profile.id, Math.max(scores.get(profile.id) || 0, 45));
    else if (profile.broad === "safer-sex" && /\b(condoms?|lube|lubricant|safer?\s*sex)\b/.test(clean)) scores.set(profile.id, Math.max(scores.get(profile.id) || 0, 45));
    else if (profile.broad === "hygiene" && /\b(toiletr(?:y|ies)|hygiene\s*(?:items?|supplies)|period\s*(?:products?|supplies))\b/.test(clean)) scores.set(profile.id, Math.max(scores.get(profile.id) || 0, 45));
  }
  // Applying for benefits is not the same as picking up food; asking for
  // take-home produce is not a request for a prepared hot meal.
  const foodResourceIds = ["aggie-eats", "pantry", "freedge", ...resourcePromptPatterns.filter((profile) => profile.broad === "food").map((profile) => profile.id)];
  const withoutFoodStamps = clean.replace(/\bfood\s+stamps?\b/g, "");
  if (/\bfood\s+stamps?\b/.test(clean) && !/\b(?:food|hungry|meal|eat|groceries|pantry|produce)\b/.test(withoutFoodStamps)) {
    for (const id of foodResourceIds) scores.delete(id);
  }
  if (/\b(?:free|fresh)\s+(?:produce|vegetables?|veggies|fruit)\b/.test(clean) && !preparedMealNeed) {
    scores.delete("aggie-eats"); scores.delete("aggie-compass");
  }
  // Context beats coincidental words: survivor support is CARE, not a sex-supplies cart.
  if (scores.has("care") && !/\b(condom|dental\s*dam|lube|lubricant|birth\s*control|tampon|period\s*pad)\b/.test(clean)) scores.delete("love-lab");
  if (/\b(?:brakes?|knee|elbow|shoulder|mouse)\s+pads?\b|\bpads?\s+for\s+(?:my\s+)?(?:bike|brakes?|knee|elbow|shoulder|mouse)\b/.test(clean) && !/\b(?:period|menstrual|sex|contraception|condom|tampon)\b/.test(clean)) scores.delete("love-lab");
  if (risk === "threatened-by-other") { scores.clear(); scores.set("care", 180); }
  if (risk === "self-harm") { scores.clear(); scores.set("counseling", 180); scores.set("health-34", 90); }
  if (risk === "harm-concern") { scores.clear(); scores.set("counseling", 170); scores.set("health-34", 90); }
  if (/\bsick\s+of\s+(?:my\s+)?(?:boyfriend|girlfriend|partner)\b/.test(clean)) { scores.delete("acute-care"); scores.delete("health-34"); }
  if (medicalFoodContext || /\b(?:sick|nauseous|vomiting)\s+after\s+eating\b/.test(clean)) {
    for (const id of ["aggie-eats", "pantry", "freedge", "aggie-compass", ...resourcePromptPatterns.filter((profile) => profile.broad === "food").map((profile) => profile.id)]) scores.delete(id);
  }
  if (preparedMealNeed) {
    for (const id of ["pantry", "freedge", "aggie-compass", ...resourcePromptPatterns.filter((profile) => profile.broad === "food").map((profile) => profile.id)]) scores.delete(id);
  }
  // A relationship by itself is not a request for condoms or counseling.
  if (/\bnot\s+(?:hungry|starving)\b/.test(clean) && !/\b(food|meal|grocer|pantry)\b/.test(clean)) {
    scores.delete("aggie-eats"); scores.delete("pantry"); scores.delete("freedge"); scores.delete("aggie-compass");
    for (const profile of resourcePromptPatterns) if (profile.broad === "food") scores.delete(profile.id);
  }
  if (/\bnot\s+(?:food|hungry|a\s+meal|groceries)\b/.test(clean)) {
    for (const id of ["aggie-eats", "pantry", "freedge", "aggie-compass", ...resourcePromptPatterns.filter((profile) => profile.broad === "food").map((profile) => profile.id)]) scores.delete(id);
  }
  // Interpret time and place as modifiers of an established need. A landmark
  // alone never retrieves food; it only reranks food candidates at that place.
  if (!risk && foodNeed && !medicalFoodContext && !/\bnot\s+(?:food|hungry|a\s+meal|groceries)\b/.test(clean)) {
    if (/\b(?:tonight|late\s*night|after\s*hours|overnight)\b/.test(clean)) scores.set("freedge", Math.max(scores.get("freedge") || 0, 155));
    if (!preparedMealNeed) {
      const landmarks: { pattern: RegExp; ids: string[] }[] = [
        { pattern: /\b(?:near|at|around|by|in)\s+(?:the\s+)?(?:student\s+community\s+center|scc)\b/, ids: ["mobile-pantry-scc", "satellite-lgbtq", "satellite-srrc", "satellite-undocumented"] },
        { pattern: /\b(?:near|at|around|by|in)\s+(?:the\s+)?(?:arc|activities\s+and\s+recreation\s+center)\b/, ids: ["mobile-pantry-arc"] },
        { pattern: /\b(?:near|at|around|by|in)\s+(?:the\s+)?(?:south\s+coho|south\s+coffee\s+house)\b/, ids: ["fruit-veggie-coho"] },
        { pattern: /\b(?:near|at|around|by|in)\s+(?:the\s+)?hart\s+hall\b/, ids: ["satellite-hart"] },
      ];
      for (const { pattern, ids } of landmarks) if (pattern.test(clean)) for (const id of ids) scores.set(id, Math.max(scores.get(id) || 0, 45) + 110);
    }
  }
  if (!risk && /\b(?:tonight|late\s*night|after\s*hours|when\s+health\s+promotion\s+is\s+closed)\b/.test(clean) && /\b(?:condoms?|lube|lubricant|safer?\s*sex)\b/.test(clean)) {
    scores.set("love-lab-bag", Math.max(scores.get("love-lab-bag") || 0, 45) + 110);
  }
  return [...scores].filter(([, score]) => score >= 40).map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export function englishCrisisQuery(query: string) {
  const clean = cleanEnglish(query);
  return classifyEnglishRisk(query) === "self-harm" || /\b(mental\s*crisis|panic\s*attack|mental\s*breakdown|feel(?:ing)?\s*hopeless|fuck\s*(?:myself\s*)?up|can.t\s*take\s*it)\b/.test(clean);
}
