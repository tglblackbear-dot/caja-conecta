import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, DEMO_LISTINGS, LOCATIONS, filterListings, phoneDigits } from "../js/catalog.js";

test("catalog includes the requested categories and localities", () => {
  assert.equal(CATEGORIES.length, 10);
  assert.equal(LOCATIONS.length, 15);
  assert.ok(CATEGORIES.includes("Gastronomia e Sabores Locais"));
  assert.ok(LOCATIONS.includes("Fazendas Grandes IV"));
});

test("search matches text in title, category, and neighborhood", () => {
  assert.equal(filterListings(DEMO_LISTINGS, { query: "bolos" }).length, 1);
  assert.equal(filterListings(DEMO_LISTINGS, { query: "gastronomia" }).length, 2);
  assert.equal(filterListings(DEMO_LISTINGS, { query: "palestina" }).length, 1);
});

test("category and location filters combine with the text query", () => {
  const results = filterListings(DEMO_LISTINGS, {
    query: "lanche",
    category: "Gastronomia e Sabores Locais",
    location: "Palestina"
  });
  assert.equal(results.length, 1);
  assert.equal(filterListings(DEMO_LISTINGS, {
    category: "Gastronomia e Sabores Locais",
    location: "Cajazeiras IV"
  }).length, 0);
});

test("phone normalization rejects missing and implausible numbers", () => {
  assert.equal(phoneDigits(null), "");
  assert.equal(phoneDigits("123-4567"), "");
  assert.equal(phoneDigits("+55 (11) 99999-1234"), "5511999991234");
});
