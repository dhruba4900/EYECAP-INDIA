import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCategoryNavigation,
  getEligibleNavigationCategories,
} from "../src/lib/category-navigation.ts";

const builtInCategories = [
  { id: "1", name: "EYEGLASSES", slug: "eyeglasses", isActive: true, showInNavigation: true, displayOrder: 1 },
  { id: "2", name: "SUNGLASSES", slug: "sunglasses", isActive: true, showInNavigation: true, displayOrder: 2 },
  { id: "3", name: "CONTACT LENSES", slug: "contact-lenses", isActive: true, showInNavigation: true, displayOrder: 3 },
  { id: "4", name: "SPECIAL POWER", slug: "special-power", isActive: true, showInNavigation: true, displayOrder: 4 },
  { id: "5", name: "SPECIAL EDITIONS", slug: "special-editions", isActive: true, showInNavigation: true, displayOrder: 5 },
];

test("preserves the five managed built-ins and their special-editions route", () => {
  const links = buildCategoryNavigation(builtInCategories);

  assert.deepEqual(
    links.map(({ label }) => label),
    [
      "EYEGLASSES",
      "SUNGLASSES",
      "CONTACT LENSES",
      "SPECIAL POWER",
      "SPECIAL EDITIONS",
    ]
  );
  assert.equal(links[4].href, "/special-editions");
});

test("does not include inactive, hidden, malformed, or unknown-eligibility categories", () => {
  const links = buildCategoryNavigation([
    ...builtInCategories,
    { id: "inactive", name: "Inactive", slug: "inactive", isActive: false, showInNavigation: true },
    { id: "hidden", name: "Hidden", slug: "hidden", isActive: true, showInNavigation: false },
    { id: "unknown", name: "Unknown status", slug: "unknown" },
    null,
  ]);

  assert.equal(links.length, builtInCategories.length);
  assert.ok(links.every(({ key }) => key !== "inactive" && key !== "hidden"));
});

test("includes a newly active custom category using its stable category ID", () => {
  const links = buildCategoryNavigation([
    ...builtInCategories,
    {
      id: "new-category-id",
      name: "New Collection",
      slug: "new-collection",
      isActive: true,
      showInNavigation: true,
      displayOrder: 0,
    },
  ]);

  assert.deepEqual(links.find(({ key }) => key === "new-category-id"), {
    key: "new-category-id",
    label: "NEW COLLECTION",
    href: "/products?category=new-collection",
  });
});

test("deduplicates category identity and keeps ALL COLLECTIONS out of dynamic links", () => {
  const links = buildCategoryNavigation([
    ...builtInCategories,
    { id: "custom-1", name: "Limited", slug: "limited", isActive: true, showInNavigation: true },
    { id: "custom-1", name: "Duplicate ID", slug: "duplicate-id", isActive: true, showInNavigation: true },
    { id: "custom-2", name: "Duplicate slug", slug: "limited", isActive: true, showInNavigation: true },
    { id: "all", name: "All Collections", slug: "all-collections", isActive: true, showInNavigation: true },
  ]);

  assert.equal(links.filter(({ label }) => label === "LIMITED").length, 1);
  assert.equal(links.some(({ label }) => label === "ALL COLLECTIONS"), false);
  assert.equal(new Set(links.map(({ key }) => key)).size, links.length);
  assert.equal(
    getEligibleNavigationCategories([
      { id: "all", name: "All Collections", slug: "all-collections", isActive: true, showInNavigation: true },
    ]).length,
    0
  );
});
