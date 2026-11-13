import test from "node:test";
import assert from "node:assert/strict";
import { searchEnglish } from "../app/english-search.ts";

test("clothing needs find a free campus option without treating donations as requests", () => {
  for (const query of ["clothes", "free clothes", "I need a jacket", "where can I find shoes", "thrift store", "cheap outfits"]) {
    assert.equal(searchEnglish(query)[0]?.id, "aggie-reuse", query);
  }
  assert.equal(searchEnglish("I want to donate clothes").some((hit) => hit.id === "aggie-reuse"), false);
});
