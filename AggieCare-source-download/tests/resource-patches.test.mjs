import test from "node:test";
import assert from "node:assert/strict";
import { isFreeFoodMapPoint, isMentalCrisisQuery } from "../app/resource-patches.ts";
import { resourceCategory, resourceCopy } from "../app/resource-localization.ts";

const searchCases = [
  ["肚子疼", false], ["胃痛", false], ["我现在很饿", false], ["vomit", false],
  ["my helmet broken", false], ["I killed my boyfriend", false], ["food now", false],
  ["I need a clinic", false], ["I feel sick", false], ["I need a condom", false],
  ["panic attack", true], ["I want to kill myself", true], ["mental crisis", true],
  ["I can't take it", true], ["I want to fuck myself up", true], ["我想死", true],
  ["心理危机", true], ["自杀", true], ["quiero morir", true], ["crisis mental", true],
  ["死にたい", true], ["자살", true], ["आत्महत्या", true], ["anxiety clinic", false],
  ["food and water", false],
];

test("25 search-intent examples do not confuse medical, food or safety with mental crisis", () => {
  assert.equal(searchCases.length, 25);
  for (const [query, expected] of searchCases) assert.equal(isMentalCrisisQuery(query), expected, query);
});

test("free-food map excludes paid dining without removing source data", () => {
  for (const name of ["ASUCD Coffee House (CoHo)", "Segundo Market", "King Hall Coffee", "Safeway-North Davis"]) {
    assert.equal(isFreeFoodMapPoint({ name, category: "Food", lat: 0, lng: 0 }), false, name);
  }
  for (const name of ["The Pantry", "Freedge - Silo", "Aggie Eats Food Truck", "All pEOPple Eat @ Educational Opportunity Program (EOP)"]) {
    assert.equal(isFreeFoodMapPoint({ name, category: "Food", lat: 0, lng: 0 }), true, name);
  }
  assert.equal(isFreeFoodMapPoint({ name: "Shields Library", category: "Water", lat: 0, lng: 0 }), true);
});

test("Chinese resource cards translate service details while preserving official names", () => {
  const fallback = { short: "Walk-in care", description: "English", cost: "English" };
  assert.equal(resourceCopy("acute-care", "zh", fallback).cost, "急性诊疗：UC SHIP $0／无 UC SHIP $40；心理危机咨询 $0");
  assert.equal(resourceCopy("care", "zh", fallback).short, "保密支持");
  assert.equal(resourceCopy("satellite-hart", "zh", fallback).short, "卫星食品储藏点");
  assert.equal(resourceCopy("acute-care", "en", fallback), fallback);
  assert.equal(resourceCategory("Medical", "zh"), "医疗");
});
