"use client";

import { marked } from "marked";
import {
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import TurndownService from "turndown";

import styles from "./MarkdownBodyField.module.css";

marked.setOptions({ breaks: true, gfm: true });

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "*",
  codeBlockStyle: "fenced",
});

function markdownToHtml(markdown: string): string {
  const trimmed = markdown.trim();
  if (!trimmed) return "";
  return marked.parse(markdown, { async: false }) as string;
}

function htmlToMarkdown(html: string): string {
  if (!html || html === "<br>" || html === "<div><br></div>") return "";
  return turndown.turndown(html).trimEnd();
}

/** Nest `li` under the previous sibling (Tab). */
export function indentListItem(li: HTMLLIElement): boolean {
  const prev = li.previousElementSibling;
  if (!(prev instanceof HTMLLIElement)) return false;

  const parentList = li.parentElement;
  if (!parentList || !/^[UO]L$/i.test(parentList.tagName)) return false;

  let sublist = Array.from(prev.children).find(
    (child): child is HTMLUListElement | HTMLOListElement =>
      child instanceof HTMLElement && /^[UO]L$/i.test(child.tagName),
  );

  if (!sublist) {
    sublist = document.createElement(
      parentList.tagName === "OL" ? "ol" : "ul",
    ) as HTMLUListElement | HTMLOListElement;
    prev.appendChild(sublist);
  }

  sublist.appendChild(li);
  return true;
}

/** Lift `li` one list level (Shift+Tab). */
export function outdentListItem(li: HTMLLIElement): boolean {
  const parentList = li.parentElement;
  if (!parentList || !/^[UO]L$/i.test(parentList.tagName)) return false;

  const parentLi = parentList.parentElement;
  if (!(parentLi instanceof HTMLLIElement)) return false;

  const grandList = parentLi.parentElement;
  if (!grandList || !/^[UO]L$/i.test(grandList.tagName)) return false;

  // Following siblings stay nested under the current item.
  const following: Element[] = [];
  let sibling = li.nextElementSibling;
  while (sibling) {
    following.push(sibling);
    sibling = sibling.nextElementSibling;
  }

  parentLi.after(li);

  if (following.length > 0) {
    let nested = Array.from(li.children).find(
      (child): child is HTMLUListElement | HTMLOListElement =>
        child instanceof HTMLElement && /^[UO]L$/i.test(child.tagName),
    );
    if (!nested) {
      nested = document.createElement(
        parentList.tagName === "OL" ? "ol" : "ul",
      ) as HTMLUListElement | HTMLOListElement;
      li.appendChild(nested);
    }
    for (const node of following) {
      nested.appendChild(node);
    }
  }

  if (!parentList.children.length) {
    parentList.remove();
  }

  return true;
}

function closestListItem(
  node: Node,
  root: HTMLElement | null,
): HTMLLIElement | null {
  let current: Node | null = node;
  while (current && current !== root) {
    if (current instanceof HTMLLIElement) return current;
    current = current.parentNode;
  }
  return null;
}

function closestBlock(
  node: Node,
  root: HTMLElement | null,
): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== root) {
    if (
      current instanceof HTMLElement &&
      /^(P|DIV|H1|H2|H3|H4|H5|H6)$/i.test(current.tagName)
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function placeCaretIn(el: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

type MarkdownBodyFieldProps = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
};

export function MarkdownBodyField({
  value,
  onChange,
  placeholder = "Pour your heart out...",
}: MarkdownBodyFieldProps) {
  const id = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  const seeded = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    if (!seeded.current) {
      el.innerHTML = markdownToHtml(value);
      lastEmitted.current = value;
      seeded.current = true;
      return;
    }

    if (value === lastEmitted.current) return;
    if (document.activeElement === el) return;

    el.innerHTML = markdownToHtml(value);
    lastEmitted.current = value;
  }, [value]);

  function emitFromDom() {
    const el = editorRef.current;
    if (!el) return;
    const markdown = htmlToMarkdown(el.innerHTML);
    lastEmitted.current = markdown;
    onChange(markdown);
  }

  function onInput(_event: FormEvent<HTMLDivElement>) {
    emitFromDom();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return;

    // Tab / Shift+Tab — nest or lift the current list item.
    if (event.key === "Tab") {
      const li = closestListItem(range.startContainer, editorRef.current);
      if (!li) return;

      const changed = event.shiftKey
        ? outdentListItem(li)
        : indentListItem(li);
      if (!changed) {
        // Prevent focus from leaving the editor even when indent is a no-op.
        event.preventDefault();
        return;
      }

      event.preventDefault();
      placeCaretIn(li);
      emitFromDom();
      return;
    }

    // Convert `- ` / `* ` / `1. ` at the start of a block into a list item.
    if (event.key !== " ") return;

    const block = closestBlock(range.startContainer, editorRef.current);
    if (!block || block.closest("li")) return;

    const text = block.textContent ?? "";
    const match = text.match(/^(\*|-|\d+\.)$/);
    if (!match) return;

    event.preventDefault();

    const list = document.createElement(
      match[1].endsWith(".") ? "ol" : "ul",
    );
    const item = document.createElement("li");
    item.appendChild(document.createElement("br"));
    list.appendChild(item);

    block.replaceWith(list);
    placeCaretIn(item);
    emitFromDom();
  }

  const empty = !(value ?? "").trim();

  return (
    <div className={styles.wrap}>
      <label className="visually-hidden" htmlFor={id}>
        Note content
      </label>
      <div
        id={id}
        ref={editorRef}
        className={styles.editor}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-placeholder={placeholder}
        data-empty={empty ? "true" : "false"}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={onInput}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
