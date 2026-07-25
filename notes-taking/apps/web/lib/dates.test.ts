import { describe, expect, it } from "vitest";

import { formatCardDate, formatLastEdited } from "./dates";

describe("formatCardDate", () => {
  const noon = (y: number, m: number, d: number) => new Date(y, m, d, 12, 0, 0);

  it("returns today for the same local calendar day", () => {
    const now = noon(2024, 6, 21);
    expect(formatCardDate(new Date(2024, 6, 21, 0, 5, 0).toISOString(), now)).toBe(
      "today",
    );
    expect(formatCardDate(new Date(2024, 6, 21, 23, 59, 0).toISOString(), now)).toBe(
      "today",
    );
  });

  it("returns yesterday across the midnight boundary", () => {
    const now = noon(2024, 6, 21);
    expect(formatCardDate(new Date(2024, 6, 20, 23, 59, 0).toISOString(), now)).toBe(
      "yesterday",
    );
    expect(formatCardDate(new Date(2024, 6, 20, 0, 0, 0).toISOString(), now)).toBe(
      "yesterday",
    );
  });

  it("returns month and day without year for older dates", () => {
    const now = noon(2024, 6, 21);
    expect(formatCardDate(new Date(2024, 6, 16, 10, 0, 0).toISOString(), now)).toBe(
      "July 16",
    );
  });

  it("handles year change without showing the year on cards", () => {
    const now = noon(2025, 0, 2);
    expect(formatCardDate(new Date(2024, 11, 31, 18, 0, 0).toISOString(), now)).toBe(
      "December 31",
    );
  });
});

describe("formatLastEdited", () => {
  it("formats full timestamp with am/pm", () => {
    const iso = new Date(2024, 6, 21, 20, 39, 0).toISOString();
    expect(formatLastEdited(iso)).toBe("Last Edited: July 21, 2024 at 8:39pm");
  });

  it("uses 12 for midnight hour", () => {
    const iso = new Date(2024, 0, 1, 0, 5, 0).toISOString();
    expect(formatLastEdited(iso)).toBe("Last Edited: January 1, 2024 at 12:05am");
  });
});
