import { describe, expect, it } from "vitest";
import { marked } from "marked";
import TurndownService from "turndown";

marked.setOptions({ breaks: true, gfm: true });
const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "*",
});

describe("live markdown round-trip", () => {
  it("keeps a bullet list as markdown", () => {
    const html = marked.parse("* one\n* two", { async: false }) as string;
    const md = turndown.turndown(html);
    expect(md).toMatch(/\*\s+one/);
    expect(md).toMatch(/\*\s+two/);
  });

  it("renders emphasis from markdown", () => {
    const html = marked.parse("hello *world*", { async: false }) as string;
    expect(html).toContain("<em>world</em>");
  });
});
