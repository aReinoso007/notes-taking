import { describe, expect, it } from "vitest";

import {
  buildNotePayload,
  notesListHref,
  replaceNoteUrl,
  shouldCreateOnChange,
} from "./note-editor";

describe("shouldCreateOnChange", () => {
  it("creates on first non-empty title", () => {
    expect(shouldCreateOnChange("", "", "Hello", "")).toBe(true);
  });

  it("creates on first non-empty content", () => {
    expect(shouldCreateOnChange("", "", "", "body")).toBe(true);
  });

  it("does not create when already non-empty", () => {
    expect(shouldCreateOnChange("Hi", "", "Hi!", "")).toBe(false);
  });

  it("does not create for still-empty drafts", () => {
    expect(shouldCreateOnChange("", "", "  ", "  ")).toBe(false);
  });
});

describe("buildNotePayload", () => {
  it("includes category id or null", () => {
    expect(buildNotePayload("t", "c", 3)).toEqual({
      title: "t",
      content: "c",
      category: 3,
    });
    expect(buildNotePayload("", "", null).category).toBeNull();
  });
});

describe("notesListHref", () => {
  it("omits category when unset", () => {
    expect(notesListHref()).toBe("/notes");
    expect(notesListHref(null)).toBe("/notes");
  });

  it("keeps category query when set", () => {
    expect(notesListHref(7)).toBe("/notes?category=7");
  });
});

describe("replaceNoteUrl", () => {
  it("updates the path without a full navigation", () => {
    replaceNoteUrl(42);
    expect(window.location.pathname).toBe("/notes/42");
  });
});
