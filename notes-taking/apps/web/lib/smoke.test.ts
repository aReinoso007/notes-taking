/** Smoke test — keeps CI green on an empty suite (Step 0). */
import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("passes", () => {
    expect(true).toBe(true);
  });
});
