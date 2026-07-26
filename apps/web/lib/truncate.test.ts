import { describe, expect, it } from "vitest";

import { truncatePreview } from "./truncate";

describe("truncatePreview", () => {
  it("returns short text unchanged", () => {
    expect(truncatePreview("Hello world")).toBe("Hello world");
  });

  it("collapses whitespace and truncates with ellipsis", () => {
    const long = "word ".repeat(50);
    const result = truncatePreview(long, 20);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(21);
  });
});
