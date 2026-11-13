import type { MapPoint } from "./map-data";

// Crisis messaging must inspect the student's words, not the expanded search
// index: a medical query can expand into resources that also mention crisis.
export function isMentalCrisisQuery(input: string) {
  const query = input.toLowerCase().trim().replace(/(?:没|沒有|没有|不).{0,3}(?:想)?(?:自杀|自殺|想死)/g, "");
  return /\b(?:mental\s+(?:health|crisis)|panic(?:\s+attack)?|suicid(?:e|al)|self[ -]?harm|hurt\s+myself|kill\s+myself|want\s+to\s+die|no\s+reason\s+to\s+live|depress(?:ed|ion)|mental\s+breakdown|feel(?:ing)?\s+hopeless|fuck\s*(?:myself\s*)?up|can.t\s+take\s+it)\b/.test(query)
    || /想死|自杀|自殺|活不下去|心理危机|心理危機|恐慌|崩溃|崩潰|焦虑|焦慮|抑郁|憂鬱|자살|죽고\s*싶|공황|死にたい|自殺|パニック|आत्महत्या|suicidio|quiero morir|crisis mental|attaque de panique|envie de mourir/.test(query);
}

// The UC Davis Food Access source also includes paid cafés and markets.
// Only known no-cost resources belong in a filter labelled "Free food".
export function isFreeFoodMapPoint(point: MapPoint) {
  if (point.category !== "Food") return true;
  return /pantry|freedge|aggie compass|aggie eats|fruit\s*(?:and|&)\s*veggie\s*up|all p[e]?ople eat|all peopple eat|eat well yolo/i.test(point.name);
}
