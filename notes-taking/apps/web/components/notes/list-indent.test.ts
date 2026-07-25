import { afterEach, describe, expect, it } from "vitest";

import {
  indentListItem,
  outdentListItem,
} from "@/components/notes/MarkdownBodyField";

describe("list indent / outdent", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("nests the current item under the previous sibling on indent", () => {
    document.body.innerHTML = `<ul><li id="a">one</li><li id="b">two</li></ul>`;
    const b = document.getElementById("b") as HTMLLIElement;

    expect(indentListItem(b)).toBe(true);

    const a = document.getElementById("a") as HTMLLIElement;
    expect(a.querySelector("ul > li#b")).not.toBeNull();
    expect(b.textContent).toBe("two");
  });

  it("does not indent the first item", () => {
    document.body.innerHTML = `<ul><li id="a">one</li></ul>`;
    const a = document.getElementById("a") as HTMLLIElement;
    expect(indentListItem(a)).toBe(false);
  });

  it("lifts a nested item on outdent", () => {
    document.body.innerHTML = `<ul><li id="a">one<ul><li id="b">two</li></ul></li></ul>`;
    const b = document.getElementById("b") as HTMLLIElement;

    expect(outdentListItem(b)).toBe(true);

    const root = document.querySelector("ul");
    expect(root?.children.length).toBe(2);
    expect(document.getElementById("b")?.parentElement).toBe(root);
  });
});
