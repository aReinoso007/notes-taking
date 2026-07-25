import { describe, expect, it } from "vitest";

import {
  hexToHsv,
  hsvToHex,
  normalizeHex,
  rgbToHex,
} from "./color";

describe("color helpers", () => {
  it("normalizes hex and blocks the Figma slice colour", () => {
    expect(normalizeHex("ef9c66")).toBe("#EF9C66");
    expect(normalizeHex("#9747FF")).toBeNull();
    expect(normalizeHex("orange")).toBeNull();
  });

  it("round-trips vivid colours through HSV", () => {
    const hex = "#EF9C66";
    const hsv = hexToHsv(hex);
    expect(hsv).not.toBeNull();
    const back = hsvToHex(hsv!.h, hsv!.s, hsv!.v);
    expect(hexToHsv(back)?.h).toBeCloseTo(hsv!.h, 0);
    expect(rgbToHex(255, 0, 0)).toBe("#FF0000");
  });
});
