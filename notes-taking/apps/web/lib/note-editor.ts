/** True when a draft field change should create a note row. */
export function shouldCreateOnChange(
  previousTitle: string,
  previousContent: string,
  nextTitle: string,
  nextContent: string,
): boolean {
  const wasEmpty = previousTitle.trim() === "" && previousContent.trim() === "";
  const hasContent = nextTitle.trim() !== "" || nextContent.trim() !== "";
  return wasEmpty && hasContent;
}

export type NoteSavePayload = {
  title: string;
  content: string;
  category: number | null;
};

export function buildNotePayload(
  title: string,
  content: string,
  categoryId: number | null,
): NoteSavePayload {
  return {
    title,
    content,
    category: categoryId,
  };
}

export function notesListHref(categoryId?: number | null): string {
  if (categoryId === undefined || categoryId === null) return "/notes";
  return `/notes?category=${categoryId}`;
}

/**
 * Point the address bar at the persisted note without a Next.js navigation.
 * A full `router.replace` remounts `/notes/[id]` (and its loading UI), which
 * steals focus mid-keystroke after create-on-first-type.
 */
export function replaceNoteUrl(noteId: number): void {
  if (typeof window === "undefined") return;
  const href = `/notes/${noteId}`;
  window.history.replaceState(window.history.state, "", href);
}
