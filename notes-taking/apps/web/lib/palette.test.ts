import { describe, expect, it } from "vitest";

import { CATEGORY_PALETTE } from "./palette";

describe("CATEGORY_PALETTE", () => {
  it("matches the locked design tokens", () => {
    expect(CATEGORY_PALETTE).toEqual([
      "#EF9C66",
      "#FCDC94",
      "#C8CFA0",
      "#78ABA8",
      "#E8B4B8",
      "#D4B483",
      "#9DBFBB",
      "#E9C46A",
    ]);
  });
});
