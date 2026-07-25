import { describe, expect, it } from "vitest";

import { notesPathForCategory, parseCategoryFilter } from "./notes-filter";

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

describe("notesPathForCategory", () => {
  it("builds all vs filtered paths", () => {
    expect(notesPathForCategory()).toBe("/notes");
    expect(notesPathForCategory(3)).toBe("/notes?category=3");
  });
});
