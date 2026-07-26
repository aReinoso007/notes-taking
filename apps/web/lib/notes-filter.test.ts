import { describe, expect, it } from "vitest";

import {
  notesListPath,
  notesPathForCategory,
  parseCategoryFilter,
  parseSearchQuery,
} from "./notes-filter";

describe("parseCategoryFilter", () => {
  it("treats missing/all as unfiltered", () => {
    expect(parseCategoryFilter(null)).toBeUndefined();
    expect(parseCategoryFilter("")).toBeUndefined();
    expect(parseCategoryFilter("all")).toBeUndefined();
  });

  it("parses numeric category ids", () => {
    expect(parseCategoryFilter("12")).toBe(12);
  });

  it("rejects non-numeric values", () => {
    expect(parseCategoryFilter("abc")).toBeUndefined();
  });
});

describe("parseSearchQuery", () => {
  it("trims and defaults empty", () => {
    expect(parseSearchQuery(null)).toBe("");
    expect(parseSearchQuery("  hello  ")).toBe("hello");
  });
});

describe("notesListPath", () => {
  it("builds paths with category and/or search", () => {
    expect(notesListPath()).toBe("/notes");
    expect(notesListPath({ categoryId: 3 })).toBe("/notes?category=3");
    expect(notesListPath({ q: "banana" })).toBe("/notes?q=banana");
    expect(notesListPath({ categoryId: 3, q: " banana " })).toBe(
      "/notes?category=3&q=banana",
    );
  });

  it("omits blank search", () => {
    expect(notesListPath({ q: "   " })).toBe("/notes");
  });
});

describe("notesPathForCategory", () => {
  it("builds all vs filtered paths", () => {
    expect(notesPathForCategory()).toBe("/notes");
    expect(notesPathForCategory(3)).toBe("/notes?category=3");
    expect(notesPathForCategory(3, "hi")).toBe("/notes?category=3&q=hi");
  });
});
